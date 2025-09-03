import React, { useCallback, useRef } from 'react';
import {
  Keyboard,
  StyleSheet,
  View,
} from 'react-native';

import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';

import { useColors } from '@components/colorGuide';
import { Spacing, Width } from '@components/spacingGuide';

type BaseBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: any;
  bgColor?: 'w' | 'g';
  forceTheme?: 'light' | 'dark';
};

const renderBackdrop = (props: any) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    pressBehavior="close"
  />
);

const BaseBottomSheet = ({
  visible,
  onClose,
  children,
  bgColor = 'w',
  forceTheme,
}: BaseBottomSheetProps) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const Colors = useColors(forceTheme);

  const closeBottomSheet = () => {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }
    onClose();
  };

  useFocusEffect(
    useCallback(() => {
    return () => {
    if (Keyboard.isVisible()) {
    Keyboard.dismiss();
    }
    onClose();
    };
    }, [])
    );


  return (
    visible ? (<BottomSheet
      backgroundStyle={{backgroundColor:'transparent'}}
      ref={bottomSheetRef}
      enablePanDownToClose
      onClose={closeBottomSheet}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView
        style={[
          styles.container,
          {
            backgroundColor: bgColor === 'g' ? Colors.background : Colors.surface,
            paddingTop: Spacing.m,
          },
        ]}
      >
        {children}
      </BottomSheetView>
      <View style={{backgroundColor: bgColor === 'g' ? Colors.background : Colors.surface, width: Width.screen, marginTop: -Spacing.m}}/>
    </BottomSheet>): null
  );
};

const styles = StyleSheet.create({
    container: {
      flexDirection: 'column',
      width: Width.screen,
      alignItems: 'center',
      justifyContent: 'flex-start',
      borderTopLeftRadius: Spacing.xl,
      borderTopRightRadius: Spacing.xl,
      padding: Spacing.xl,
    }
  });

export default BaseBottomSheet;
