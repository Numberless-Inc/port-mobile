/**
 * This component is responsible for allowing a user to change their name.
 * It takes the following props:
 * 1. name: - initial user name
 * 2. setName - set user name function
 * 3. title - bottomsheet title
 * 4. onSave - on save function to save new profile pic attributes
 * 5. onClose - on close function for bottom sheet
 * 6. visible - to determine if bottom sheet should be visible
 */

import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';

import BaseBottomSheet from '@components/BaseBottomsheet';
import { useColors } from '@components/colorGuide';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import LineSeparator from '@components/Separators/LineSeparator';
import { Spacing, Width } from '@components/spacingGuide';

import PrimaryButton from '../LongButtons/PrimaryButton';



const ConfirmationBottomSheet = ({
  visible,
  onClose,
  onConfirm = async () => {},
  title,
  description,
  buttonText,
  buttonColor,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void>;
  title?: string;
  description?: string;
  buttonText: string;
  buttonColor: 'b' | 'r' | 'w';
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const onClick = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
    onClose();
  };
  const Colors = useColors();
  return (
    <BaseBottomSheet
      visible={visible}
      onClose={onClose}>
        <View style={styles.titleContainer}>
          <NumberlessText
          style={styles.title}
            textColor={Colors.text.title}
            fontSizeType={FontSizeType.xl}
            fontWeight={FontWeight.sb}>
            {title}
          </NumberlessText>
          <LineSeparator style={{ width: Width.screen }} />
        </View>
      <View style={styles.mainWrapper}>
        {description && (
          <View
            style={{marginBottom: Spacing.l, width: '100%'}}>
            <NumberlessText
              style={{color: Colors.text.subtitle}}
              fontSizeType={FontSizeType.m}
              fontWeight={FontWeight.rg}
         >
              {description}
            </NumberlessText>
          </View>
        )}
        <PrimaryButton
          buttonText={buttonText}
          primaryButtonColor={buttonColor}
          isLoading={isLoading}
          disabled={false}
          onClick={onClick}
        />
      </View>
    </BaseBottomSheet>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flexDirection: 'column',
    width: '100%',
    marginTop: Spacing.l
  },
  title: {
    fontSize: FontSizeType.l,
    fontWeight:FontWeight.md
  },
  titleContainer: {
    width: '100%',
    paddingTop: Spacing.s,
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.m,
  },
});

export default ConfirmationBottomSheet;
