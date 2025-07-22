import React, { useCallback, useRef } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, {
    Easing,
    SharedValue,
    cancelAnimation,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import type { Camera, PhotoFile, VideoFile } from 'react-native-vision-camera';

import { CAPTURE_BUTTON_SIZE } from './../Constants';
import useSVG from '@components/svgGuide';

const BORDER_WIDTH = CAPTURE_BUTTON_SIZE * 0.1;
const START_RECORDING_DELAY = 200;



interface Props extends ViewProps {
    camera: React.RefObject<Camera>;
    onMediaCaptured: (media: PhotoFile | VideoFile, type: 'photo' | 'video') => void;
    minZoom: number;
    maxZoom: number;
    cameraZoom: SharedValue<number>;
    flash: 'off' | 'on';
    enabled: boolean;
    setIsPressingButton: (isPressingButton: boolean) => void;
}

export const CaptureButton: React.FC<Props> = ({
    camera,
    onMediaCaptured,
    minZoom,
    maxZoom,
    cameraZoom,
    flash,
    enabled,
    setIsPressingButton,
    style,
    ...props
}) => {
    const pressDownTime = useSharedValue(0); // holds Date.now()
    const isRecording = useRef(false);
    const recordingProgress = useSharedValue(0);
    const isPressingButton = useSharedValue(false);


    const svgArray = [
        // 1.NotificationOutline
        {
        assetName: 'MediaCapture',
        light: require('@assets/icons/MediaCapture.svg').default,
        dark: require('@assets/icons/MediaCapture.svg').default,
        },
    ];
    const results = useSVG(svgArray);

    const MediaCaptureIcon = results.MediaCapture;

    // Capture logic
    const takePhoto = useCallback(async () => {
        try {
            if (!camera.current) return;
            const photo = await camera.current.takePhoto({ flash, enableShutterSound: false });
            onMediaCaptured(photo, 'photo');
        } catch (e) {
            console.error('Failed to take photo', e);
        }
    }, [camera, flash, onMediaCaptured]);

    const stopRecording = useCallback(async () => {
        try {
            if (!camera.current) return;
            await camera.current.stopRecording();
        } catch (e) {
            console.error('Failed to stop recording', e);
        } finally {
            isRecording.current = false;
            // cancel animation on UI thread
            cancelAnimation(recordingProgress);
        }
    }, [camera]);

    const startRecording = useCallback(() => {
        console.log("in startRecording");
        if (!camera.current) return;
        isRecording.current = true;
        camera.current.startRecording({
            flash,
            onRecordingFinished: (video) => {
                runOnJS(onMediaCaptured)(video, 'video');
                isRecording.current = false;
            },
            onRecordingError: (error) => {
                console.error('Recording failed', error);
                isRecording.current = false;
            },
        });
    }, [camera, flash, onMediaCaptured]);

    const tapGesture = Gesture.Tap()
        .maxDuration(999999)
        .onEnd(() => {

            pressDownTime.value = 0;
            isPressingButton.value = false;
            runOnJS(setIsPressingButton)(false);
                runOnJS(takePhoto)();
        });

// Long Press Gesture
const longPressGesture = Gesture.LongPress()
  .minDuration(START_RECORDING_DELAY)
  .onStart(() => {
    pressDownTime.value = Date.now();
    isPressingButton.value = true;
    runOnJS(setIsPressingButton)(true);
    // triggerRecordingAfterDelay();
    runOnJS(startRecording)();
  })
  .onEnd(() => {
    const now = Date.now();
    const heldDuration = now - pressDownTime.value;

    pressDownTime.value = 0;
    isPressingButton.value = false;
    runOnJS(setIsPressingButton)(false);
    cancelAnimation(recordingProgress);

    if (heldDuration < START_RECORDING_DELAY) {
      // Tap was too short → take photo
      runOnJS(takePhoto)();
    } else {
      // Long enough → stop recording
      runOnJS(stopRecording)();
    }
  });



    let lastZoom = 1;
    const panGesture = Gesture.Pan()
        .onStart(() => {
            // Save the current zoom level to use in the gesture
            lastZoom = cameraZoom.value;
            console.log("onstart");
        })
        .onUpdate((e) => {
            const deltaY = -e.translationY; // drag up = zoom in
            const ZOOM_SENSITIVITY = 0.005;

            const nextZoom = lastZoom + deltaY * ZOOM_SENSITIVITY;
            cameraZoom.value = Math.min(maxZoom, Math.max(minZoom, nextZoom));
            console.log("onUpdate", nextZoom, deltaY);
        });


    const combinedGesture = Gesture.Simultaneous(tapGesture, panGesture, longPressGesture);

    const shadowStyle = useAnimatedStyle(() => ({
        transform: [
            {
                scale: withSpring(isPressingButton.value ? 1 : 0, {
                    mass: 1,
                    damping: 35,
                    stiffness: 300,
                }),
            },
        ],
    }));

    const buttonStyle = useAnimatedStyle(() => {
        const scale = enabled
            ? isPressingButton.value
                ? withRepeat(withSpring(1), -1, true)
                : withSpring(0.9)
            : withSpring(0.6);

        return {
            opacity: withTiming(enabled ? 1 : 0.3, { duration: 100, easing: Easing.linear }),
            transform: [{ scale }],
        };
    });

    return (
        <GestureHandlerRootView style={{ height: 100 }}>
            <GestureDetector gesture={combinedGesture}>
                <Reanimated.View {...props} style={[buttonStyle, style]}>
                    <Reanimated.View style={styles.flex}>
                        <Reanimated.View style={[styles.shadow, shadowStyle]} />
                        <MediaCaptureIcon width={CAPTURE_BUTTON_SIZE} height={CAPTURE_BUTTON_SIZE} />
                    </Reanimated.View>
                </Reanimated.View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
};


const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    shadow: {
        position: 'absolute',
        width: CAPTURE_BUTTON_SIZE,
        height: CAPTURE_BUTTON_SIZE,
        borderRadius: CAPTURE_BUTTON_SIZE / 2,
        backgroundColor: '#e34077',
    },
    button: {
        width: CAPTURE_BUTTON_SIZE,
        height: CAPTURE_BUTTON_SIZE,
        borderRadius: CAPTURE_BUTTON_SIZE / 2,
        borderWidth: BORDER_WIDTH,
        borderColor: 'white',
    },
});
