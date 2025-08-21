import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, ViewProps } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
    Easing,
    SharedValue,
    cancelAnimation,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import type { Camera, PhotoFile, VideoFile } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-worklets';

import Capture from '@assets/icons/CaptureButton.svg';
import StopRecording from '@assets/icons/StopRecording.svg';


// Capture Button
const CAPTURE_BUTTON_SIZE = 78
const BORDER_WIDTH = CAPTURE_BUTTON_SIZE * 0.1;
const START_RECORDING_DELAY = 500;



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
    isRecording: boolean;
    setIsRecording: (isRecording: boolean) => void;
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
    style,
    setIsRecording,
    isRecording,
    ...props
}) => {
    const pressDownTime = useSharedValue(0); // holds Date.now()

    const recordingProgress = useSharedValue(0);
    const isPressingButton = useSharedValue(false);

    const showStopIcon = useSharedValue(false);
    const elapsedRecordingTime = useSharedValue(0);

    // Sync it with isRecording and mode
    useDerivedValue(() => {
        showStopIcon.value = isRecording && mode === 'video';
    });

    const [showStopIconJS, setShowStopIconJS] = React.useState(false);
    
    useEffect(() => {
        console.log('isRecording changed:', isRecording);
      }, [isRecording]);

    useAnimatedReaction(
        () => showStopIcon.value,
        (current, previous) => {
            if (current !== previous) {
                if(previous == true && isRecording === true) {
                    runOnJS(stopRecording)();
                }
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
            setIsRecording(false);
            pressDownTime.value = 0;
            elapsedRecordingTime.value = 0;
            cancelAnimation(recordingProgress);
        }
    }, [camera]);
    

const startRecording = useCallback(() => {
    console.log("in startRecording");
    if (!camera.current) return;

    pressDownTime.value = Date.now();
    setIsRecording(true)

    camera.current.startRecording({
        flash,
        onRecordingFinished: (video) => {
            runOnJS(onMediaCaptured)(video, 'video');
            runOnJS(setIsRecording)(false);
        },
        onRecordingError: (error) => {
            console.error('Recording failed', error);
            runOnJS(setIsRecording)(false);
            runOnJS(stopRecording)(); // just in case we're in a state where recording is actually happening but UI doesn't reflect it
        },
    });
    // updateLoop();
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
            else if (mode == "video" && isRecording === false) {
                runOnJS(startRecording)();
            }
            else if (mode == "video" && isRecording === true) {
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
            <GestureDetector gesture={panGesture}>
                <GestureDetector gesture={tapGesture}>
                    <GestureDetector gesture={longPressGesture}>
                        <Reanimated.View {...props} style={[buttonStyle, style]}>
                            <Reanimated.View style={styles.flex}>
                                <Reanimated.View style={[styles.shadow, shadowStyle]} />
                                <Pressable>
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
