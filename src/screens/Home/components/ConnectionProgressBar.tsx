import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@components/colorGuide';
import { Spacing } from '@components/spacingGuide';

interface ConnectionProgressBarProps {
  totalConnections: number;
  currentConnections: number;
  style?: ViewStyle;
}

export const ConnectionProgressBar: React.FC<ConnectionProgressBarProps> = ({
  totalConnections,
  currentConnections,
  style,
}) => {
  const progress = useSharedValue(0);
  const Colors = useColors();
  const styles = styling(Colors);

  useEffect(() => {
    const ratio = Math.min(currentConnections / totalConnections, 1);
    progress.value = withTiming(ratio, { duration: 500 });
  }, [currentConnections, totalConnections]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.progress, animatedStyle]} />
    </View>
  );
};

const styling = (Colors: any) =>
  StyleSheet.create({
    container: {
      height: 13,
      backgroundColor: 'transparent',
      borderRadius: Spacing.s,
      overflow: 'hidden',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: Colors.accent2,
    },
    progress: {
      position: 'absolute',
      height: '100%',
      backgroundColor: Colors.accent2,
    },
  });
