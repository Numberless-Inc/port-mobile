import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { screen } from '@components/ComponentUtils';
import CustomKeyboardAvoidingView from '@components/CustomKeyboardAvoidingView';
import { CustomStatusBar } from '@components/CustomStatusBar';
import DynamicColors from '@components/DynamicColors';
import { GestureSafeAreaView } from '@components/GestureSafeAreaView';
import BlurViewModal from '@components/Reusable/BlurView/BlurView';
import DualActionBottomSheet from '@components/Reusable/BottomSheets/DualActionBottomSheet';
import ReportMessageBottomSheet from '@components/Reusable/BottomSheets/ReportMessageBottomSheet';
import RichReactionsBottomsheet from '@components/Reusable/BottomSheets/RichReactionsBottomsheet';

import { DEFAULT_AVATAR } from '@configs/constants';
import { messageReportCategories } from '@configs/reportingCategories';

import { AppStackParamList } from '@navigation/AppStack/AppStackTypes';

//import store from '@store/appStore';
import ChatTopbar from '@screens/Chat/ChatTopbar';
import Disconnected from '@screens/Chat/Disconnected';
import { MessageActionsBar } from '@screens/Chat/MessageActionsBar';
import MessageBar from '@screens/Chat/MessageBar';

import store from '@store/appStore';
import { TRIGGER_TYPES } from '@store/triggerRedraw';

import { performDebouncedCommonAppOperations } from '@utils/AppOperations';
import DirectChat from '@utils/DirectChats/DirectChat';
import { DisplayableContentTypes } from '@utils/Messaging/interfaces';
import { toggleRead } from '@utils/Storage/connections';
import { DirectPermissions } from '@utils/Storage/DBCalls/permissions/interfaces';
import { TemplateParams } from '@utils/Storage/DBCalls/templates';
import { getLatestMessages } from '@utils/Storage/messages';
import { useListenForTrigger } from '@utils/TriggerTools/RedrawTriggerListener/useListenForTrigger';

import { AudioPlayerProvider } from 'src/context/AudioPlayerContext';
import { useTheme } from 'src/context/ThemeContext';

import { ChatContextProvider, useChatContext } from './ChatContext';
import { MessageBarActionsContextProvider } from './ChatContexts/MessageBarActions';
import {
  MessageSelectionMode,
  SelectionContextProvider,
  useSelectionContext,
} from './ChatContexts/SelectedMessages';
import ChatList from './ChatList';


type Props = NativeStackScreenProps<AppStackParamList, 'DirectChat'>;

interface ReportingTypes {
  index: number;
  title: string;
}
/**
 * Renders a chat screen. The chatlist that is rendered is INVERTED, which means that any `top` function is a `bottom` function and vice versa.
 * @returns Component for rendered chat window
 */
function Chat({ route }: Props) {
  const {
    chatId,
    isConnected,
    profileUri,
    name,
    isAuthenticated,
    ifTemplateExists = undefined, // if template is selected from templates screen
  } = route.params;
  return (
    <MessageBarActionsContextProvider>
      <SelectionContextProvider>
        <ChatContextProvider
          chatId={chatId}
          connected={isConnected}
          avatar={profileUri}
          displayName={name}
          isGroupChat={false}
          authenticated={isAuthenticated}>
          <ChatScreen ifTemplateExists={ifTemplateExists} />
        </ChatContextProvider>
      </SelectionContextProvider>
    </MessageBarActionsContextProvider>
  );
}

function ChatScreen({ ifTemplateExists }: { ifTemplateExists?: TemplateParams }) {
  //chat screen context
  const {
    chatId,
    isConnected,
    setProfileUri,
    name,
    setName,
    setMessagesLoaded,
    messages,
    setMessages,
    showDeleteForEveryone,
    showReportModal,
    setShowReportModal,
    openDeleteMessageModal,
    setOpenDeleteMessageModal,
    performDelete,
    performGlobalDelete,
    setIsAuthenticated,
    isPopUpVisible,
    togglePopUp,
    isEmojiSelectorVisible,
    setIsEmojiSelectorVisible,
    setIsConnected,
  } = useChatContext();

  const {
    selectedMessages,
    selectionMode,
    setSelectedMessages,
    setSelectionMode,
    richReactionMessage,
    setRichReactionMessage,
  } = useSelectionContext();

  const [permissionsId, setPermissionsId] = useState<string | null | undefined>(
    null,
  );
  const [permissions, setPermissions] = useState<
    DirectPermissions | null | undefined
  >(null);
  //state for whether slider is open
  const [sliderOpen, setSliderOpen] = useState<boolean>(true);

  //ref for chat top bar
  const chatTopBarRef = useRef<{ moveSliderIntermediateOpen: () => void }>(null);
  //function to move slider intermediate open
  const moveSliderIntermediateOpen = () => {
    if (chatTopBarRef.current) {
      chatTopBarRef.current.moveSliderIntermediateOpen(); // Call the function via ref
    }
  };

  //shared value for whether screen is clickable
  const isScreenClickable = useSharedValue(true);

  //pointer events for screen based on whether access slider is open or closed.
  const [pointerEvents, setPointerEvents] = useState<
    'auto' | 'none' | 'box-none' | 'box-only'
  >('auto');

  //react to changes in isScreenClickable
  useAnimatedReaction(
    () => isScreenClickable.value,
    value => {
      runOnJS(setPointerEvents)(value ? 'auto' : 'box-only');
      runOnJS(setSliderOpen)(value ? false : true);
    },
  );

  //cursor for number of messages on screen
  const [cursor, setCursor] = useState(50);
  const navigation = useNavigation();

  //re-render trigger
  const newMessageTrigger = useListenForTrigger(TRIGGER_TYPES.NEW_MESSAGE);
  //pings need to be deprecated in favor of new trigger system.
  const ping: any = useSelector(state => (state as any).ping.ping);

  const [onReportSubmitted, setReportSubmitted] = useState(false);
  const [selectedReportOption, setSelectedReportOption] =
    useState<ReportingTypes>(messageReportCategories[0]);
  const [otherReport, setOtherReport] = useState('');
  //effect runs when screen is focused
  //retrieves name of connection
  //reads intial messages from messages storage.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        store.dispatch({
          type: 'ACTIVE_CHAT_CHANGED',
          payload: chatId,
        });
        const dataHandler = new DirectChat(chatId);
        const chatData = await dataHandler.getChatData();
        setPermissionsId(chatData.permissionsId);
        setName(chatData.name);
        setProfileUri(
          chatData.displayPic ? chatData.displayPic : DEFAULT_AVATAR,
        );
        setIsConnected(!chatData.disconnected);
        setIsAuthenticated(chatData.authenticated);
        //set saved messages
        const resp = await getLatestMessages(chatId, cursor);
        setMessages(resp);
        //Notifying that initial message load is complete.
        setMessagesLoaded(true);
        setPermissions(await dataHandler.getPermissions());
        performDebouncedCommonAppOperations();
      })();

      return () => {
        //On losing focus, call this
        store.dispatch({
          type: 'ACTIVE_CHAT_CHANGED',
          payload: undefined,
        });
      };
      // eslint-disable-next-line
    }, [chatId]),
  );

  useEffect(() => {
    (async () => {
      // Guard against being in the background state
      // This helps prevent read receipts from being sent when they shouldn't be
      if (AppState.currentState !== 'active') {
        console.log(
          '[PING] Skipping redraw on chat screen since app is not foregrounded',
        );
        return;
      }
      try {
        const dataHandler = new DirectChat(chatId);
        const chatData = await dataHandler.getChatData();
        setIsConnected(!chatData.disconnected);
        setIsAuthenticated(chatData.authenticated);
        const resp = await getLatestMessages(chatId, cursor);
        setMessages(resp);
      } catch (error) {
        console.error('Error fetching chat data: ', error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ping, newMessageTrigger, cursor]);

  const onStartReached = async (): Promise<void> => {
    const initCursor = cursor;
    const resp = await getLatestMessages(chatId, initCursor + 50);
    setMessages(resp);
    console.log('setting cursor 2');
    setCursor(cursor + 50);
  };

  const onEndReached = async () => {
    console.log('Marking chat as read');
    await toggleRead(chatId);
  };

  useEffect(() => {
    const backAction = async () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Colors = DynamicColors();

  const { themeValue } = useTheme();
  const styles = styling(themeValue, Colors);

  const onChatScreenPressed = () => {
    //If slider is open, close it.
    if (!isScreenClickable.value) {
      moveSliderIntermediateOpen();
    }
    // if pop up actions is visible
    // close component
    if (isPopUpVisible) {
      togglePopUp();
    }
    // if emoji keyboard is visible
    // close component
    if (isEmojiSelectorVisible) {
      setIsEmojiSelectorVisible(p => !p);
    }
  };

  return (
    <AudioPlayerProvider>
      <CustomStatusBar
        backgroundColor={
          themeValue === 'dark'
            ? Colors.primary.surface
            : Colors.primary.surface2
        }
      />
      <GestureSafeAreaView
        style={StyleSheet.compose(styles.screen, {
          backgroundColor:
            themeValue === 'dark'
              ? Colors.primary.background
              : Colors.primary.surface,
        })}>
        <CustomKeyboardAvoidingView>
          <Pressable
            style={styles.main}
            onPress={onChatScreenPressed}
            pointerEvents={pointerEvents}>
            <ChatList
              messages={messages.filter(x =>
                DisplayableContentTypes.includes(x.contentType),
              )}
              onStartReached={onStartReached}
              onEndReached={onEndReached}
            />
          </Pressable>
          <Pressable
            pointerEvents={pointerEvents}
            onPress={() => {
              if (!isScreenClickable.value) {
                moveSliderIntermediateOpen();
              }
            }}>
            {isConnected ? (
              <>
                {selectionMode === MessageSelectionMode.Multiple ? (
                  <MessageActionsBar />
                ) : (
                  <MessageBar ifTemplateExists={ifTemplateExists} />
                )}
              </>
            ) : selectionMode ? (
              <MessageActionsBar />
            ) : (
              <View style={{ paddingTop: 60 }}>
                <Disconnected name={name} />
              </View>
            )}
          </Pressable>
        </CustomKeyboardAvoidingView>
        <ChatTopbar
          chatTopBarRef={chatTopBarRef}
          isScreenClickable={isScreenClickable}
          sliderOpen={sliderOpen}
          permissionsId={permissionsId}
          permissions={permissions}
          setPermissions={setPermissions}
        />
        {selectionMode === MessageSelectionMode.Single &&
          selectedMessages.length === 1 && <BlurViewModal />}
        <ReportMessageBottomSheet
          description="Your report is anonymous. The reported user will not be notified of the report."
          openModal={showReportModal}
          topButton={'Report'}
          setReportSubmitted={setReportSubmitted}
          setSelectedReportOption={setSelectedReportOption}
          selectedReportOption={selectedReportOption}
          otherReport={otherReport}
          setOtherReport={setOtherReport}
          onClose={() => {
            setShowReportModal(false);
          }}
          onReportSubmitted={onReportSubmitted}
        />

        <DualActionBottomSheet
          showMore={showDeleteForEveryone}
          openModal={openDeleteMessageModal}
          title={'Delete message?'}
          topButton={
            showDeleteForEveryone ? 'Delete for everyone' : 'Delete for me'
          }
          topButtonFunction={
            showDeleteForEveryone
              ? () => {
                performGlobalDelete(selectedMessages.map(m => m.messageId));
                setSelectedMessages([]);
                setSelectionMode(MessageSelectionMode.Single);
              }
              : () => {
                performDelete(selectedMessages.map(m => m.messageId));
                setSelectedMessages([]);
                setSelectionMode(MessageSelectionMode.Single);
              }
          }
          middleButton="Delete for me"
          middleButtonFunction={() => {
            performDelete(selectedMessages.map(m => m.messageId));
            setSelectedMessages([]);
            setSelectionMode(MessageSelectionMode.Single);
          }}
          onClose={() => {
            setOpenDeleteMessageModal(false);
          }}
        />
        <RichReactionsBottomsheet
          chatId={chatId}
          messageId={richReactionMessage}
          onClose={() => setRichReactionMessage(null)}
          visible={richReactionMessage !== null}
        />
      </GestureSafeAreaView>
    </AudioPlayerProvider>
  );
}

const styling = (themeValue: any, Colors: any) =>
  StyleSheet.create({
    main: {
      flex: 1,
      width: screen.width,
      flexDirection: 'column',
      justifyContent: 'flex-start',
      backgroundColor:
        themeValue === 'dark'
          ? Colors.primary.background
          : Colors.primary.surface,
    },
    screen: {
      flexDirection: 'column',
    },
    background: {
      position: 'absolute',
      flex: 1,
    },
  });

export default Chat;
