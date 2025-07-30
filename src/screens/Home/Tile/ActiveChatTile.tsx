import React, {ReactNode, useMemo, useState} from 'react';
import {Keyboard, Pressable, StyleSheet, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import {useColors} from '@components/colorGuide';
import {PortSpacing, screen} from '@components/ComponentUtils';
import DynamicColors from '@components/DynamicColors';
import {
  FontSizeType,
  FontType,
  NumberlessText,
} from '@components/NumberlessText';
import {AvatarBox} from '@components/Reusable/AvatarBox/AvatarBox';

import {DEFAULT_AVATAR} from '@configs/constants';

import {ContentType} from '@utils/Messaging/interfaces';
import {toggleRead} from '@utils/Storage/connections';
import {ChatType, ConnectionInfo} from '@utils/Storage/DBCalls/connections';

import {useTheme} from 'src/context/ThemeContext';

import DisplayStatus from './DisplayStatus';
import RenderTimestamp from './RenderTimestamp';

function NewChatText({isGroup}: {isGroup: boolean}): ReactNode {
  const colors = useColors();
  return (
    <NumberlessText
      ellipsizeMode="tail"
      numberOfLines={1}
      fontType={FontType.rg}
      style={{
        flex: 1,
      }}
      fontSizeType={FontSizeType.m}
      textColor={colors.purple}>
      {isGroup ? 'New group' : 'New connection'}
    </NumberlessText>
  );
}
function DisconnectedText(_: any): ReactNode {
  const colors = useColors();
  return (
    <NumberlessText
      ellipsizeMode="tail"
      numberOfLines={1}
      fontType={FontType.rg}
      style={{
        flex: 1,
      }}
      fontSizeType={FontSizeType.m}
      textColor={colors.red}>
      Disconnected
    </NumberlessText>
  );
}

function LatestMessageText({text}: {text: string}): ReactNode {
  const colors = useColors();
  return (
    <View style={{flexDirection: 'row', flex: 1}}>
      <NumberlessText
        ellipsizeMode="tail"
        numberOfLines={2}
        style={{width: screen.width - 160}}
        fontType={FontType.rg}
        fontSizeType={FontSizeType.m}
        textColor={colors.text.subtitle}>
        {text}
      </NumberlessText>
    </View>
  );
}

export default function ActiveChatTile(
  initialProps: ConnectionInfo,
): ReactNode {
  const [props, setProps] = useState(initialProps);
  useMemo(() => {
    setProps(initialProps);
  }, [initialProps]);

  const navigation = useNavigation<any>();
  //handles navigation to a chat screen and toggles chat to read.
  const openChat = (): void => {
    Keyboard.dismiss();
    // Wait a moment for keyboard to dismiss before navigating
    setTimeout(() => {
      toggleRead(props.chatId);
    setProps({...props, newMessageCount: 0});
    // Push the right screen onto the stack so we can navigate back here when we go back
    navigation.push(
      props.connectionType === ChatType.group ? 'GroupChat' : 'DirectChat',
      {
        chatId: props.chatId,
        isConnected: !props.disconnected,
        profileUri: props.pathToDisplayPic || DEFAULT_AVATAR,
        name: props.name,
      },
    );
    }, 200); // 100–200ms is usually enough;
    
  };

  const Colors = DynamicColors();
  const {themeValue} = useTheme();
  const styles = styling(Colors, themeValue);

  return (
    <View style={{...styles.container, justifyContent: 'flex-end'}}>
      <View style={styles.container}>
        <Pressable
          style={styles.tile}
          onPress={openChat}
          pointerEvents="box-only">
          <View style={styles.avatarArea}>
            <AvatarBox profileUri={props.pathToDisplayPic} avatarSize="s+" />
          </View>
          <View style={styles.nonAvatarArea}>
            <View style={styles.nameAndTimestamp}>
              <View style={styles.nameContainer}>
                <NumberlessText
                  textColor={Colors.primary.mainelements}
                  style={{flexShrink: 1}}
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  fontType={FontType.rg}
                  fontSizeType={FontSizeType.l}>
                  {props.name || 'New contact'}
                </NumberlessText>
              </View>
              <RenderTimestamp timestamp={props.timestamp} />
            </View>
            <View style={styles.textAndStatus}>
              {props.disconnected ? (
                <DisconnectedText />
              ) : props.recentMessageType === ContentType.newChat ? (
                <NewChatText
                  isGroup={props.connectionType === ChatType.group}
                />
              ) : (
                // The average case, just display the most recent message content
                <>
                  <LatestMessageText text={props.text || ''} />
                  <DisplayStatus
                    deleted={props.recentMessageType === ContentType.deleted}
                    unreadCount={props.newMessageCount}
                    readStatus={props.readStatus}
                  />
                </>
              )}
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styling = (colors: any, themeValue: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      width: screen.width,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor:
        themeValue === 'dark'
          ? colors.primary.background
          : colors.primary.surface,
    },
    tile: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginHorizontal: PortSpacing.tertiary.uniform,
      paddingTop: PortSpacing.secondary.uniform,
      overflow: 'hidden',
    },
    avatarArea: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: PortSpacing.tertiary.uniform,
      alignSelf: 'center',
      paddingBottom: PortSpacing.medium.uniform,
    },
    nonAvatarArea: {
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      borderBottomColor: colors.primary.stroke,
      borderBottomWidth: 0.25,
      flex: 1,
      paddingBottom: PortSpacing.medium.uniform,
    },
    nameAndTimestamp: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    textAndStatus: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      width: '100%',
    },
    nameContainer: {
      overflow: 'hidden',
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: PortSpacing.tertiary.right,
    },
  });
