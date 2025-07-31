import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors as ColorsGuide } from '@components/colorGuide';
import DynamicColors from '@components/DynamicColors';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import { Spacing, Width } from '@components/spacingGuide';

import { useChatContext } from '@screens/DirectChat/ChatContext';

import { LineMessageData } from '@utils/Storage/DBCalls/lineMessage';
import useDynamicSVG from '@utils/Themes/createDynamicSVG';
import { wait } from '@utils/Time';

import { useTheme } from 'src/context/ThemeContext';

import PopUpActions from './PopUpActions';

// this component is reponsible for textinput for message bar in direct chat
const TextComponent = ({
  replyToMessage,
  text,
  setText,
  inputRef,
  onPressSend,
  setMicrophoneClicked,
  chatId,
  showPreview,
}: {
  replyToMessage: LineMessageData | null; // message to be replied to
  text: string;
  setText: (val: string) => void;
  inputRef: any;
  onPressSend: () => void;
  setMicrophoneClicked: (p: boolean) => void;
  chatId: string;
  showPreview: boolean;
}) => {
  const Colors = DynamicColors();
  const { themeValue } = useTheme();

  // to focus on the text input
  const [isFocused, setIsFocused] = useState(false);
  const {
    togglePopUp,
    isPopUpVisible,
    setMessageToEdit,
    messageToEdit,
    onCleanCloseFocus,
  } = useChatContext();

  const styles = styling(Colors);

  const onChangeText = (newText: string): void => {
    setText(newText);
  };

  const svgArray = [
    {
      assetName: 'SendIcon',
      light: require('@assets/dark/icons/WhiteArrowUp.svg').default,
      dark: require('@assets/dark/icons/WhiteArrowUp.svg').default,
    },
    {
      assetName: 'MicrophoneIcon',
      light: require('@assets/light/icons/MicrophoneFilled.svg').default,
      dark: require('@assets/dark/icons/MicrophoneFilled.svg').default,
    },
    {
      assetName: 'Cross',
      light: require('@assets/light/icons/CrossWhite.svg').default,
      dark: require('@assets/icons/GreyCrossLight.svg').default,
    },
    {
      assetName: 'EditIcon',
      light: require('@assets/light/icons/EditLight.svg').default,
      dark: require('@assets/dark/icons/EditIcon.svg').default,
    },
    {
      assetName: 'Plus',
      light: require('@assets/light/icons/GreyPlus.svg').default,
      dark: require('@assets/dark/icons/WhitePlus.svg').default,
    },
  ];

  const results = useDynamicSVG(svgArray);

  const MicrophoneIcon = results.MicrophoneIcon;
  const SendIcon = results.SendIcon;
  const Cross = results.Cross;
  const EditIcon = results.EditIcon;
  const Plus = results.Plus;

  const options = {
    enableVibrateFallback: true /* iOS Only */,
    ignoreAndroidSystemSettings: true /* Android Only */,
  };

  // handles sending of text
  const onHandleClick = () => {
    if (text.length > 0 || replyToMessage) {
      onPressSend();
    } else {
      RNReactNativeHapticFeedback.trigger('impactHeavy', options);
      // toggles between showing audio recorder and text component
      setMicrophoneClicked(true);
    }
  };

  const onPressPurpleActionButton = async () => {
    RNReactNativeHapticFeedback.trigger('impactMedium', options);
    setMessageToEdit(null);
    setText('');
    // close keyboard and open popup actions
    if (!isPopUpVisible) {
      Keyboard.dismiss();
      await wait(300);
      togglePopUp();
    } else {
      // open native keyboard and focus on textinput
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // util for text input focus
  const onInputFocus = async () => {
    setIsFocused(true);
    // if popup actions visible, close it
    if (isPopUpVisible) {
      togglePopUp();
    }
  };

  const onPlusPressed = async () => {
    RNReactNativeHapticFeedback.trigger('impactMedium', options);
    // dismiss keyboard and open popup
    Keyboard.dismiss();
    await wait(100);
    togglePopUp();
  };

  // to animate transition between keyboard icon and plus icon
  const scaleKeyboard = useSharedValue(isPopUpVisible ? 1 : 0);
  const scalePlus = useSharedValue(isPopUpVisible ? 0 : 1);

  const animatedStyleKeyboard = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleKeyboard.value }],
      opacity: interpolate(scaleKeyboard.value, [0, 1], [0, 1]),
    };
  });

  const animatedStylePlus = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scalePlus.value }],
      opacity: interpolate(scalePlus.value, [0, 1], [0, 1]),
    };
  });
  useMemo(() => {
    scaleKeyboard.value = withTiming(isPopUpVisible ? 1 : 0, { duration: 300 });
    scalePlus.value = withTiming(isPopUpVisible ? 0 : 1, { duration: 300 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopUpVisible]);

  return (
    <>
      <View style={styles.mainContainer}>
        {!replyToMessage && !showPreview && (
          <View style={styles.plus}>
            <TouchableOpacity
              hitSlop={32}
              onPress={onPressPurpleActionButton}>
              {isPopUpVisible ? (
                <Animated.View
                  style={[
                    animatedStyleKeyboard,
                  ]}>
                  <Cross height={24} width={24} />
                </Animated.View>
              ) : (
                <Animated.View
                  style={[
                    animatedStylePlus,
                  ]}>
                  <Plus height={24} width={24} />
                </Animated.View>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View
          style={
            replyToMessage || showPreview
              ? styles.replyInputBox
              : styles.inputBox
          }>
          <>
            {messageToEdit ? (
              <View style={styles.editMessageContainer}>
                <TouchableOpacity
                  style={{
                    width: '100%',
                    padding: Spacing.s,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: Spacing.s,
                  }}
                  onPress={() => {
                    setMessageToEdit(null);
                    setText('');
                    onCleanCloseFocus();
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <EditIcon height={16} width={16} />
                    <NumberlessText
                      style={{ marginLeft: Spacing.s }}
                      textColor={Colors.text.subtitle}
                      fontWeight={FontWeight.rg}
                      fontSizeType={FontSizeType.m}>
                      Edit message
                    </NumberlessText>
                  </View>
                  <Cross />
                </TouchableOpacity>
                <TextInput
                  style={styles.inputText}
                  ref={inputRef}
                  textAlign="left"
                  multiline
                  placeholder={isFocused ? '' : 'Message'}
                  placeholderTextColor={themeValue === 'dark' ? ColorsGuide.dark.text.subtitle : ColorsGuide.light.text.subtitle}
                  onChangeText={onChangeText}
                  value={text}
                  onFocus={onInputFocus}
                  onBlur={() => setIsFocused(false)}
                />
              </View>
            ) : (
              <TextInput
                style={styles.inputText}
                ref={inputRef}
                textAlign="left"
                multiline
                placeholder={isFocused ? '' : 'Message'}
                placeholderTextColor={themeValue === 'dark' ? ColorsGuide.dark.text.subtitle : ColorsGuide.light.text.subtitle}
                onChangeText={onChangeText}
                value={text}
                onFocus={onInputFocus}
                onBlur={() => setIsFocused(false)}
              />
            )}
          </>
          {(replyToMessage || showPreview) && (
            <Pressable onPress={onPlusPressed} hitSlop={24}>
              <Plus />
            </Pressable>
          )}
        </View>

        <View style={styles.send}>
          {text.length > 0 || replyToMessage || messageToEdit ? (
            <TouchableOpacity
              disabled={!!(messageToEdit && text.length === 0)}
              onPress={onHandleClick}
              activeOpacity={0.7}>
              <View style={{ ...styles.sendIcon, backgroundColor: themeValue === 'dark' ? ColorsGuide.dark.purple : ColorsGuide.common.black }}>
                <SendIcon />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onHandleClick} style={{
              padding: Spacing.s,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <MicrophoneIcon />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* opens popup actions */}
      {isPopUpVisible && (
        <PopUpActions
          chatId={chatId}
          togglePopUp={togglePopUp}
        />
      )}
    </>
  );
};
const styling = (colors: any) =>
  StyleSheet.create({
    mainContainer: {
      flexDirection: 'row',
      width: Width.screen,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.s,
    },
    plus: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 40,
      height: 40,
      borderRadius: 100,
    },
    send: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 40,
      height: 40,
      borderRadius: 100,
    },
    sendIcon: {
      width: 40,
      height: 40,
      borderRadius: 100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputBox: {
      flex: 1,
      flexDirection: 'row',
      borderRadius: 24,
      justifyContent: 'flex-start',
      alignItems: 'center',
      overflow: 'hidden',
    },
    replyInputBox: {
      flex: 1,
      backgroundColor: colors.primary.surface2,
      flexDirection: 'row',
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      overflow: 'hidden',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingRight: Spacing.s,
      paddingVertical: Spacing.xs,
    },
    inputText: {
      maxHeight: 110,
      flex: 1,
      backgroundColor: colors.primary.surface2,
      height: undefined,
      minHeight: 40,
      color: colors.text.primary,
      justifyContent: 'center',
      fontSize: FontSizeType.l,
      fontWeight: FontWeight.rg,
      paddingHorizontal: Spacing.l,
      paddingVertical: 10,
    },
    editMessageContainer: {
      flex: 1,
      flexDirection: 'column',
      marginTop: Spacing.s,
      backgroundColor: colors.primary.surface2,
      borderRadius: 16,
    },
  });

export default TextComponent;
