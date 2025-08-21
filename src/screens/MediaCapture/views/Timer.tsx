import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';

import type { Camera } from 'react-native-vision-camera';

interface TimerProps {
  durationSeconds: number;
  running: boolean;
  onFinish?: () => void;
  cameraRef?: React.RefObject<Camera>;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Timer: React.FC<TimerProps> = ({
  durationSeconds,
  running,
  onFinish,
  cameraRef,
  style,
  textStyle,
}) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      setTimeLeft(durationSeconds);
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current ?? 0)) / 1000);
        const remaining = Math.max(0, durationSeconds - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          if (cameraRef?.current) {
            console.log('Timer ended → stopping recording...');
            cameraRef.current.stopRecording(); // This will trigger your existing onRecordingFinished callback
          }
          onFinish?.(); // Optional: update UI if needed
        }
      }, 1000);
    }

    return () => {
      clearInterval(intervalRef.current!);
    };
  }, [running, durationSeconds]);

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  if (!running) return null;

  return (
    <View style={style}>
      <Text style={[{ color: 'white' }, textStyle]}>
        {minutes}:{seconds}
      </Text>
    </View>
  );
};
