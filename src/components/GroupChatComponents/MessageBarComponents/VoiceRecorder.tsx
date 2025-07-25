import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {debounce} from 'lodash';
import {useMicrophonePermission} from 'react-native-vision-camera';

import {PortSpacing, isIOS, screen} from '@components/ComponentUtils';
import DynamicColors from '@components/DynamicColors';
import {GenericButton} from '@components/GenericButton';
import {
  FontSizeType,
  FontType,
  NumberlessText,
} from '@components/NumberlessText';
import ProgressBar from '@components/Reusable/Loaders/ProgressBar';

import {generateRandomHexId} from '@utils/IdGenerator';
import {ContentType} from '@utils/Messaging/interfaces';
import LargeDataUpload from '@utils/Messaging/LargeData/LargeDataUpload';
import SendMessage from '@utils/Messaging/Send/SendMessage';
import {moveToTmp} from '@utils/Storage/StorageRNFS/sharedFileHandlers';
import useDynamicSVG from '@utils/Themes/createDynamicSVG';
import {formatDuration} from '@utils/Time';
import {redrawOnNewMessage} from '@utils/TriggerTools/RedrawTrigger/redrawOnTrigger';

import WhitecrossOutline from '@assets/icons/WhitecrossOutline.svg';

import {useAudioPlayerContext} from 'src/context/AudioPlayerContext';
import {useTheme} from 'src/context/ThemeContext';
import {ToastType, useToast} from 'src/context/ToastContext';

import BlinkingDot from './BlinkingDot';
import AmplitudeBars from './Recording';

const MESSAGE_INPUT_TEXT_WIDTH = screen.width - 115;

const VoiceRecorder = ({
  setMicrophoneClicked,
  chatId,
}: {
  setMicrophoneClicked: (p: boolean) => void;
  chatId: string;
}) => {
  const {hasPermission, requestPermission} = useMicrophonePermission();
  const {
    audio,
    duration,
    onStartPlay,
    onStopPlayer,
    onStartRecord,
    onStopRecord,
    deleteRecording,
    setAudio,
    currentlyPlaying,
  } = useAudioPlayerContext();

  // to set play time of a recorded voice
  const [playTime, setPlayTime] = useState(formatDuration(duration));
  // to account for whether a voice is being recorded
  const [isVoiceRecording, setVoiceRecording] = useState(false);
  // to account for whether a voice recording is complete
  const [voiceRecordingComplete, setVoiceRecordingComplete] = useState(false);
  // to track whether a recorded audio is being played
  const [isPlaying, setIsPlaying] = useState(false);
  // to track progress of an audio note being played
  const [progress, setProgress] = useState(0);
  // to track if audio is getting sent
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // sets playtime acc to change in duration
    setPlayTime(formatDuration(duration));
  }, [duration]);

  const Colors = DynamicColors();
  const styles = styling(Colors);
  const {themeValue} = useTheme();
  const svgArray = [
    {
      assetName: 'PauseIcon',
      light: require('@assets/light/icons/voicenotes/Pause.svg').default,
      dark: require('@assets/dark/icons/voicenotes/Pause.svg').default,
    },
    {
      assetName: 'PlayIcon',
      light: require('@assets/light/icons/voicenotes/Play.svg').default,
      dark: require('@assets/dark/icons/voicenotes/Play.svg').default,
    },
    {
      assetName: 'DeleteIcon',
      light: require('@assets/light/icons/Delete.svg').default,
      dark: require('@assets/dark/icons/Delete.svg').default,
    },
    {
      assetName: 'Stop',
      light: require('@assets/light/icons/Stop.svg').default,
      dark: require('@assets/dark/icons/Stop.svg').default,
    },
    {
      assetName: 'MicrophoneGrey',
      light: require('@assets/light/icons/MicrophoneGrey.svg').default,
      dark: require('@assets/dark/icons/MicrophoneGrey.svg').default,
    },
    {
      assetName: 'SendIcon',
      light: require('@assets/icons/navigation/WhiteArrowUp.svg').default,
      dark: require('@assets/icons/navigation/WhiteArrowUp.svg').default,
    },
  ];

  const results = useDynamicSVG(svgArray);
  const Stop = results.Stop;
  const MicrophoneGrey = results.MicrophoneGrey;
  const DeleteIcon = results.DeleteIcon;
  const PauseIcon = results.PauseIcon;
  const PlayIcon = results.PlayIcon;
  const SendIcon = results.SendIcon;

  const debouncedRecordVoice = debounce(onStartRecord, 300);

  const onHandleClick = async () => {
    if (voiceRecordingComplete && !isVoiceRecording && audio) {
      // if an audio note is successfully recorded
      await onSendRecording();
    } else {
      // if an audio note was deleted in between while recording(cross button clicked)
      onStopRecord();
    }
    setAudio(null);
    deleteRecording();
    setMicrophoneClicked(p => !p);
  };
  const onPressMicroPhone = async () => {
    // first check permission request
    if (!hasPermission) {
      await requestPermission();
      return;
    } else {
      setVoiceRecording(p => !p);
      // start recording
      debouncedRecordVoice();
    }
  };

  // to switch all controls to their default state
  const resetPlayer = () => {
    setVoiceRecordingComplete(p => !p);
    setProgress(0);
    setIsPlaying(false);
    setVoiceRecording(false);
  };

  const startPlay = () => {
    setIsPlaying(p => !p);
    onStartPlay(setProgress, setPlayTime);
  };

  useEffect(() => {
    if (!isPlaying) {
      setProgress(0);
    }
  }, [isPlaying]);

  useEffect(() => {
    //If the active player changes
    if (currentlyPlaying) {
      //If the changed value is not the same as the message, it means that the message has to be reset.
      if (currentlyPlaying !== audio) {
        setIsPlaying(false);
        setProgress(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentlyPlaying]);

  const {showToast} = useToast();

  const onSendRecording = async () => {
    setIsSending(true);
    if (!audio) {
      throw new Error('No audio location');
    }
    //Android to iOS requires .mp4, as Android AAC will not play on iOS
    //iOS to Android requires .aac, as iOS .m4a/.mp4 won't play on Android.
    const ext = isIOS ? '.aac' : '.mp4';
    const fileName = generateRandomHexId() + ext;
    const fileUri = await moveToTmp(audio);
    onStopRecord();
    try {
      const uploader = new LargeDataUpload(
        fileUri,
        fileName,
        isIOS ? 'audio/aac' : 'audio/mp4',
      );
      await uploader.upload();
      const uploadData = uploader.getMediaIdAndKey();
      const newData = {
        chatId,
        fileName: fileName,
        fileUri: fileUri,
        fileType: isIOS ? 'audio/aac' : 'audio/mp4',
        duration: duration,
        mediaId: uploadData.mediaId,
        key: uploadData.key,
      };
      const sender = new SendMessage(
        chatId,
        ContentType.audioRecording,
        newData,
      );
      await sender.send();
      //dispatches redraw trigger for new message
      redrawOnNewMessage();
    } catch (error) {
      showToast('Network error in sending voice note', ToastType.error);
    }
    setIsSending(false);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
      }}>
      <View style={styles.container}>
        {/* when  voice has been recorded */}
        {!isVoiceRecording && voiceRecordingComplete && (
          <>
            {isPlaying ? (
              <Pressable
                style={{marginLeft: 10}}
                onPress={() => {
                  setIsPlaying(false);
                  onStopPlayer();
                }}
                hitSlop={{top: 20, right: 20, left: 10, bottom: 20}}>
                <PauseIcon style={{marginRight: 8}} />
              </Pressable>
            ) : (
              <Pressable
                style={{marginLeft: 11}}
                onPress={startPlay}
                hitSlop={{top: 20, right: 20, left: 10, bottom: 20}}>
                <PlayIcon style={{marginRight: 8}} />
              </Pressable>
            )}
            <View style={styles.recordingbox}>
              <ProgressBar progress={progress} setIsPlaying={setIsPlaying} />
              <NumberlessText
                style={{
                  color: Colors.text.subtitle,
                  width: 35,
                }}
                fontSizeType={FontSizeType.s}
                fontType={FontType.rg}>
                {playTime}
              </NumberlessText>

              <DeleteIcon
                style={{marginTop: -3, marginLeft: 3}}
                onPress={() => {
                  deleteRecording();
                  resetPlayer();
                  setAudio(null);
                }}
              />
            </View>
          </>
        )}
        {/* when voice recording is in progress */}
        {isVoiceRecording && !voiceRecordingComplete && (
          <>
            <Stop
              style={{marginLeft: 8}}
              onPress={() => {
                onStopRecord();
                setVoiceRecording(false);
                setVoiceRecordingComplete(true);
              }}
            />
            <View style={styles.box}>
              <View
                style={{
                  flexDirection: 'row',
                  width: 100,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <BlinkingDot />
                <AmplitudeBars />
                <NumberlessText
                  style={{color: Colors.text.primary}}
                  fontSizeType={FontSizeType.l}
                  fontType={FontType.rg}>
                  {formatDuration(duration)}
                </NumberlessText>
              </View>
            </View>
          </>
        )}
        {/* when voice hasn't been recorded */}
        {!isVoiceRecording && !voiceRecordingComplete && (
          <Pressable style={{flexDirection: 'row'}} onPress={onPressMicroPhone}>
            <MicrophoneGrey style={{marginLeft: 8}} />
            <View style={styles.box}>
              <NumberlessText
                style={{marginLeft: 4, marginRight: 8}}
                fontSizeType={FontSizeType.l}
                textColor={
                  themeValue === 'dark'
                    ? Colors.primary.white
                    : Colors.primary.mediumgrey
                }
                fontType={FontType.rg}>
                {hasPermission
                  ? 'Tap to record your voice'
                  : 'To send audio messages allow access to your microphone'}
              </NumberlessText>
            </View>
          </Pressable>
        )}
      </View>
      <GenericButton
        loading={isSending}
        iconSizeRight={voiceRecordingComplete ? 14 : 20}
        buttonStyle={styles.send}
        IconRight={voiceRecordingComplete ? SendIcon : WhitecrossOutline}
        onPress={onHandleClick}
      />
    </View>
  );
};
const styling = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.primary.lightgrey,
      overflow: 'hidden',
      borderRadius: 20,
      alignItems: 'center',
      marginRight: 4,
      height: 70,
      marginLeft: PortSpacing.secondary.uniform,
    },
    send: {
      width: 40,
      height: 40,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.button.black,
    },
    recordingbox: {
      width: MESSAGE_INPUT_TEXT_WIDTH + 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },

    box: {
      width: MESSAGE_INPUT_TEXT_WIDTH - 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
  });

export default VoiceRecorder;
