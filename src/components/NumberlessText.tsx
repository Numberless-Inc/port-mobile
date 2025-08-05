/**
 * custom text bar for Numberless that uses Rubik font
 */
import React from 'react';
import {
  ColorValue,
  Linking,
  StyleSheet,
  Text,
  TextProps,
  TouchableOpacity,
} from 'react-native';

import Autolink from 'react-native-autolink';

import {useConnectionModal} from 'src/context/ConnectionModalContext';

import {Colors} from './colorGuide';

/**
 * @deprecated - use FontWeight instead.
 * Font types for the app.
 */
export enum FontType {
  'sb' = 'Rubik-SemiBold',
  'md' = 'Rubik-Medium',
  'rg' = 'Rubik-Regular',
  'it' = 'Rubik-Italic',
}

export enum FontSizeType {
  'xl' = 20,
  'l' = 16,
  'm' = 14,
  's' = 12,
  'xs' = 10,
  'es' = 24,
  'esPlus' = 28,
  'em' = 36,
  'el' = 54,
}

export enum FontWeight {
  'sb' = '600',
  'md' = '500',
  'rg' = '400',
}

export const getWeight = (fontType: FontType): '400' | '500' | '600' => {
  switch (fontType) {
    case FontType.sb: {
      return '600';
    }
    case FontType.md: {
      return '500';
    }
    case FontType.rg: {
      return '400';
    }
  }
  return '400';
};

type TypographyProps = TextProps & {
  fontType?: FontType;
  fontSizeType?: FontSizeType;
  fontWeight?: FontWeight;
  textColor?: ColorValue;
};

/**
 *
 * @param children- Only string is allowed
 * @returns
 */
export const NumberlessLinkText: React.FC<
  TypographyProps & {children: string; linkColor?: string}
> = ({
  children,
  style,
  fontType = FontType.rg,
  fontSizeType = FontSizeType.m,
  fontWeight,
  onLayout = () => {},
  textColor = Colors.common.black,
  linkColor,
}) => {
  const {connectOverURL} = useConnectionModal();
  const handleLinkPress = (url: string) => {
    const numberlessDomain = 'porting.me';
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i); // eslint-disable-line no-useless-escape
    const hostname = match ? match[1] : null;
    if (hostname && hostname.endsWith(numberlessDomain)) {
      connectOverURL({url});
    } else {
      Linking.openURL(url).catch(err =>
        console.error(`Failed to open URL: ${url} with Error: `, err),
      );
    }
  };
  return (
    <Autolink
      text={children}
      url
      email
      linkStyle={{
        color: linkColor,
        textDecorationLine: 'underline',
      }}
      onLayout={onLayout}
      onPress={handleLinkPress}
      style={StyleSheet.compose(
        {
          fontFamily: fontType,
          fontSize: fontSizeType,
          fontWeight: fontWeight ? fontWeight : getWeight(fontType),
          color: textColor,
        },
        style,
      )}
    />
  );
};

/**
 *
 * @param children - String or ReactNode components that can be placed inside
 * @param style -  adjust padding or bounding boxes. Do not pass in color or font sizes here.
 * @returns
 */
export const NumberlessText: React.FC<TypographyProps> = ({
  children,
  style,
  fontType = FontType.rg,
  fontSizeType = FontSizeType.m,
  fontWeight,
  textColor = Colors.common.black,
  ...rest
}) => (
  <Text
    style={StyleSheet.compose(
      {
        fontSize: fontSizeType,
        fontWeight: fontWeight ? fontWeight : getWeight(fontType),
        color: textColor,
      },
      style,
    )}
    {...rest}>
    {children}
  </Text>
);



