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

import PrimaryButton from '@components/Buttons/PrimaryButton';
import { useColors } from '@components/colorGuide';
import {isIOS} from '@components/ComponentUtils';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import { Spacing } from '@components/spacingGuide';

import PrimaryBottomSheet from './PrimaryBottomSheet';


const ConfirmationBottomSheet = ({
  visible,
  onClose,
  onConfirm = async () => {},
  title,
  description,
  buttonText,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void>;
  title?: string;
  description?: string;
  buttonText: string;
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
    <PrimaryBottomSheet
      showClose={true}
      visible={visible}
      title={title}
      titleStyle={styles.title}
      onClose={onClose}>
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
          text={buttonText}
          theme={Colors.theme}
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
    marginTop:Spacing.l,
    ...(isIOS ? {marginBottom: Spacing.l} : 0),
  },
  title: {
    fontSize: FontSizeType.l,
    fontWeight: FontWeight.md,
  },
});

export default ConfirmationBottomSheet;
