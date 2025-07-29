/**
 * custom SafeAreaView for Port that uses safe insets.
 * Wrap this component around your screen so that the app handles various phone with various notches well.
 */
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ViewProps, ViewStyle } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isIOS } from './ComponentUtils';

export interface GestureSafeAreaViewProps extends ViewProps {
  backgroundColor?: string;
  modifyNavigationBarColor?: boolean; //android only
  bottomNavigationBarColor?: string; //android only
}

export function GestureSafeAreaView({
  children,
  backgroundColor,
  bottomNavigationBarColor,
  modifyNavigationBarColor = false,
  style,
  ...rest
}: GestureSafeAreaViewProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (bottomNavigationBarColor && !isIOS && modifyNavigationBarColor) {
      changeNavigationBarColor(bottomNavigationBarColor);
    }
  }, [bottomNavigationBarColor, modifyNavigationBarColor]);

  const safeAreaStyle: ViewStyle = useMemo(
    () => ({
      flex: 1,
      paddingTop: isIOS ? 0 : insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: isIOS ? 0 : insets.bottom,
      backgroundColor: backgroundColor,
    }),
    [insets.top, insets.left, insets.right, insets.bottom, backgroundColor],
  );

  return (
    <GestureHandlerRootView
      style={StyleSheet.compose(safeAreaStyle, style)}
      {...rest}>
      {children}
    </GestureHandlerRootView>
  );
}
