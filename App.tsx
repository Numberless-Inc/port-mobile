/**
 * Numberless Inc's messaging client app Port.
 * This screen is responsible for:
 * 1. Sets up Root Stack to decide if the user needs to be navigated to Onboarding or Home (based on if profile is setup)
 * 2. Sets up background operations and periodic foreground operations
 */

import React, {useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';

import {addEventListener} from '@react-native-community/netinfo';
import {NavigationContainer} from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import BootSplash from 'react-native-bootsplash';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';

import Toast from '@components/Modals/Toast';

import {SENTRY_DSN} from '@configs/api';

import {rootNavigationRef} from '@navigation/rootNavigation';
import {RootStack} from '@navigation/RootStack';

import CriticalError from '@screens/CriticalError';

import {
  backgroundToForegroundOperations,
  performDebouncedCommonAppOperations,
} from '@utils/AppOperations';
import {getBackupIntervalInStorage} from '@utils/Backup';
import {getDeveloperModeFromStorage, turnOnDeveloperMode} from '@utils/DeveloperMode';
import {
  foregroundMessageHandler,
  initialiseFCM,
} from '@utils/Messaging/PushNotifications/fcm';
import {checkProfileCreated} from '@utils/Profile';
import runMigrations from '@utils/Storage/Migrations';
import {ProfileStatus} from '@utils/Storage/RNSecure/secureProfileHandler';
import {wait} from '@utils/Time';

import {ThemeProvider} from 'src/context/ThemeContext';
import {ToastProvider} from 'src/context/ToastContext';

import store from './src/store/appStore';

// We only want sentry enabled for production builds.
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,
  });
}

function App(): JSX.Element {
  const appState = useRef(AppState.currentState);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>(
    ProfileStatus.unknown,
  );
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  //checks if profile setup is done
  const readinessChecks = async () => {
    console.log('readinessChecks');
    try {
      //need to run before anything else
      await runMigrations();
      //can be run asynchronously
      initialiseFCM();
      //checks if developer mode is turned on
      const developerMode = await getDeveloperModeFromStorage();
      await getBackupIntervalInStorage();
      if (developerMode) {
        turnOnDeveloperMode();
      }
      //checks if profile setup is done
      const status = await checkProfileCreated();
      setProfileStatus(status);
    } catch (error) {
      console.error('Error in readinessChecks', error);
    }
  };

  useEffect(() => {
    readinessChecks();
    // default way to handle new messages in the foreground
    foregroundMessageHandler();
  }, []);

  useEffect(() => {
    // Only proceed if navigation is ready AND profile status is determined
    if (isNavigationReady && profileStatus !== ProfileStatus.unknown) {
      console.log('Navigation ready and profile status known, navigating...');
      if (profileStatus === ProfileStatus.created) {
        // Reset the stack to AppStack, removing OnboardingStack from history
        rootNavigationRef.reset({
          index: 0,
          routes: [{name: 'AppStack'}],
        });
      } else {
        // Assuming 'failed' is the only other non-unknown status leading to navigation
        // Reset the stack to OnboardingStack
        rootNavigationRef.reset({
          index: 0,
          routes: [{name: 'OnboardingStack'}],
        });
      }
      // Hide splash screen after navigation logic is decided
      wait(500).then(() => {
        BootSplash.hide({fade: false});
      });
    } else {
      console.log(
        `Navigation not ready or profile status unknown (isNavigationReady: ${isNavigationReady}, profileStatus: ${profileStatus})`,
      );
    }
    // This effect should re-run if either navigation readiness or profile status changes
  }, [isNavigationReady, profileStatus]);

  /**
   * Setup background or foreground operations according to app state.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      //If app has come to the foreground.
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        backgroundToForegroundOperations();
      }

      appState.current = nextAppState;
    });
    // Detects app going online-offline.
    const unsubscribe = addEventListener(state => {
      //Performs operation if the app is connected to any valid network (might not have internet access though)
      if (state.isConnected) {
        performDebouncedCommonAppOperations();
      }
    });
    return () => {
      subscription.remove();
      unsubscribe();
    };
  }, []);

  return (
    <Sentry.ErrorBoundary fallback={<CriticalError />}>
      <Provider store={store}>
        <ThemeProvider>
            <SafeAreaProvider>
              <ToastProvider>
                <NavigationContainer
                  ref={rootNavigationRef}
                  onReady={() => {
                    console.log('Navigation container reported ready');
                    setIsNavigationReady(true);
                  }}>
                  <RootStack />
                </NavigationContainer>
                <Toast />
              </ToastProvider>
            </SafeAreaProvider>
        </ThemeProvider>
      </Provider>
    </Sentry.ErrorBoundary>
  );
}

export default Sentry.wrap(App);
