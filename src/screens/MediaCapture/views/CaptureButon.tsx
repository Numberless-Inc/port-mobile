import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewProps } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
    Easing,
    SharedValue,
    cancelAnimation,
    runOnJS,
    useAnimatedProps,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import type { Camera, PhotoFile, VideoFile } from 'react-native-vision-camera';

import { GestureSafeAreaView } from '@components/GestureSafeAreaView';

import Capture from '@assets/icons/CaptureButton.svg';
import StopRecording from '@assets/icons/StopRecording.svg';
import Animated from 'react-native-reanimated';
import { NumberlessText } from '@components/NumberlessText';
import { Text } from 'react-native-svg';


// Capture Button
const CAPTURE_BUTTON_SIZE = 78
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
    mode: 'photo' | 'video';
    setTimerString: (val: string) => void;
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
    mode,
    setTimerString,
    style,
    ...props
}) => {
    const pressDownTime = useSharedValue(0); // holds Date.now()
    const isRecording = useSharedValue(false);

    const recordingProgress = useSharedValue(0);
    const isPressingButton = useSharedValue(false);

    const showStopIcon = useSharedValue(false);
    const elapsedRecordingTime = useSharedValue(0);

    // Sync it with isRecording and mode
    useDerivedValue(() => {
        showStopIcon.value = isRecording.value && mode === 'video';
    });

    const [showStopIconJS, setShowStopIconJS] = React.useState(false);
    const MAX_RECORDING_TIME = 60000; // 1 minute in milliseconds
    // const recordingStartTime = useSharedValue(0);
    

    useAnimatedReaction(
        () => showStopIcon.value,
        (current, previous) => {
            if (current !== previous) {
                runOnJS(setShowStopIconJS)(current);
            }
        },
        [showStopIcon]
    );

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
            await camera.current.stopRecording(); // triggers onRecordingFinished
        } catch (e) {
            console.error('Failed to stop recording', e);
        } finally {
            isRecording.value = false;
            pressDownTime.value = 0;
            elapsedRecordingTime.value = 0;
            cancelAnimation(recordingProgress);
        }
    }, [camera]);
    

const startRecording = useCallback(() => {
    console.log("in startRecording");
    if (!camera.current) return;

    pressDownTime.value = Date.now();
    isRecording.value = true;
    // start loop for elapsed time and auto-stop
    const updateLoop = () => {
        'worklet';
        if (!isRecording.value) return;

        elapsedRecordingTime.value = Date.now() - pressDownTime.value;
        const ms = Math.min(elapsedRecordingTime.value, MAX_RECORDING_TIME);
        const sec = Math.floor(ms / 1000) % 60;
        const min = Math.floor(ms / 60000);
        const formatted = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        runOnJS(console.log)(formatted);

        runOnJS(setTimerString)(formatted);
        if (elapsedRecordingTime.value >= MAX_RECORDING_TIME) {
            runOnJS(stopRecording)(); // Call JS stopRecording
            runOnJS(console.log)("stopping recording");
            return;
        }
        requestAnimationFrame(updateLoop);
    };


    camera.current.startRecording({
        flash,
        onRecordingFinished: (video) => {
            runOnJS(onMediaCaptured)(video, 'video');
            isRecording.value = false;
        },
        onRecordingError: (error) => {
            console.error('Recording failed', error);
            isRecording.value = false;
        },
    });
}, [camera, flash, onMediaCaptured, stopRecording]);



    const tapGesture = Gesture.Tap()
        .maxDuration(999999)
        .onEnd(() => {

            pressDownTime.value = 0;
            isPressingButton.value = false;
            runOnJS(setIsPressingButton)(false);
            if (mode == "photo") {
                runOnJS(takePhoto)();
            }
            else if (mode == "video" && isRecording.value === false) {
                runOnJS(startRecording)();
            }
            else if (mode == "video" && isRecording.value === true) {
                runOnJS(stopRecording)();
            }
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

    // const combinedGesture = Gesture.Simultaneous(tapGesture, panGesture, longPressGesture);

    const shadowStyle = useAnimatedStyle(() => ({
        transform: [
            {
                scale: withSpring(isPressingButton.value ? 1.4 : 0, {
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
                ? withSpring(1.3, { damping: 10, stiffness: 150 }) // or adjust size
                : withSpring(0.9)
            : withSpring(0.6);

        return {
            opacity: withTiming(enabled ? 1 : 0.3, { duration: 100, easing: Easing.linear }),
            transform: [{ scale }],
            alignItems: 'center'
        };
    });

    return (
        <GestureSafeAreaView style={{ height: 100, flex: 1, justifyContent: 'center', width: "100%" }}>
            <GestureDetector gesture={panGesture}>
                <GestureDetector gesture={tapGesture}>
                    <GestureDetector gesture={longPressGesture}>
                        <Reanimated.View {...props} style={[buttonStyle, style]}>
                            <Reanimated.View style={styles.flex}>
                                <Reanimated.View style={[styles.shadow, shadowStyle, styles.btn]} />
                                <Pressable style={styles.btn}>
                                    {showStopIconJS ? (
                                        <StopRecording width={CAPTURE_BUTTON_SIZE} height={CAPTURE_BUTTON_SIZE} />
                                    ) : (
                                        <Capture width={CAPTURE_BUTTON_SIZE} height={CAPTURE_BUTTON_SIZE} />
                                    )}
                                </Pressable>
                            </Reanimated.View>
                        </Reanimated.View>
                    </GestureDetector>
                </GestureDetector>
            </GestureDetector>
        </GestureSafeAreaView>
    );
};


const styles = StyleSheet.create({
    flex: {
        flex: 1,
        // backgroundColor: 'green',
        // width: "100%"
    },
    btn: {
        justifyContent: "center",
        // backgroundColor: 'red',
        alignSelf: 'center',
        width: "100%",
        height: "100%",
        flex: 1,
        alignContent: "center",
        alignItems: "center"
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
