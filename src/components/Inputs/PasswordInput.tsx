import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { useColors } from '@components/colorGuide';
import { FontSizeType, FontWeight } from '@components/NumberlessText';
import { Height, Spacing } from '@components/spacingGuide';
import useSVG from '@components/svgGuide';

import { NAME_LENGTH_LIMIT } from '@configs/constants';

const PasswordInput = ({
  text,
  setText,
  maxLength = NAME_LENGTH_LIMIT,
  placeholderText = 'Type here...',
  bgColor = 'w',
  keyboardType = 'ascii-capable',
  isEditable = true,
  autoFocus = false,
  showError = false,
  style,
}: {
  isEditable?: boolean;
  text: string;
  placeholderText?: string;
  setText: (text: string) => void;
  maxLength?: number | 'inf';
  bgColor?: 'w' | 'g';
  keyboardType?: KeyboardTypeOptions;
  autoFocus?: boolean;
  showError?: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [secure, setSecure] = useState(true);

  const Colors = useColors();

  const iconSet = [
    {
      assetName: 'PasswordHidden',
      light: require('@assets/light/icons/PasswordHidden.svg').default,
      dark: require('@assets/dark/icons/PasswordHidden.svg').default,
    },
    {
      assetName: 'PasswordVisible',
      light: require('@assets/light/icons/PasswordVisible.svg').default,
      dark: require('@assets/dark/icons/PasswordVisible.svg').default,
    },
  ];
  const icons = useSVG(iconSet, Colors.theme);

  const IconComponent = secure ? icons.PasswordHidden : icons.PasswordVisible;

  const dynamicStyle: TextStyle & ViewStyle = {
    color: Colors.text.title,
    borderColor: showError
      ? Colors.red
      : isFocused
        ? Colors.boldAccentColors.purple
        : Colors.stroke,
    backgroundColor:
      bgColor === 'g' ? Colors.background : Colors.surface,
  };

  const finalInputStyle: Style = [styles.textInput, dynamicStyle, style].reduce(
    (acc: Style, curr: Style) => (
      curr
        ? (StyleSheet.compose(acc, curr) as Style)
        : acc
    ), styles.textInput
  );

  return (
    <View style={[styles.inputWrapper, style]}>
      <TextInput
        editable={isEditable}
        style={finalInputStyle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholderText}
        placeholderTextColor={Colors.text.subtitle}
        maxLength={maxLength === 'inf' ? undefined : maxLength}
        value={text}
        onChangeText={(val) => {
          if (keyboardType === 'numeric') {
            setText(val.replace(/[^0-9]/g, ''));
          } else {
            setText(val);
          }
        }}
        keyboardType={keyboardType}
        multiline={false}
        numberOfLines={1}
        textAlignVertical="center"
        autoFocus={autoFocus}
        secureTextEntry={secure}
      />
      <Pressable
        style={styles.visibilityIcon}
        onPress={() => setSecure((prev) => !prev)}
        hitSlop={10}>
        <IconComponent />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'relative',
    flex: 1,
  },
  textInput: {
    paddingHorizontal: Spacing.l,
    paddingVertical: 0,
    fontSize: FontSizeType.l,
    fontWeight: FontWeight.rg,
    borderRadius: 12,
    height: Height.inputBar,
    borderWidth: 0.5,
    paddingRight: Height.inputBar, // reserve space for icon
  },
  visibilityIcon: {
    position: 'absolute',
    right: Spacing.l,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PasswordInput;
