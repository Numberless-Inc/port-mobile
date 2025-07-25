import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useIsFocused } from '@react-navigation/core'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { PressableOpacity } from 'react-native-pressable-opacity'
import Reanimated, { Extrapolation, interpolate, runOnJS, useAnimatedProps, useSharedValue } from 'react-native-reanimated'
import IonIcon from 'react-native-vector-icons/Ionicons'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import type { CameraProps, CameraRuntimeError, PhotoFile, VideoFile } from 'react-native-vision-camera'
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  // useFrameProcessor, // filters and stuff, if ever
  useLocationPermission,
  useMicrophonePermission
} from 'react-native-vision-camera'

import { useColors } from '@components/colorGuide'
import { GestureSafeAreaView } from '@components/GestureSafeAreaView';
import { NumberlessText } from '@components/NumberlessText'
import { Spacing, screen } from '@components/spacingGuide';

import { AppStackParamList } from '@navigation/AppStack/AppStackTypes'

import { ContentType } from '@utils/Messaging/interfaces'
import { getConnection } from '@utils/Storage/connections'

import CameraFlip from '@assets/icons/CameraFlip.svg';
import FlashOff from '@assets/icons/FlashOff.svg';
import FlashOn from '@assets/icons/FlashOn.svg';

import { usePreferredCameraDevice } from './hooks/usePreferredCameraDevice'
import { CaptureButton } from './views/CaptureButon'
import { StatusBarBlurBackground } from './views/StatusBarBlurBackground';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

// Control Button like Flash
const CONTROL_BUTTON_SIZE = 40
const SCALE_FULL_ZOOM = 3
const MAX_ZOOM_FACTOR = 10
const CONTENT_SPACING = 15

type Props = NativeStackScreenProps<AppStackParamList, 'MediaCapture'>;

export function MediaCapture({ route, navigation }: Props): React.ReactElement {
  const { chatId } = route.params;
  const camera = useRef<Camera>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const microphone = useMicrophonePermission();
  const location = useLocationPermission();
  const zoom = useSharedValue(1);
  const isPressingButton = useSharedValue(false);

  // check if camera page is active
  const isFocussed = useIsFocused();
  //   const isForeground = useIsForeground()
  const isActive = isFocussed;
  // const [shouldRenderCamera, setShouldRenderCamera] = useState(true);

  // to go to gallery confirmation screen
  const goToConfirmation = async (lst: any[]) => {
    // navigation.goBack();
    if (lst.length > 0) {
      console.log("Navigating to GalleryConfirmation...", lst);
      console.log(chatId);
      const connection = await getConnection(chatId);
      navigation.push('GalleryConfirmation', {
        selectedMembers: [connection],
        shareMessages: lst,
        isChat: true,
      });
    }
    // navigation.navigate('GalleryConfirmation', {
    //   selectedMembers: [{ chatId: chatId }],
    //   shareMessages: lst,
    //   isChat: true,
    // });
    console.log("navigated to GalleryConfirmation...");
    // togglePopUp();
  };

  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const [enableHdr, setEnableHdr] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [enableNightMode, setEnableNightMode] = useState(false);

  // camera device settings
  const [preferredDevice] = usePreferredCameraDevice();
  let device = useCameraDevice(cameraPosition);

  if (preferredDevice != null && preferredDevice.position === cameraPosition) {
    // override default device with the one selected by the user in settings
    device = preferredDevice;
  }

  const [targetFps, setTargetFps] = useState(60);

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
  const minZoom = device?.minZoom ?? 1
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR)

  const Colors = useColors();

  const cameraAnimatedProps = useAnimatedProps<CameraProps>(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom)
    return {
      zoom: z,
    }
  }, [maxZoom, minZoom, zoom])
  //#endregion

  //#region Callbacks
  const setIsPressingButton = useCallback(
    (_isPressingButton: boolean) => {
      isPressingButton.value = _isPressingButton
    },
    [isPressingButton],
  )
  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error)
  }, [])
  const onInitialized = useCallback(() => {
    console.log('Camera initialized!')
    setIsCameraInitialized(true)
  }, [])
  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
      console.log(media);
      // console.log('000000', media, type);
      console.log(`Media captured! ${JSON.stringify(media)}`);
      console.log();
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
      console.log(fileList);
      goToConfirmation(fileList);
      // Optional: If you still want to show preview after capture
      // navigation.navigate('MediaPage', {
      //   path: media.path,
      //   type,
      // });
    },
    [navigation]
  );
  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === 'back' ? 'front' : 'back'))
  }, [])
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
  }, [zoom, device])
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

  useEffect(() => {
    const f =
      format != null
        ? `(${format.photoWidth}x${format.photoHeight} photo / ${format.videoWidth}x${format.videoHeight}@${format.maxFps} video @ ${fps}fps)`
        : undefined
    console.log(`Camera: ${device?.name} | Format: ${f}`)
  }, [device?.name, format, fps])

  useEffect(() => {
    location.requestPermission()
  }, [location])

  // const frameProcessor = useFrameProcessor((frame) => {
  //   'worklet'

  //   runAtTargetFps(10, () => {
  //     'worklet'
  //     console.log(`${frame.timestamp}: ${frame.width}x${frame.height} ${frame.pixelFormat} Frame (${frame.orientation})`)
  //     // examplePlugin(frame)
  //     // exampleKotlinSwiftPlugin(frame)
  //   })
  // }, [])

  const videoHdr = format?.supportsVideoHdr && enableHdr
  const photoHdr = format?.supportsPhotoHdr && enableHdr && !videoHdr

  const tapGesture = Gesture.Tap().onStart(() => {
    console.log('Tap!');
  });

  const doubleTapGesture = Gesture.Tap().numberOfTaps(2).onStart(() => {
    // onFlipCameraPressed();
    runOnJS(onFlipCameraPressed)();
  })

  return (
    <View style={styles.container}>
      {device != null ? (
        <GestureSafeAreaView
          style={{ flex: 1 }}
        >
          <GestureDetector gesture={pinchGesture}>
            <GestureDetector gesture={Gesture.Exclusive(doubleTapGesture, tapGesture)}>
              <Reanimated.View onTouchEnd={onFocusTap}
                style={StyleSheet.absoluteFill}
              >
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
                  // enableFpsGraph={true}
                  outputOrientation="device"
                  photo={true}
                  video={true}
                  audio={microphone.hasPermission}
                  enableLocation={location.hasPermission}
                />
              </Reanimated.View>
            </GestureDetector>
          </GestureDetector>
        </GestureSafeAreaView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.text}>Your phone does not have a Camera.</Text>
        </View>
      )}

      <StatusBarBlurBackground />

      <View style={styles.rightButtonRow}>
        <PressableOpacity style={styles.button} onPress={onFlipCameraPressed} disabledOpacity={0.4}>
          <CameraFlip />
        </PressableOpacity>
        {supportsFlash && (
          <PressableOpacity style={styles.button} onPress={onFlashPressed} disabledOpacity={0.4}>
            {flash === 'on' ? (
              <FlashOn />
            ) : (
              <FlashOff />
            )}
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
        {/* <PressableOpacity style={styles.button} onPress={() => navigation.navigate('Devices')}>
          <IonIcon name="settings-outline" color="white" size={24} />
        </PressableOpacity>
        <PressableOpacity style={styles.button} onPress={() => navigation.navigate('CodeScannerPage')}>
          <IonIcon name="qr-code-outline" color="white" size={24} />
        </PressableOpacity> */}
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.pillContainer}>
          <Pressable onPress={() => setMode('photo')}>
            <View style={[styles.pill, mode === 'photo' && styles.activePill]}>
              <NumberlessText textColor={mode === 'photo' ? Colors.text.primary : Colors.text.subtitle}>
                Photo
              </NumberlessText>
            </View>
          </Pressable>

          <Pressable onPress={() => setMode('video')}>
            <View style={[styles.pill, mode === 'video' && styles.activePill]}>
              <NumberlessText textColor={mode === 'video' ? Colors.text.primary : Colors.text.subtitle}>
                Video
              </NumberlessText>
            </View>
          </Pressable>
        </View>

      </View>
      <View style={styles.captureButtonWrapper}>
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
        />
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: Spacing.xxxxl, // Adjust spacing from bottom
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    bottom: Spacing.xml,
  },
  activePill: {
    backgroundColor: 'white',
  },
  pill: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // optional pill background
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 20,
    alignItems: 'center',
  },
  captureButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    position: 'absolute',
    // height: 100,
    flex: 1,
    width: "100%",
    justifyContent: "center",
    bottom: Spacing.xl,
    alignSelf: 'center',
    // alignItems: 'center',
    // backgroundColor: 'red'
  },
  button: {
    top: Spacing.xxl,
    marginBottom: CONTENT_SPACING,
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    borderRadius: CONTROL_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(140, 140, 140, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtonRow: {
    position: 'absolute',
    right: Spacing.m,
    top: Spacing.xl,
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