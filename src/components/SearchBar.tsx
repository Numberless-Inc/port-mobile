import React, {memo, useState} from 'react';
import {Pressable, StyleSheet, TextInput, View} from 'react-native';

import {NAME_LENGTH_LIMIT} from '@configs/constants';
import SearchGrey from '@assets/icons/GreySearch.svg';

import {Spacing} from './spacingGuide';
import {useColors} from './colorGuide';
import useSVG from './svgGuide';

const SearchBar = ({
  searchText,
  setSearchText,
  placeholder = 'Search',
}: {
  searchText: string;
  setSearchText: (text: string) => void;
  placeholder?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const Colors = useColors();

  const onChangeText = (newName: string) => {
    setIsFocused(true);
    setSearchText(newName);
    if (newName === '') {
      setIsFocused(false);
    }
  };

  const svgArray = [
    {
      assetName: 'CloseIcon',
      light: require('@assets/light/icons/Close.svg').default,
      dark: require('@assets/dark/icons/Close.svg').default,
    },
    {
      assetName: 'SearchIcon',
      light: require('@assets/light/icons/search.svg').default,
      dark: require('@assets/dark/icons/search.svg').default,
    },
  ];

  const results = useSVG(svgArray);
  const CloseIcon = results.CloseIcon;
  const SearchIcon = results.SearchIcon;

  return (
    <View
      style={[
        styles.searchBarStyle,
        {
          backgroundColor: Colors.surface,
          borderRadius: Spacing.xml,
        },
      ]}>
      {isFocused ? (
        <SearchIcon height={20} width={20} />
      ) : (
        <SearchGrey height={20} width={20} />
      )}
      <TextInput
        style={{
          marginLeft: Spacing.s,
          flex: 1,
          fontSize: 15,
          color: Colors.text.title,
        }}
        textAlign="left"
        maxLength={NAME_LENGTH_LIMIT}
        placeholder={isFocused ? '' : placeholder}
        placeholderTextColor={Colors.text.subtitle}
        onChangeText={onChangeText}
        value={searchText}
        onBlur={() => setIsFocused(false)}
        autoCorrect={false}
      />
      {searchText.length > 0 && (
        <Pressable hitSlop={40} onPress={() => onChangeText('')}>
          <CloseIcon height={18} width={18} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchBarStyle: {
    width: '100%',
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});

export default memo(SearchBar);
