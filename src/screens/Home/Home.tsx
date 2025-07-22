/**
 * The Home screen is where your all your connections are displayed, along with
 * a few other neat features.
 * screen id: 5
 */

import React, {useCallback, useEffect, useMemo, useReducer, useState} from 'react';
import {
  Animated,
  AppState,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  View,
} from 'react-native';

import notifee, {EventType} from '@notifee/react-native';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';

import {useColors} from '@components/colorGuide';
import {isIOS} from '@components/ComponentUtils';
import {CustomStatusBar} from '@components/CustomStatusBar';
import {GestureSafeAreaView} from '@components/GestureSafeAreaView';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import LoadingBottomSheet from '@components/Reusable/BottomSheets/AddingContactBottomSheet';
import SearchBar from '@components/SearchBar';
import {Height, Spacing, Width} from '@components/spacingGuide';
import useSVG from '@components/svgGuide';

import {BottomNavStackParamList} from '@navigation/AppStack/BottomNavStack/BottomNavStackTypes';

import {useCallContext} from '@screens/Calls/CallContext';
import NewConnectionsBottomsheet from '@screens/Home/components/CreateNewConnectionsBottomsheet';

import {performDebouncedCommonAppOperations} from '@utils/AppOperations';
import {loadHomeScreenConnections} from '@utils/Connections/onRefresh';
import {MessageStatus} from '@utils/Messaging/interfaces';
import {performNotificationRouting, resetAppBadge} from '@utils/Notifications';
import {cleanDeleteReadPort} from '@utils/Ports';
import {getProfileInfo} from '@utils/Profile';
import {ChatType} from '@utils/Storage/DBCalls/connections';

import {useTheme} from 'src/context/ThemeContext';

import BackupReminder from './components/BackupReminder';
import HomescreenPlaceholder from './components/HomescreenPlaceholder';
import HomeTopbar from './components/HomeTopbar';
import Tile, {TileProps} from './Tile';

const MINIMUM_CONNECTIONS = 2;
type Props = NativeStackScreenProps<BottomNavStackParamList, 'Home'>;

type DisplayConnections = {
  _all: TileProps[];
  filter: string;
  matching: TileProps[];
  hasConnection: boolean;
  initialLoadComplete: boolean;
};

type ConnectionAction =
  | {
      event: 'updateAll';
      payload: TileProps[];
    }
  | {
      event: 'updateFilter';
      payload: string;
    };

/**
 * Reducer to manage connections in UI state
 * @param state
 * @param action
 * @returns updated state
 */
function connectionReducer(
  state: DisplayConnections,
  action: ConnectionAction,
) {
  const currentState = {...state};
  switch (action.event) {
    case 'updateAll':
      currentState._all = action.payload;
      currentState.initialLoadComplete = true;
      currentState.hasConnection = action.payload.length > 0;
      break;
    case 'updateFilter':
      currentState.filter = action.payload;
      break;
  }
  // Apply the filter
  if ('' === currentState.filter) {
    currentState.matching = currentState._all;
    return currentState;
  }
  currentState.matching = currentState._all.filter(connection =>
    connection.name.toLowerCase().includes(currentState.filter.toLowerCase()),
  );
  console.log('currentState', currentState);
  return currentState;
}

const Home = ({navigation, route}: Props) => {
  const {initialiseCallKeep} = useCallContext();
  // If we got here with an initial chat request, honour it
  useMemo(() => {
    if (route.params) {
      const {initialChatType, chatData} = route.params;
      if (ChatType.direct === initialChatType) {
        navigation.push('DirectChat', chatData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params]);

  /**
   * Set up handlers for notification events
   */
  useEffect(() => {
    // On iOS, this is a foreground event
    if (isIOS) {
      const unsubscribeNotifeeForegroundListener = notifee.onForegroundEvent(
        ({type, detail}) => {
          //If data exists for the notification
          if (type !== EventType.PRESS || !detail.notification?.data) {
            console.log('OOps');
            return;
          }
          performNotificationRouting(detail.notification.data, navigation);
        },
      );
      return unsubscribeNotifeeForegroundListener;
    }
    // On android, you get the initial notification
    const appStateListener = AppState.addEventListener(
      'change',
      async newAppState => {
        if (newAppState === 'active') {
          console.log('Checking');
          const notificationEvent = await notifee.getInitialNotification();
          if (!notificationEvent?.notification?.data) {
            return;
          }
          console.log('boo');
          performNotificationRouting(
            notificationEvent.notification.data,
            navigation,
          );
        }
      },
    );

    return appStateListener.remove;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [lastBackupTime, setLastBackupTime] = useState<string | undefined>(undefined);
  const [hideReminder, setHideReminder] = useState<boolean>(false);

  const onBackupPress = useCallback(() => {
    navigation.push('CreateBackupScreen');
  }, [navigation]);

  const onClosePress = useCallback(() => {
    setHideReminder(true);
  }, [setHideReminder]);

  useEffect(() => {
    (async () => {
      // This is to ensure that the profile is loaded to store the first time the user opens the app
      const profile = await getProfileInfo();
      setLastBackupTime(profile?.lastBackupTime || '');
    })();
  }, []);

  // This useFocusEffect asks for permissions that are absolutely necessary in
  // A very annoying manner
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        console.log(
          'initial notification',
          await notifee.getInitialNotification(),
        );
        // Parallely update all the significant things
        Promise.allSettled([
          dispatchConnectionAction({
            event: 'updateAll',
            payload: await loadHomeScreenConnections(),
          }),
          // Call permissions to set up callkeep
          await initialiseCallKeep(),
          resetAppBadge(),
        ]);
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      return () => {
        // This clears the filter when navigating away from this screen
        dispatchConnectionAction({event: 'updateFilter', payload: ''});
      };
    }, []),
  );

  const colors = useColors();
  const {themeValue} = useTheme();
  const styles = styling(colors);
  const ping: any = useSelector(state => state.ping.ping);

  // Initialise our connections state
  const [connections, dispatchConnectionAction] = useReducer(
    connectionReducer,
    {
      _all: [],
      matching: [],
      filter: '',
      hasConnection: false,
      initialLoadComplete: false,
    },
  );

  // To track a selected port, helps with "Stop adding" and stuff
  const [selectedPortProps, setSelectedPortProps] = useState<
    (TileProps & {isReadPort: true}) | null
  >(null);

  // This is for the little loader when you pull down on the home screen
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [openConnectionsBottomsheet, setOpenConnectionsBottomsheet] =
    useState<boolean>(false);

  const svgArray = [
    {
      assetName: 'RoundPlus',
      light: require('@assets/light/icons/RoundPlus.svg').default,
      dark: require('@assets/dark/icons/RoundPlus.svg').default,
    },
    {
      assetName: 'HomePlaceholderIcon',
      light: require('@assets/light/icons/HomePlaceholderIcon.svg').default,
      dark: require('@assets/dark/icons/HomePlaceholderIcon.svg').default,
    },
    {
      assetName: 'RoundScan',
      light: require('@assets/light/icons/RoundScan.svg').default,
      dark: require('@assets/dark/icons/RoundScan.svg').default,
    },
  ];
  const svgResults = useSVG(svgArray);
  const RoundPlus = svgResults.RoundPlus;
  const RoundScan = svgResults.RoundScan;
  const HomePlaceholderIcon = svgResults.HomePlaceholderIcon;
  // loads up connections on every ping
  useEffect(() => {
    (async () => {
      dispatchConnectionAction({
        event: 'updateAll',
        payload: await loadHomeScreenConnections(),
      });
    })();
  }, [ping]);

  // This animation helps render placeholder tiles while connections load
  const opacityAnimation = useMemo(() => new Animated.Value(1), []);
  useEffect(() => {
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnimation, {
          toValue: 0.5,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    if (!connections.initialLoadComplete) {
      breathingAnimation.start();
    } else {
      breathingAnimation.stop();
      opacityAnimation.setValue(1);
    }
    return () => {
      breathingAnimation.stop();
    };
  }, [opacityAnimation, connections.initialLoadComplete]);



  return (
    <>
      <CustomStatusBar
        backgroundColor={colors.background2}
        theme={colors.theme}
      />
      <GestureSafeAreaView backgroundColor={colors.background2}>
        <HomeTopbar
          unread={connections.matching.reduce(
            (acc, cur) =>
              (acc +=
                cur.readStatus === MessageStatus.latest
                  ? cur.newMessageCount
                  : 0),
            0,
          )}
        />
        <KeyboardAvoidingView
          behavior={isIOS ? 'padding' : 'height'}
          keyboardVerticalOffset={isIOS ? 50 : 0}
          style={styles.scrollViewContainer}>
          <View style={{flex: 1}}>
            {!connections.initialLoadComplete ? (
              <Animated.View style={{opacity: opacityAnimation}}>
                <View style={styles.tilePlaceholderContainer}>
                  {Array.from({length: 10}).map((_, index) => (
                    <View
                      key={index}
                      style={StyleSheet.compose(styles.tilePlaceholder, {
                        backgroundColor:
                          themeValue === 'light' ? '#CFCCD6' : '#27272B',
                      })}
                    />
                  ))}
                </View>
              </Animated.View>
            ) : (
              <>
                {connections.hasConnection ? (
                  <FlatList
                    keyboardShouldPersistTaps={'handled'}
                    data={connections.matching}
                    renderItem={element => (
                      <Tile
                        {...element.item}
                        setSelectedPortProps={setSelectedPortProps}
                      />
                    )}
                    style={styles.chats}
                    scrollEnabled={connections.matching.length > 0}
                    ListHeaderComponent={
                      <View style={styles.barWrapper}>
                        <SearchBar
                          style={styles.search}
                          searchText={connections.filter}
                          setSearchText={(filter: string) =>
                            dispatchConnectionAction({
                              event: 'updateFilter',
                              payload: filter,
                            })
                          }
                          placeholder={'Search for chats'}
                        />
                        <BackupReminder
                          lastBackupTime={lastBackupTime}
                          hideReminder={hideReminder}
                          onBackupPress={onBackupPress}
                          onClosePress={onClosePress}
                        />
                      </View>
                    }
                    ListFooterComponent={
                      connections.matching.length > MINIMUM_CONNECTIONS ||
                      connections.filter.length > 0 ? (
                        <View style={{height: Height.bottombar}} />
                      ) : (
                        <View style={styles.placeholdercard}>
                          <HomescreenPlaceholder
                          connectionsMade={connections.matching.length}
                            onPlusPress={() =>
                              setOpenConnectionsBottomsheet(true)
                            }
                          />
                          <View style={{height: Height.bottombar}} />
                        </View>
                      )
                    }
                    refreshing={refreshing}
                    onRefresh={async () => {
                      setRefreshing(true);
                      performDebouncedCommonAppOperations();
                      setRefreshing(false);
                    }}
                    keyExtractor={connection => connection.chatId}
                    ListEmptyComponent={() => (
                      <View
                        style={{
                          height: 100,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <NumberlessText
                          textColor={colors.text.subtitle}
                          fontSizeType={FontSizeType.l}
                          fontWeight={FontWeight.rg}>
                          No matching chats found
                        </NumberlessText>
                      </View>
                    )}
                  />
                ) : (
                  <View style={styles.placeholder}>
                    <HomePlaceholderIcon
                      width={Width.screen - 2 * Spacing.xl}
                    />
                    <View style={styles.placeholdercard}>
                      <HomescreenPlaceholder
                      connectionsMade={connections.matching.length}
                        onPlusPress={() => setOpenConnectionsBottomsheet(true)}
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
        <RoundScan
          onPress={() => navigation.push('Scan')}
          style={styles.scanButton}
        />
        <RoundPlus
          onPress={() => {
            setOpenConnectionsBottomsheet(true);
          }}
          style={styles.plusButton}
        />
        <NewConnectionsBottomsheet
          visible={openConnectionsBottomsheet}
          onClose={() => setOpenConnectionsBottomsheet(false)}
          navigation={navigation}
        />
        <LoadingBottomSheet
          visible={selectedPortProps ? true : false}
          onClose={() => setSelectedPortProps(null)}
          title={'Adding new contact...'}
          onStopPress={async () => {
            await cleanDeleteReadPort(selectedPortProps!.chatId);
          }}
        />
      </GestureSafeAreaView>
    </>
  );
};

const styling = (colors: any) =>
  StyleSheet.create({
    chats: {
      flex: 1,
      backgroundColor: colors.background2,
    },
    barWrapper: {
      backgroundColor: colors.background2,
      paddingHorizontal: Spacing.s,
      paddingVertical: Spacing.s,
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    search: {
      backgroundColor: colors.search,
      width: '100%',
      flexDirection: 'row',
      height: 44,
      alignItems: 'center',
      borderRadius: Spacing.xml,
    },
    tilePlaceholder: {
      height: 91,
      marginHorizontal: Spacing.s,
      marginBottom: Spacing.s,
      borderRadius: 16,
    },
    tilePlaceholderContainer: {
      flex: 1,
      justifyContent: 'flex-start',
      paddingVertical: Spacing.m,
    },
    scrollViewContainer: {
      flex: 1,
      width: '100%',
      flexDirection: 'column',
      justifyContent: 'flex-start',
    },
    plusButton: {
      position: 'absolute',
      bottom: Spacing.l,
      right: Spacing.l,
    },
    scanButton: {
      position: 'absolute',
      bottom: Spacing.xxxxl,
      right: Spacing.l,
    },
    placeholder: {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.l,
    },
    placeholdercard: {
      marginTop: Spacing.xl,
      marginHorizontal: Spacing.s,
    },
  });

export default Home;
