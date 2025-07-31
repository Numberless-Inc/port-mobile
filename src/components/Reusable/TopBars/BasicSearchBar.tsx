import React, {useRef, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {PortColors, PortSpacing} from '@components/ComponentUtils';
import DynamicColors from '@components/DynamicColors';
import {FontSizeType, FontType, getWeight} from '@components/NumberlessText';

import {NAME_LENGTH_LIMIT} from '@configs/constants';

import useDynamicSVG from '@utils/Themes/createDynamicSVG';

import BlackCross from '@assets/icons/BlackCross.svg';
import BackIcon from '@assets/icons/navigation/BlackArrowLeftThin.svg';

const BasicSearchBar = ({
  searchText,
  setSearchText,
  autofocus = true,
  onFocus,
  bgColor = 'g',
}: {
  onFocus?: () => void;
  autofocus?: boolean;
  bgColor?: 'w' | 'g';
  searchText: string;
  setSearchText: (text: string) => void;
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef(null);
  const onTextChange = (newText: string) => {
    setSearchText(newText);
  };

  const onInputFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
  };

  const onBackPress = () => {
    setSearchText('');
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (onFocus) {
      onFocus();
    }
  };

  const Colors = DynamicColors();

  const svgArray = [
    {
      assetName: 'SearchIcon',
      light: require('@assets/light/icons/search.svg').default,
      dark: require('@assets/dark/icons/search.svg').default,
    },
  ];
  const results = useDynamicSVG(svgArray);
  const SearchIcon = results.SearchIcon;

  return (
    <View style={styles.mainContainer}>
      <View style={styles.inputContainer}>
        <View
          style={StyleSheet.compose(styles.inputWrapper, {
            backgroundColor:
              bgColor === 'w'
                ? Colors.primary.surface
                : PortColors.primary.grey.light,
            borderColor: isFocused
              ? PortColors.primary.blue.app
              : Colors.primary.stroke,
          })}>
          {isFocused ? (
            <TouchableOpacity onPress={onBackPress}>
              <BackIcon width={20} height={20} />
            </TouchableOpacity>
          ) : (
            <SearchIcon width={20} height={20} />
          )}
          <TextInput
            ref={inputRef}
            autoFocus={autofocus}
            onFocus={onInputFocus}
            onBlur={() => setIsFocused(false)}
            style={styles.textInput}
            placeholder={'Search here...'}
            placeholderTextColor={PortColors.primary.grey.medium}
            maxLength={NAME_LENGTH_LIMIT}
            value={searchText}
            onChangeText={onTextChange}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')}>
              <BlackCross width={15} height={15} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  inputWrapper: {
    marginRight: PortSpacing.secondary.right,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    fontFamily: FontType.rg,
    fontSize: FontSizeType.m,
    fontWeight: getWeight(FontType.rg),
    color: PortColors.title,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: PortSpacing.secondary.uniform,
  },
  textInput: {
    paddingLeft: PortSpacing.tertiary.left,
    flex: 1,
    fontFamily: FontType.rg,
    fontSize: FontSizeType.m,
    fontWeight: getWeight(FontType.rg),
    color: PortColors.text.secondary,
    height: 44,
  },
});

export default BasicSearchBar;
