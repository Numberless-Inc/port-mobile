

import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';

import BaseBottomSheet from '@components/BaseBottomsheet';
import PrimaryButton from '@components/Buttons/PrimaryButton';
import { useColors } from '@components/colorGuide';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import LineSeparator from '@components/Separators/LineSeparator';
import { Spacing, Width } from '@components/spacingGuide';


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
  buttonColor?: string;
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
          color={buttonColor}
          text={buttonText}
          theme={Colors.theme}
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
