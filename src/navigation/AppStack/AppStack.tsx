/**
 * Primary navigation stack of the app.
 * User is navigated here if onboarding is done or if profile is already setup.
 */
import React, { useEffect, useRef } from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import { rootNavigationRef } from '@navigation/rootNavigation';

import AcceptedDirectChat from '@screens/AcceptDirectChat/AcceptDirectChat';
import BlockedContacts from '@screens/BlockedContacts/BlockedContacts';
import { CallContextProvider } from '@screens/Calls/CallContext';
import IncomingCall from '@screens/Calls/IncomingCall';
import OngoingCall from '@screens/Calls/OngoingCall';
import ChatProfile from '@screens/ChatProfile/ChatProfile';
import PhoneContactList from '@screens/ContactList/PhoneContactList';
import ContactProfile from '@screens/ContactProfile/ContactProfile';
import ContactsScreen from '@screens/ContactsScreen/ContactsScreen';
import CreateBackupScreen from '@screens/CreateBackup/CreateBackupScreen';
import DefaultPermissionsScreen from '@screens/DefaultPermissions/DefaultPermissionsScreen';
import DeleteAccount from '@screens/DeleteAccount';
import DirectChat from '@screens/DirectChat/Chat';
import GiveUsFeedbackScreen from '@screens/Feedback/GiveUsFeedbackScreen';
import ForwardToContact from '@screens/ForwardToContact/ForwardToContact';
import GroupChat from '@screens/GroupChat/Chat';
import AllMembers from '@screens/GroupsV2/AllMembers';
import CreateNewGroup from '@screens/GroupsV2/CreateNewGroup';
import GroupProfile from '@screens/GroupsV2/GroupProfile';
import InviteGroupMembers from '@screens/GroupsV2/InviteGroupMembers';
import HelpScreen from '@screens/Help/HelpScreen';
import MediaViewer from '@screens/MediaViewer/MediaViewer';
import AccountSettings from '@screens/MyAccount';
import GroupSuperPortQRScreen from '@screens/NewGroupSuperPort/GroupSuperPortQRScreen';
import NewPortScreen from '@screens/NewPortScreen/NewPortScreen';
import QRScanner from '@screens/Scanner/QRScanner';
import ShareContact from '@screens/ShareContact/ShareContact';
import ContactPortQRScreen from '@screens/ShareContactScreen/ContactPortQRScreen';
import SharedMedia from '@screens/SharedMedia/SharedMedia';
import GalleryConfirmation from '@screens/ShareImage/GalleryConfirmation';
import SelectShareContacts from '@screens/ShareImage/SelectShareContacts';
import GroupTemplates from '@screens/Templates/GroupTemplates';
import Templates from '@screens/Templates/Templates';

import { checkForUpdates, getUpdateStatusKeyFromLocal } from '@utils/TermsAndConditions';

import { ConnectionModalProvider } from 'src/context/ConnectionModalContext';

import { AppStackParamList } from './AppStackTypes';
import BottomNavStack from './BottomNavStack/BottomNavStack';
import NewPortStack from './NewPortStack/NewPortStack';
import NewSuperPortStack from './NewSuperPortStack/NewSuperPortStack';
import { AppState } from 'react-native';
import { backgroundToForegroundOperations, performDebouncedCommonAppOperations } from '@utils/AppOperations';
import { addEventListener } from '@react-native-community/netinfo';


const Stack = createNativeStackNavigator<AppStackParamList>();

function AppStack() {
  const appState = useRef(AppState.currentState);
  const termsStackTrigger = useSelector(
    state => (state as any).triggerUpdateStatusRefetch.change,
  );
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      (async () => {
        await checkForUpdates();
      })();
    } else {
      // gets the object from localstorage and sets the state of modal to be shown
      (async () => {
        const localResponse = await getUpdateStatusKeyFromLocal();
        console.log('Checking if terms and conditions need accepting from useEffect trigger', localResponse);
        //if the key exist in localstorage with any value, wether both are same or indifferent, we will simply store that in state
        if (localResponse && (localResponse.needsToAccept || localResponse.shouldNotify)) {
          rootNavigationRef.reset({
            index: 0,
            routes: [
              {
                name: 'TermsStack',
                params: {
                  screen: 'AcceptTerms',
                  params: {
                    needsToAccept: localResponse.needsToAccept,
                  },
                },
              },
            ],
          });
        }
      })();
    }
  }, [termsStackTrigger]);

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
    <>
      <ConnectionModalProvider>
        {/* The call context provider helps screens related to calling communicate with
        one another */}
        <CallContextProvider>
          <Stack.Navigator
            initialRouteName={'HomeTab'}
            screenOptions={{ headerShown: false, orientation: 'portrait' }}>
            <Stack.Screen
              name="DefaultPermissionsScreen"
              component={DefaultPermissionsScreen}
            />
            <Stack.Screen
              name="PhoneContactList"
              component={PhoneContactList}
            />
            <Stack.Screen name="HomeTab" component={BottomNavStack} />
            <Stack.Screen name="DirectChat" component={DirectChat} />
            <Stack.Screen name="ChatProfile" component={ChatProfile} />
            <Stack.Screen name="ContactProfile" component={ContactProfile} />
            <Stack.Screen name="GroupChat" component={GroupChat} />
            <Stack.Screen name="GroupProfile" component={GroupProfile} />
            <Stack.Screen name="AccountSettings" component={AccountSettings} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccount} />
            <Stack.Screen
              name="ForwardToContact"
              component={ForwardToContact}
            />
            <Stack.Screen name="ShareContact" component={ShareContact} />
            <Stack.Screen
              name="SelectShareContacts"
              component={SelectShareContacts}
            />
            <Stack.Screen
              name="GalleryConfirmation"
              component={GalleryConfirmation}
            />
            <Stack.Screen name="SharedMedia" component={SharedMedia} />
            {/* <Stack.Screen name="Isolation" component={Isolation} /> */}
            <Stack.Screen name="CreateNewGroup" component={CreateNewGroup} />
            <Stack.Screen
              name="GiveUsFeedbackScreen"
              component={GiveUsFeedbackScreen}
            />
            <Stack.Screen name="MediaViewer" component={MediaViewer} />
            <Stack.Screen name="Scan" component={QRScanner} />
            <Stack.Screen name="BlockedContacts" component={BlockedContacts} />
            <Stack.Screen name="HelpScreen" component={HelpScreen} />
            <Stack.Screen name="Templates" component={Templates} />
            <Stack.Screen name="InviteGroupMembers" component={InviteGroupMembers} />
            <Stack.Screen name="AllMembers" component={AllMembers} />
            <Stack.Screen name="GroupTemplates" component={GroupTemplates} />
            <Stack.Screen name="NewPortScreen" component={NewPortScreen} />
            <Stack.Screen name="NewPortStack" component={NewPortStack} />
            <Stack.Screen
              name="NewSuperPortStack"
              component={NewSuperPortStack}
            />
            <Stack.Screen name="IncomingCall" component={IncomingCall} />

            <Stack.Screen
              name="OngoingCall"
              component={OngoingCall}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="ContactsScreen" component={ContactsScreen} />
            <Stack.Screen name="CreateBackupScreen" component={CreateBackupScreen} />
            <Stack.Screen name="ContactPortQRScreen" component={ContactPortQRScreen} />
            <Stack.Screen name="AcceptDirectChat" component={AcceptedDirectChat} />
            <Stack.Screen name="GroupSuperPortQRScreen" component={GroupSuperPortQRScreen} />
          </Stack.Navigator>
        </CallContextProvider>
      </ConnectionModalProvider>
    </>
  );
}

export default AppStack;
