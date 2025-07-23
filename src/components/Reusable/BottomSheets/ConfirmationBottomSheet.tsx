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

import {PortSpacing, isIOS} from '@components/ComponentUtils';
import DynamicColors from '@components/DynamicColors';
import {
  FontSizeType,
  FontType,
  NumberlessText,
  getWeight,
} from '@components/NumberlessText';

import PrimaryButton from '../LongButtons/PrimaryButton';

import PrimaryBottomSheet from './PrimaryBottomSheet';


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
  const Colors = DynamicColors();
  return (
    <PrimaryBottomSheet
      showClose={true}
      visible={visible}
      title={title}
      titleStyle={styles.title}
      onClose={onClose}>
      <View style={styles.mainWrapper}>
        {description && (
          <View
            style={{marginBottom: PortSpacing.secondary.bottom, width: '100%'}}>
            <NumberlessText
              style={{color: Colors.text.subtitle}}
              fontSizeType={FontSizeType.m}
              fontType={FontType.rg}>
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
    </PrimaryBottomSheet>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flexDirection: 'column',
    width: '100%',
    marginTop: PortSpacing.secondary.top,
    ...(isIOS ? {marginBottom: PortSpacing.secondary.bottom} : 0),
  },
  title: {
    fontFamily: FontType.md,
    fontSize: FontSizeType.l,
    fontWeight: getWeight(FontType.md),
  },
});

export default ConfirmationBottomSheet;
