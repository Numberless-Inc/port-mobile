/**
 * This context handles call initiation along with management call functionality
 */

import React, {createContext, useContext, useEffect, useReducer} from 'react';

import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import store from '@store/appStore';

import {setUpCallStateListeners} from '@utils/Calls/CallOSBridge';
import DirectChat from '@utils/DirectChats/DirectChat';
import {registerForVoIPPushNotifications} from '@utils/Messaging/PushNotifications/VoIPAPNS';

import NativeCallHelperModule from '@specs/NativeCallHelperModule';

// bodgy fix since we need to be able to map callIds to chatIds
type Call = {
  chatId: string;
  initTimestamp: string;
};

const callTracker = new Map<string, Call>();

type CurrentCall =
  | undefined
  | {
      callId: string;
      chatId: string;
      initiatedVideoCall?: boolean;
      callState: 'unanswered' | 'answered' | 'outgoing';
      abortController?: AbortController; // Controller to manage aborting the timeout
      // of the incoming call when answered/unanswered
    };

type CallAction =
  | {
      type: 'incoming_call';
      chatId: string;
      callId: string;
      callRingTimeSeconds: number;
      onUnanswer: () => void;
    }
  | {
      type: 'outgoing_call';
      chatId: string;
      callId: string;
      initiatedVideoCall?: boolean;
    }
  | {type: 'answer_call'; initiatedVideoCall?: boolean; fromCallKit?: boolean}
  | {type: 'decline_call'; fromCallKit?: boolean}
  | {type: 'end_call'};

/**
 * Function to manage the state of ongoing calls
 * @param state The current call state
 * @param action What has happened to the call
 * @returns the new state of the call
 */
const manageCall = (state: CurrentCall, action: CallAction): CurrentCall => {
  // This function handles both the react UI state as well as the OS UI state
  // with respect to answering and declining calls.
  // When you get an incoming call, it also manages a timeout of 25 seconds to
  // Automatically decline the call. In the event that the call is answered in time,
  // the timeout is cancelled using the AbortController stored in state.
  switch (action.type) {
    case 'outgoing_call':
      if (state) {
        // We're already processing a call. WTF.
        return state;
      }
      // The following line doesn't adhere to our linting standards, but this is the only case where we
      // need to get the chat data
      const chat = new DirectChat(action.chatId); // eslint-disable-line no-case-declarations
      chat
        .getChatData()
        .then(chatData => {
          NativeCallHelperModule.startOutgoingCall(
            action.callId,
            chatData.name || ' New connection',
          );
        })
        .catch(e => console.error('Could not start outgoing CallKit UI: ', e));
      return {
        callId: action.callId,
        chatId: action.chatId,
        initiatedVideoCall: action.initiatedVideoCall,
        callState: 'outgoing',
      };
    case 'incoming_call': {
      if (state) {
        // We're already handling an incoming/ongoing call
        return state;
      }
      const abortController = new AbortController();
      console.log(
        'Call will ring in app for: ',
        action.callRingTimeSeconds,
        ' seconds',
      );
      setTimeout(() => {
        if (abortController.signal.aborted) {
          // No need to do the body of this function since we've been aborted
          return;
        }
        NativeCallHelperModule.endOngoingCall(action.callId);
        action.onUnanswer();
      }, action.callRingTimeSeconds * 1000);
      return {
        callId: action.callId,
        chatId: action.chatId,
        callState: 'unanswered',
        abortController,
      };
    }
    case 'answer_call':
      if (!state || state.callState !== 'unanswered') {
        // Can't answer the current ongoing call, if any
        return state;
      }
      // Abort the timeout to navigate to exit the incoming call screen if unanswered
      state.abortController?.abort(); // Abort the signal to cancel the incoming call
      if (!action.fromCallKit) {
        NativeCallHelperModule.acceptIncomingCall(state.callId);
        NativeCallHelperModule.cancelRingtone();
      }
      console.log('answer call', {
        ...state,
        callState: 'answered',
        initiatedVideoCall: action.initiatedVideoCall,
      });
      return {
        ...state,
        callState: 'answered',
        initiatedVideoCall: action.initiatedVideoCall,
      };
    case 'decline_call':
      if (state && state.callState === 'unanswered') {
        // TODO: CallKeep decline the call here and go home
        if (!action.fromCallKit) {
          NativeCallHelperModule.rejectIncomingCall(state.callId);
          NativeCallHelperModule.cancelRingtone();
        }
        // Abort the timeout to navigate to exit the incoming call screen if unanswered
        state.abortController?.abort();
        return undefined;
      }
    // We're declining a call that isn't in the unanswered state, pretend it's ongoing and drop into the end_call case
    case 'end_call': // eslint-disable-line no-fallthrough
      if (!state || !state.callId) {
        return state;
      }
      NativeCallHelperModule.endOngoingCall(state.callId);
      return undefined;
  }
  // We want to make sure that this case is never reachable. Test y our linters here!
  return undefined;
};

type CallContext_t = {
  callState: CurrentCall;
  dispatchCallAction: (callAction: CallAction) => void;
  initialiseCallKeep: () => Promise<void>;
};

const CallContext = createContext<CallContext_t | undefined>(undefined);

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('[CALL CONTEXT] Could not use context');
  }
  return context;
};

export const CallContextProvider = ({children}: {children: any}) => {
  const navigation = useNavigation();
  const newCall = useSelector(state => state.latestCallReducer?.latestCall);
  const [callState, dispatchCallAction] = useReducer(manageCall, undefined);

  // This useEffect manages incoming calls from the message receiver
  useEffect(() => {
    if (!newCall || !newCall.chat) {
      return;
    }
    console.warn('[NEW CALL] ', newCall);
    const callId = newCall.callId;
    // Start tracking this call in the global call manager
    callTracker.set(callId, {
      chatId: newCall.chat,
      initTimestamp: newCall.time,
    });

    dispatchCallAction({
      type: 'incoming_call',
      callId,
      chatId: newCall.chat,
      callRingTimeSeconds: newCall.answerWindow || 25,
      onUnanswer: () => dispatchCallAction({type: 'decline_call'}),
    });
    // Clear lastCall so that we don't worry about the same call being re-displayed
    store.dispatch({
      type: 'incoming_call',
      payload: null,
    });
  }, [newCall]);

  // Asynchronously set up callkeep to allow Incoming calls. Odds are, this will execute before we need it.
  // It is sketchy though, so watch out
  async function initialiseCallKeep() {
    // We first register the device for voip Push notifications if on iOS
    try {
      await registerForVoIPPushNotifications();
    } catch (e) {
      console.error(
        'Something went wrong registering for VoIP push notifications',
        e,
      );
    }

    await setUpCallStateListeners(
      (_callId: string) =>
        dispatchCallAction({
          type: 'answer_call',
          initiatedVideoCall: callState?.initiatedVideoCall || false,
          fromCallKit: true,
        }),
      (_callId: string) =>
        dispatchCallAction({
          type: 'decline_call',
          fromCallKit: true,
        }),
    );
  }

  useEffect(() => {
    if (callState?.callState === 'unanswered') {
      // We must have a new unanswered call
      console.log('incoming call', callState);
      navigation.navigate('AppStack', {
        screen: 'IncomingCall',
        params: {
          chatId: callState.chatId,
          callId: callState.callId,
          isVideoCall: callState.initiatedVideoCall || false,
        },
      });
    }
    if (callState?.callState === 'outgoing') {
      // We have placed an outgoing call
      navigation.navigate('AppStack', {
        screen: 'OngoingCall',
        params: {
          chatId: callState.chatId,
          callId: callState.callId,
          isVideoCall: callState.initiatedVideoCall || false,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState]);

  // This useEffect is responsible for navigation activities related to answering and ending calls
  return (
    <CallContext.Provider
      value={{dispatchCallAction, callState, initialiseCallKeep}}>
      {children}
    </CallContext.Provider>
  );
};
