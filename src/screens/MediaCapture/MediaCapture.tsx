import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useIsFocused } from '@react-navigation/core';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { PressableOpacity } from 'react-native-pressable-opacity';
import Reanimated, { Extrapolation, interpolate, useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CameraProps, CameraRuntimeError, PhotoFile, VideoFile } from 'react-native-vision-camera';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  // useFrameProcessor, // filters and stuff, if ever
  useMicrophonePermission
} from 'react-native-vision-camera';
import { runOnJS } from 'react-native-worklets';

import { Colors, useColors } from '@components/colorGuide';
import { GestureSafeAreaView } from '@components/GestureSafeAreaView';
import { NumberlessText } from '@components/NumberlessText';
import { Spacing, screen } from '@components/spacingGuide';

import { AppStackParamList } from '@navigation/AppStack/AppStackTypes';

import { ContentType } from '@utils/Messaging/interfaces';
import { getConnection } from '@utils/Storage/connections';

import CameraFlip from '@assets/icons/CameraFlip.svg';
import FlashOff from '@assets/icons/FlashOff.svg';
import FlashOn from '@assets/icons/FlashOn.svg';
import Whitecross from '@assets/icons/greyCrossIcon.svg';

import { CaptureButton } from './views/CaptureButon';
import { Timer } from './views/Timer';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

// Control Button like Flash
const CONTROL_BUTTON_SIZE = 40
const SCALE_FULL_ZOOM = 3
const MAX_ZOOM_FACTOR = 10

type Props = NativeStackScreenProps<AppStackParamList, 'MediaCapture'>;

export function MediaCapture({ route, navigation }: Props): React.ReactElement {
  const { chatId } = route.params;
  const camera = useRef<Camera>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const microphone = useMicrophonePermission();
  const zoom = useSharedValue(1);
  const isPressingButton = useSharedValue(false);
  const [isRecording, setIsRecording] = useState(false);

  // check if camera page is active
  const isFocussed = useIsFocused();
  //   const isForeground = useIsForeground()
  const isActive = isFocussed;

  // to go to gallery confirmation screen
  const goToConfirmation = async (lst: any[]) => {
    // navigation.goBack();
    if (lst.length > 0) {
      const connection = await getConnection(chatId);
      navigation.push('GalleryConfirmation', {
        selectedMembers: [connection],
        shareMessages: lst,
        isChat: true,
      });
    }
  };

  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const [enableHdr, setEnableHdr] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [enableNightMode, setEnableNightMode] = useState(false);

  // camera device settings
  const device = useCameraDevice(cameraPosition);


  const [targetFps, setTargetFps] = useState(30);

  const screenAspectRatio = screen.height / screen.width;
  const format = useCameraFormat(device, [
    { fps: targetFps },
    { videoAspectRatio: screenAspectRatio },
    { videoResolution: 'max' },
    { photoAspectRatio: screenAspectRatio },
    { photoResolution: 'max' },
  ]);

  const fps = Math.min(format?.maxFps ?? 1, targetFps);
  const supportsFlash = device?.hasFlash ?? false;
  const supportsHdr = format?.supportsPhotoHdr;
  const supports60Fps = useMemo(() => device?.formats.some((f) => f.maxFps >= 60), [device?.formats]);
  const canToggleNightMode = device?.supportsLowLightBoost ?? false;
  const [mode, setMode] = useState<'photo' | 'video'>('photo');

  //#region Animated Zoom
  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR);

  const Colors = useColors();

  const cameraAnimatedProps = useAnimatedProps<CameraProps>(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom)
    return {
      zoom: z,
    }
  }, [maxZoom, minZoom, zoom]);
  //#endregion

  //#region Callbacks
  const setIsPressingButton = useCallback(
    (_isPressingButton: boolean) => {
      isPressingButton.value = _isPressingButton
    },
    [isPressingButton],
  );


  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error)
  }, []);


  const onInitialized = useCallback(() => {
    console.log('Camera initialized!')
    setIsCameraInitialized(true)
  }, []);


  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
      const isVideo = type === 'video';
      const fileList = [
        {
          contentType: isVideo ? ContentType.video : ContentType.image,
          data: {
            fileUri: media.path,
            fileType: isVideo ? 'video/mp4' : 'image/jpeg',
            fileName: isVideo ? 'video.mp4' : 'photo.jpg',
          },
        },
      ];
      goToConfirmation(fileList);
    },
    [navigation]
  );


  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === 'back' ? 'front' : 'back'))
  }, []);
  
  
  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === 'off' ? 'on' : 'off'))
  }, [])
  //#endregion

  //#region Tap Gesture
  const onFocusTap = useCallback(
    ({ nativeEvent: event }: GestureResponderEvent) => {
      if (!device?.supportsFocus) return
      camera.current?.focus({
        x: event.locationX,
        y: event.locationY,
      })
    },
    [device?.supportsFocus],
  )

  //#endregion

  //#region Effects
  useEffect(() => {
    // Reset zoom to it's default everytime the `device` changes.
    zoom.value = device?.neutralZoom ?? 1
  }, [zoom, device]);
  //#endregion

  //#region Pinch to Zoom Gesture
  // The gesture handler maps the linear pinch gesture (0 - 1) to an exponential curve since a camera's zoom
  // function does not appear linear to the user. (aka zoom 0.1 -> 0.2 does not look equal in difference as 0.8 -> 0.9)
  const pinchStartZoom = useSharedValue(1); // Store initial zoom value

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      pinchStartZoom.value = zoom.value;
    })
    .onUpdate((event) => {
      // Map gesture scale to a linear zoom range
      const scale = interpolate(
        event.scale,
        [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM],
        [-1, 0, 1],
        Extrapolation.CLAMP
      );

      zoom.value = interpolate(
        scale,
        [-1, 0, 1],
        [minZoom, pinchStartZoom.value, maxZoom],
        Extrapolation.CLAMP
      );
    });
  //#endregion

  const videoHdr = format?.supportsVideoHdr && enableHdr;
  const photoHdr = format?.supportsPhotoHdr && enableHdr && !videoHdr;

  const tapGesture = Gesture.Tap().onStart(() => {
    console.log('Tap!');
  });

  const doubleTapGesture = Gesture.Tap().numberOfTaps(2).onStart(() => {
    runOnJS(onFlipCameraPressed)();
  });

  return (
    <GestureSafeAreaView style={styles.container}>
      {device != null ? (
        <GestureDetector gesture={pinchGesture}>
          <GestureDetector gesture={Gesture.Exclusive(doubleTapGesture, tapGesture)}>
            <Reanimated.View onTouchEnd={onFocusTap} style={StyleSheet.absoluteFill}>
              <ReanimatedCamera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive}
                ref={camera}
                onInitialized={onInitialized}
                onError={onError}
                onStarted={() => console.log('Camera started!')}
                onStopped={() => console.log('Camera stopped!')}
                onPreviewStarted={() => console.log('Preview started!')}
                onPreviewStopped={() => console.log('Preview stopped!')}
                onOutputOrientationChanged={(o) => console.log(`Output orientation changed to ${o}!`)}
                onPreviewOrientationChanged={(o) => console.log(`Preview orientation changed to ${o}!`)}
                onUIRotationChanged={(degrees) => console.log(`UI Rotation changed: ${degrees}°`)}
                format={format}
                fps={fps}
                photoHdr={photoHdr}
                videoHdr={videoHdr}
                photoQualityBalance="quality"
                lowLightBoost={device.supportsLowLightBoost && enableNightMode}
                enableZoomGesture={false}
                animatedProps={cameraAnimatedProps}
                exposure={0}
                outputOrientation="device"
                photo={true}
                video={true}
                audio={microphone.hasPermission}
              />
            </Reanimated.View>
          </GestureDetector>
        </GestureDetector>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.text}>Your phone does not have a Camera.</Text>
        </View>
      )}
  
  
      <PressableOpacity style={styles.whiteCrossIcon} hitSlop={40}>
        <Whitecross
          disabled={false}
          onPress={() => {
            navigation.goBack();
          }}
          style={styles.button}
        />
      </PressableOpacity>
  
      {isRecording && (
        <Timer
          durationSeconds={60}
          running={isRecording}
          cameraRef={camera}
          onFinish={() => {
            console.log('Recording timer finished');
            setIsRecording(false);
          }}
          style={styles.timerText}
        />
      )}
  
      <View style={styles.rightButtonRow}>
        {supportsFlash && (
          <PressableOpacity style={[styles.button]} onPress={onFlashPressed} disabledOpacity={0.4}>
            {flash === 'on' ? <FlashOn /> : <FlashOff />}
          </PressableOpacity>
        )}
        {supports60Fps && (
          <PressableOpacity style={styles.button} onPress={() => setTargetFps((t) => (t === 30 ? 60 : 30))}>
            <Text style={styles.text}>{`${targetFps}\nFPS`}</Text>
          </PressableOpacity>
        )}
        {supportsHdr && (
          <PressableOpacity style={styles.button} onPress={() => setEnableHdr((h) => !h)}>
            <MaterialIcon name={enableHdr ? 'hdr' : 'hdr-off'} color="white" size={24} />
          </PressableOpacity>
        )}
        {canToggleNightMode && (
          <PressableOpacity style={styles.button} onPress={() => setEnableNightMode(!enableNightMode)} disabledOpacity={0.4}>
            <IonIcon name={enableNightMode ? 'moon' : 'moon-outline'} color="white" size={24} />
          </PressableOpacity>
        )}
      </View>

      {!isRecording && (
        <View style={styles.bottomContainer}>
        <View style={styles.pillContainer}>
          <Pressable onPress={() => setMode('photo')}>
            <View style={[styles.pill, mode === 'photo' && styles.activePill]}>
              <NumberlessText textColor={Colors.white}>Photo</NumberlessText>
            </View>
          </Pressable>
          <Pressable onPress={() => setMode('video')}>
            <View style={[styles.pill, mode === 'video' && styles.activePill]}>
              <NumberlessText textColor={Colors.white}>Video</NumberlessText>
            </View>
          </Pressable>
        </View>
      </View>
      )}
  
      <View style={styles.captureButtonWrapper}>
      <PressableOpacity style={styles.flipCameraIcon} onPress={onFlipCameraPressed} disabledOpacity={0.4}>
        <CameraFlip />
      </PressableOpacity>
        <CaptureButton
          mode={mode}
          style={styles.captureButton}
          camera={camera}
          onMediaCaptured={onMediaCaptured}
          cameraZoom={zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          flash={supportsFlash ? flash : 'off'}
          enabled={isCameraInitialized && isActive}
          setIsPressingButton={setIsPressingButton}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
      </View>
    </GestureSafeAreaView>
  );  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timerText: {
    backgroundColor: Colors.common.black,
    position: 'absolute',
    alignSelf:'center',
    top: Spacing.xxxl,
    borderRadius: 16,
    color: Colors.common.white,
    padding: Spacing.s
},
  flipCameraIcon: {
    right: Spacing.s,
    position: 'absolute',
    flex: 1,
    bottom: Spacing.xxxxl,
  },
  whiteCrossIcon: {
    position: 'absolute',
    zIndex: 10,
    top: Spacing.xxxl,
    left: Spacing.m,
    marginBottom: Spacing.l,
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    borderRadius: CONTROL_BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    height: Spacing.xxxxl ,
    bottom: 0,
  },
  pillContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  activePill: {
    backgroundColor: '#4A94B033',
  },
  pill: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 20,
    alignItems: 'center',
  },
  captureButtonWrapper: {
    flex:1,
    justifyContent: 'flex-end',    
  },
  captureButton: {
    position: 'absolute',
    flex: 1,
    bottom: Spacing.xxxxl,
    alignSelf: 'center', 
  },
  button: {
    // bottom: Spacing.xml,
    position: 'relative',
    marginBottom: Spacing.l,
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    borderRadius: CONTROL_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(140, 140, 140, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtonRow: {
    right: Spacing.m,
    position: 'absolute',
    top: Spacing.xxxl,
    flex: 1,
    alignItems: 'flex-end',
  },
  text: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})