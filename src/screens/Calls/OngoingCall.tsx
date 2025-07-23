/**
 * This screen manages an ongoing call.
 */
import React, {useEffect, useMemo, useReducer, useState} from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {PERMISSIONS, check} from 'react-native-permissions';
import {SvgProps} from 'react-native-svg';
import {MediaStream} from 'react-native-webrtc';
import {useSelector} from 'react-redux';

import {PortSpacing, screen} from '@components/ComponentUtils';
import {CustomStatusBar} from '@components/CustomStatusBar';
import DynamicColors from '@components/DynamicColors';
import {
  FontSizeType,
  FontType,
  NumberlessText,
} from '@components/NumberlessText';
import {SafeAreaView} from '@components/SafeAreaView';

import {DEFAULT_AVATAR, DEFAULT_PROFILE_AVATAR_INFO} from '@configs/constants';

import {AppStackParamList} from '@navigation/AppStack/AppStackTypes';

import {CallWorkItem, CoordinatorWorkItem} from '@utils/Calls/CallWorkQueue';
import {MediaStreamManager} from '@utils/Calls/MediaStreamManager';
import {
  CallEvents,
  PeerConnectionManager,
} from '@utils/Calls/PeerConnectionManager';
import Signaller from '@utils/Calls/Signaller';
import DirectChat from '@utils/DirectChats/DirectChat';
import {generateISOTimeStamp} from '@utils/Time';
import WorkQueue from '@utils/WorkQueue';

import Bluetooth from '@assets/dark/icons/Bluetooth.svg';
import EndCall from '@assets/dark/icons/EndCall.svg';
import MicrophoneOff from '@assets/dark/icons/MicOff.svg';
import MicrophoneOn from '@assets/dark/icons/MicOn.svg';
import SpeakerOff from '@assets/dark/icons/SpeakerOff.svg';
import SpeakerOn from '@assets/dark/icons/SpeakerOn.svg';
import VideoOff from '@assets/dark/icons/VideoOff.svg';
import VideoOn from '@assets/dark/icons/VideoOn.svg';
import ViewSwitch from '@assets/dark/icons/ViewSwitch.svg';
import CloseWhite from '@assets/icons/closeWhite.svg';

import NativeCallHelperModule, {
  MappedAudioRoute,
  MuteEventPayload,
  NativeAudioRouteChangePayload,
} from '@specs/NativeCallHelperModule';

import {useCallContext} from './CallContext';
import CallingTopBar from './Components/CallingTopBar';
import {MyStream, MyVideoSize} from './Components/MyStream';
import {PeerStream, PeerVideoSize} from './Components/PeerStream';

type Props = NativeStackScreenProps<AppStackParamList, 'OngoingCall'>;

/**
 * A dummy dispatcher for the call work queue.
 */
function callWorkDispatcher(_state: string) {
  return generateISOTimeStamp();
}

async function checkPermissions() {
  const cameraStatus = await check(
    Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
  );

  const micStatus = await check(
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.MICROPHONE
      : PERMISSIONS.ANDROID.RECORD_AUDIO,
  );

  return cameraStatus === 'granted' && micStatus === 'granted';
}

/**
 * The state of the call
 */
export enum CallState {
  active = 1,
  disconnected = 2,
  connecting = 3,
  reconnecting = 4,
  cleaned = 5,
}

// enum 

//state of the call UI
export interface CallUIState {
  peerMic: boolean;
  peerVideo: boolean;
  myMic: boolean;
  myVideo: boolean;
}

//initial state of the call UI
const callUIInitialState: CallUIState = {
  peerMic: false,
  peerVideo: false,
  myMic: false,
  myVideo: false,
};

//different call events that can be dispatched to the callUIStateReducer
export enum CallUIEvents {
  peer_mic_on = 'peer_mic_on',
  peer_mic_off = 'peer_mic_off',
  peer_video_on = 'peer_video_on',
  peer_video_off = 'peer_video_off',
  my_mic_on = 'my_mic_on',
  my_mic_off = 'my_mic_off',
  my_video_on = 'my_video_on',
  my_video_off = 'my_video_off',
}

//call UI state reducer
function callUIStateReducer(state: CallUIState, action: {type: CallUIEvents}) {
  switch (action.type) {
    case CallUIEvents.peer_mic_on:
      return {...state, peerMic: true};
    case CallUIEvents.peer_mic_off:
      return {...state, peerMic: false};
    case CallUIEvents.peer_video_on:
      return {...state, peerVideo: true};
    case CallUIEvents.peer_video_off:
      return {...state, peerVideo: false};
    case CallUIEvents.my_mic_on:
      return {...state, myMic: true};
    case CallUIEvents.my_mic_off:
      return {...state, myMic: false};
    case CallUIEvents.my_video_on:
      return {...state, myVideo: true};
    case CallUIEvents.my_video_off:
      return {...state, myVideo: false};
  }
}

function OngoingCall({route, navigation}: Props) {
  // Get the chatId and callId from the route params
  const {chatId, isVideoCall, callId} = route.params;
  const {callState, dispatchCallAction} = useCallContext();
  const [allPermissionsGranted, setAllPermissionsGranted] = useState(true);
  const [channel, setChannel] = useState<string>('Earpiece');

  //styling variables
  const Colors = DynamicColors();
  const DarkColors = DynamicColors('dark');
  const styles = styling(Colors);

  // A listener for call UI state updates
  const [callUIState, dispatchCallUIState] = useReducer(
    callUIStateReducer,
    callUIInitialState,
  );

  // Work queue to schedule work items to be processed by various targets.
  const [callWorkQueue, _setCallWorkQueue] = useState<WorkQueue<CallWorkItem>>(
    new WorkQueue<CallWorkItem>(),
  );
  // A listener for the work queue
  const [workQueueListener, dispatchWorkQueueProcessing] = useReducer(
    callWorkDispatcher,
    '',
  );
  // Dispatch a work item to the work queue
  const dispatchWorkItem = async (callWorkItem: CallWorkItem) => {
    await callWorkQueue.enqueue(callWorkItem);
    dispatchWorkQueueProcessing();
  };

  // Signaller to handle signalling to setup the call.
  const [signaller, setSignaller] = useState<Signaller | undefined>(undefined);

  // Media stream manager to handle the user's media stream.
  const [mediaStreamManager, setMediaStreamManager] = useState<
    MediaStreamManager | undefined
  >(undefined);

  // Peer connection manager to handle the peer connection.
  const [peerConnectionManager, setPeerConnectionManager] = useState<
    PeerConnectionManager | undefined
  >(undefined);

  // The peer's media stream.
  const [peerStream, setPeerStream] = useState<MediaStream | undefined>(
    undefined,
  );

  // The user's media stream.
  const [myStream, setMyStream] = useState<MediaStream | undefined>(undefined);

  const profile = useSelector(state => state.profile.profile);

  // The profile name and display picture of the user.
  const {myProfilePicInfo} = useMemo(() => {
    return {
      myProfilePicInfo: profile?.profilePicInfo || DEFAULT_PROFILE_AVATAR_INFO,
    };
  }, [profile]);

  // The profile name of the peer.
  const [peerName, setPeerName] = useState<string>('');

  // The profile avatar of the peer.
  const [peerAvatar, setPeerAvatar] = useState<string>(DEFAULT_AVATAR);

  // Whether the peer video is primary or secondary
  const [isPeerVideoPrimary, setIsPeerVideoPrimary] = useState<boolean>(true);

  const getMyMediaStream = async () => {
    // Initialise media stream manager for my media stream
    try {
      console.log('getting my media stream', isVideoCall);
      const msm = new MediaStreamManager(isVideoCall);
      await msm.init();
      const myMediaStream = msm.getMediaStream();
      if (myMediaStream) {
        //check microphone and camera permissions
        const permissionsGranted = await checkPermissions();
        if (!permissionsGranted) {
          throw new Error('Microphone or camera permissions not granted');
        }
        return msm;
      }
      throw new Error('Failed to get my media stream');
    } catch (error) {
      console.error('Error getting my media stream: ', error);
      return undefined;
    }
  };

  const setupCall = async (msm: MediaStreamManager) => {
    try {
      // Get the chat data
      const chatData = await new DirectChat(chatId).getChatData();
      const lineId = chatData.lineId;
      setPeerName(chatData.name || '');
      setPeerAvatar(chatData.displayPic || DEFAULT_AVATAR);

      // Initialise signalling
      const s = new Signaller(lineId, dispatchWorkItem);
      setSignaller(s);

      // Set my media stream so that the self view can be rendered
      const myMediaStream = msm.getMediaStream();
      if (!myMediaStream) {
        throw new Error('Failed to get my media stream');
      }
      setMediaStreamManager(msm);
      setMyStream(myMediaStream);
      if (isVideoCall) {
        dispatchCallUIState({type: CallUIEvents.my_video_on});
        processCoordinatorMessage('turn_speaker_on');
      } else {
        dispatchCallUIState({type: CallUIEvents.my_video_off});
      }
      dispatchCallUIState({type: CallUIEvents.my_mic_on});

      // Initialise peer connection manager for the peer's media stream
      const pc = new PeerConnectionManager(dispatchWorkItem);
      setPeerConnectionManager(pc);
      pc.init(myMediaStream);
    } catch (error) {
      console.error('Ending call due to error initializing call: ', error);
      endCall();
    }
  };

  /**
   * First time call initialization.
   */
  useEffect(() => {
    getMyMediaStream().then(msm => {
      if (msm) {
        setupCall(msm);
      } else {
        console.log(
          'Failed to get my media stream. defaulting to requesting permissions screen.',
        );
        setAllPermissionsGranted(false);
      }
    });

    // Prevent navigation to the previous screen
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    // Add a listener for the mute event
    const muteListener = NativeCallHelperModule.onMute(
      ({callUUID, muted}: MuteEventPayload) => {
        // CallUUID and callId may be different cases
        if (callUUID.toLowerCase() !== callId.toLowerCase()) {
          return;
        }
        if (muted) {
          console.log('Muting microphone');
          micOff();
        } else {
          console.log('Unmuting microphone');
          micOn();
        }
      },
    );


    const nativeAudioRouteChangeListener = NativeCallHelperModule.onNativeAudioRouteChange(
      ({ outputs }: NativeAudioRouteChangePayload) => {
        const mappedAudioRoute  = outputs[0].mappedAudioRoute;

        if (!outputs || outputs.length === 0) {
          console.warn('[nativeAudioRouteChangeListener] No outputs detected');
          return;
        }
        let selectedRoute: MappedAudioRoute = 'Earpiece';

        if (mappedAudioRoute === 'Speakerphone') {
          selectedRoute = 'Speakerphone';
        }
        else if(mappedAudioRoute === 'unknown') {
          console.warn('[nativeAudioRouteChangeListener] mappedAudioRoute is unknown. Switching to Earpiece');
          selectedRoute = 'Earpiece';
        }
        console.log(`[nativeAudioRouteChangeListener] Forcing route to: ${selectedRoute}`);

        NativeCallHelperModule.setAudioRoute(selectedRoute);
        setChannel(selectedRoute);
      }
    );
    

    NativeCallHelperModule.startKeepPhoneAwake();

    return () => {
      backHandler.remove();
      muteListener.remove();
      nativeAudioRouteChangeListener.remove();
      NativeCallHelperModule.endKeepPhoneAwake();
      NativeCallHelperModule.endOutgoingRinging();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Process a coordinator message
   * @param item The coordinator message
   */
  function processCoordinatorMessage(item: CoordinatorWorkItem) {
    switch (item) {
      case 'peer_connected':
        signaller?.cleanup();
        break;
      case 'peer_stream_track_update': {
        const peerMediaStream = peerConnectionManager?.getMediaStream();
        if (peerMediaStream) {
          setPeerStream(peerMediaStream);
          const videoTrack = peerMediaStream.getVideoTracks()[0];
          if (videoTrack.enabled) {
            dispatchCallUIState({type: CallUIEvents.peer_video_on});
            processCoordinatorMessage('turn_speaker_on');
          }
          const audioTrack = peerMediaStream.getAudioTracks()[0];
          if (audioTrack.enabled) {
            dispatchCallUIState({type: CallUIEvents.peer_mic_on});
          }
        }
        // Odds are we can stop the outgoing ringing here
        NativeCallHelperModule.endOutgoingRinging();
        break;
      }
      case 'closed_signaller':
        // If the peer stream is not available, end the call.
        if (peerConnectionManager?.isConnected()) {
          break;
        }
      // It is meant to fall through to the next case
      case 'peer_connection_ended':
        endCall();
        break;
      case 'peer_mic_turned_on':
        dispatchCallUIState({type: CallUIEvents.peer_mic_on});
        break;
      case 'peer_mic_turned_off':
        dispatchCallUIState({type: CallUIEvents.peer_mic_off});
        break;
      case 'peer_video_turned_on':
        dispatchCallUIState({type: CallUIEvents.peer_video_on});
        break;
      case 'peer_video_turned_off':
        dispatchCallUIState({type: CallUIEvents.peer_video_off});
        break;
      case 'turn_speaker_on':
        NativeCallHelperModule.setAudioRoute('Speakerphone');
        break;
    }
  }

  /**
   * End the call
   * @param reason The reason for ending the call
   */
  function endCall() {
    // Go back to the hometab
    signaller?.cleanup(); // Cleanup the signaller
    mediaStreamManager?.stopStreaming(); // Turn off my camera and microphone
    peerConnectionManager?.cleanup(); // Terminate the peer connection
    dispatchCallAction({type: 'end_call'});
  }

  /**
   * Turn on the microphone
   */
  const micOn = () => {
    if (mediaStreamManager) {
      console.log('setting mic on');
      mediaStreamManager.setAudioStream(true);
      console.log('about to dispatch micOn event');
      dispatchCallUIState({type: CallUIEvents.my_mic_on});
      //emit call event over data channel
      console.log('sending micOn event to peer');
      peerConnectionManager?.sendEvent(CallEvents.micOn);
      console.log('Completed micOn');
    }
  };

  /**
   * Turn off the microphone
   */
  const micOff = () => {
    if (mediaStreamManager) {
      console.log('setting mic off');
      mediaStreamManager.setAudioStream(false);
      console.log('about to dispatch micOff event');
      dispatchCallUIState({type: CallUIEvents.my_mic_off});
      //emit call event over data channel
      console.log('sending micOff event to peer');
      peerConnectionManager?.sendEvent(CallEvents.micOff);
      console.log('completed micOff');
      return;
    }
    console.log('mediaStreamManager is undefined');
  };

  /**
   * Turn on the video
   */
  const videoOn = () => {
    if (mediaStreamManager) {
      mediaStreamManager.setVideoStream(true);
      dispatchCallUIState({type: CallUIEvents.my_video_on});
      processCoordinatorMessage('turn_speaker_on');
      //emit call event over data channel
      peerConnectionManager?.sendEvent(CallEvents.videoOn);
    }
  };

  /**
   * Turn off the video
   */
  const videoOff = () => {
    if (mediaStreamManager) {
      mediaStreamManager.setVideoStream(false);
      dispatchCallUIState({type: CallUIEvents.my_video_off});
      //emit call event over data channel
      peerConnectionManager?.sendEvent(CallEvents.videoOff);
    }
  };

  /**
   * Disconnect the call
   */
  const disconnectCall = () => {
    endCall();
  };

  /**
   * Toggle the view between peer and self
   */
  const toggleView = () => {
    setIsPeerVideoPrimary(!isPeerVideoPrimary);
  };

  /**
   * Switch my camera
   */
  const switchCamera = () => {
    try {
      mediaStreamManager?.switchCamera();
    } catch (error) {
      console.error('Error switching camera: ', error);
    }
  };

  // This useEffect responds to call state changes
  useEffect(() => {
    if (!callState) {
      // We no longer have an ongoing call
      navigation.popToTop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState]);

  /**
   * This block runs every time a new work item has been dispatched
   */
  useEffect(() => {
    (async () => {
      // Process every item in the work queue.
      // There may be more than one since we run up against
      // batching with react on frequent updates.
      let workItem = await callWorkQueue.dequeue();
      while (workItem) {
        switch (workItem.target) {
          case 'coordinator':
            // Process the coordinator message
            processCoordinatorMessage(workItem.item);
            break;
          case 'peerConnection':
            // Process the peer connection message
            peerConnectionManager?.processMessage(workItem.item);
            break;
          case 'signaller':
            // Process the signaller message
            signaller?.processMessage(workItem.item);
            break;
        }
        workItem = await callWorkQueue.dequeue();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workQueueListener]);

  return (
    <>
      <CustomStatusBar backgroundColor={DarkColors.primary.background} />
      <SafeAreaView
        removeOffset={true}
        style={{
          backgroundColor: DarkColors.primary.background,
        }}>
        {allPermissionsGranted ? (
          <View style={{flex: 1}}>
            {!isPeerVideoPrimary && myStream && callUIState.myVideo ? (
              <View style={{flex: 1}}>
                <MyStream
                  myStream={myStream}
                  myAvatar={myProfilePicInfo.uri}
                  callUIState={callUIState}
                  showAvatar={true}
                  myVideoSize={MyVideoSize.large}
                  onTop={false}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 200 + 90 + 16,
                    right: 120 + 16,
                  }}>
                  <PeerStream
                    peerStream={peerStream}
                    peerAvatar={peerAvatar}
                    callUIState={callUIState}
                    peerVideoSize={PeerVideoSize.small}
                    onTop={true}
                  />
                </View>
              </View>
            ) : (
              <View style={{flex: 1}}>
                <PeerStream
                  peerStream={peerStream}
                  peerAvatar={peerAvatar}
                  callUIState={callUIState}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 200 + 90 + 16,
                    right: 120 + 16,
                  }}>
                  <MyStream
                    myStream={myStream}
                    myAvatar={myProfilePicInfo.uri}
                    callUIState={callUIState}
                  />
                </View>
              </View>
            )}
            {myStream && callUIState.myVideo && (
              <>
                <View
                  style={{
                    position: 'absolute',
                    bottom: 200 + 90 + 16,
                    right: 120 + 16,
                  }}>
                  <Pressable
                    style={{
                      position: 'absolute',
                      height: 200,
                      width: 120,
                    }}
                    onPress={toggleView}
                  />
                </View>
                <TouchableOpacity
                  style={
                    isPeerVideoPrimary
                      ? {
                          ...styles.viewSwitch,
                          right: 16 + 8,
                          bottom: 90 + 16 + 8,
                        }
                      : {...styles.viewSwitch, top: 90, right: 16}
                  }
                  hitSlop={20}
                  onPress={switchCamera}
                  activeOpacity={0.5}>
                  <ViewSwitch width={20} height={20} />
                </TouchableOpacity>
              </>
            )}

            <CallingTopBar
              heading={peerName}
              callState={peerStream ? CallState.active : CallState.connecting}
              callUIState={callUIState}
            />
            <View style={styles.controlBar}>
              <BooleanControlButton
                isOn={callUIState.myVideo}
                onSwitchOn={videoOn}
                onSwitchOff={videoOff}
                onColor={Colors.primary.white}
                offColor={Colors.primary.genericGrey}
                OnIcon={VideoOn}
                OffIcon={VideoOff}
              />
              <BooleanControlButton
                isOn={callUIState.myMic}
                onSwitchOn={micOn}
                onSwitchOff={micOff}
                onColor={Colors.primary.genericGrey}
                offColor={Colors.primary.white}
                OnIcon={MicrophoneOn}
                OffIcon={MicrophoneOff}
              />
              <AudioChannelButton channel={channel} setChannel={setChannel} />
              <BooleanControlButton
                isOn={true}
                onSwitchOn={disconnectCall}
                onSwitchOff={disconnectCall}
                onColor={Colors.primary.red}
                offColor={Colors.primary.red}
                OnIcon={EndCall}
                OffIcon={EndCall}
              />
            </View>
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: PortSpacing.secondary.uniform,
            }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.closeButtonWrapper}>
              <CloseWhite width={24} height={24} />
            </Pressable>
            <NumberlessText
              fontType={FontType.rg}
              fontSizeType={FontSizeType.m}
              style={styles.text}>
              Please enable camera and microphone permissions to place a call.
            </NumberlessText>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const BooleanControlButton = ({
  onSwitchOn = () => console.log('Button switch on'),
  onSwitchOff = () => console.log('Button switch off'),
  isOn,
  onColor,
  offColor,
  OnIcon,
  OffIcon,
}: {
  onSwitchOn?: () => void | Promise<void>;
  onSwitchOff?: () => void | Promise<void>;
  isOn: boolean;
  onColor: string;
  offColor: string;
  OnIcon: React.FC<SvgProps>;
  OffIcon: React.FC<SvgProps>;
}) => {
  const Colors = DynamicColors();
  const styles = styling(Colors);
  return (
    <TouchableOpacity
      style={{...styles.button, backgroundColor: isOn ? onColor : offColor}}
      onPress={isOn ? onSwitchOff : onSwitchOn}>
      {isOn ? <OnIcon /> : <OffIcon />}
    </TouchableOpacity>
  );
};

const AudioChannelButton = ({ channel, setChannel }:{ 
  channel: string;
  setChannel: (channel: string) => void;
}) => {
  const Colors = DynamicColors();
  const styles = styling(Colors);
  const onPress = async () => {
    // Determine the number of outputs available
    const routes = await NativeCallHelperModule.getAudioRoutes();
    console.log('Audio routes: ', routes);
    if (routes.length < 2) {
      console.warn('Multiple audio outputs not supported on this device');
      return;
    } else if (routes.length === 2) {
      // Choose the other output. If not possible, use the current output.
      const newOutput = routes.find(route => route !== channel) || channel;
      setChannel(newOutput);
      NativeCallHelperModule.setAudioRoute(newOutput);
      return;
    }
    console.warn('More than 2 output devices are not currently supported');
  };
  // TODO: Add a listener for the route change event

  return (
    <TouchableOpacity
      style={{
        ...styles.button,
        backgroundColor:
          channel === 'Speakerphone'
            ? Colors.primary.white
            : Colors.primary.genericGrey,
      }}
      onPress={onPress}>
      {!channel ? (
        <SpeakerOff />
      ) : channel === 'Earpiece' ? (
        <SpeakerOff />
      ) : channel === 'Speakerphone' ? (
        <SpeakerOn />
      ) : (
        <Bluetooth />
      )}
    </TouchableOpacity>
  );
};

const styling = (color: any) =>
  StyleSheet.create({
    controlBar: {
      height: 90,
      flexDirection: 'row',
      position: 'absolute',
      bottom: 0,
      width: screen.width,
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderTopRightRadius: 16,
      borderTopLeftRadius: 16,
      paddingHorizontal: PortSpacing.primary.uniform,
    },
    peerstream: {
      width: 200,
      height: 200,
      right: 0,
      bottom: 100,
      position: 'absolute',
      zIndex: 1,
    },
    topbar: {
      position: 'absolute',
      top: 60,
      zIndex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      width: screen.width,
      paddingVertical: 10,
    },
    button: {
      height: 50,
      width: 50,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewSwitch: {
      position: 'absolute',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      width: 40,
      height: 40,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonWrapper: {
      position: 'absolute',
      top: PortSpacing.intermediate.top,
      right: PortSpacing.intermediate.right,
    },
    text: {
      color: color.primary.white,
    },
  });

export default OngoingCall;
