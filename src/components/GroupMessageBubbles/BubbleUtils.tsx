import React, {ReactNode, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';

import FileViewer from 'react-native-file-viewer';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {PortColors, PortSpacing, screen} from '@components/ComponentUtils';
import DynamicColors from '@components/DynamicColors';
import {
  FontSizeType,
  FontType,
  NumberlessText,
} from '@components/NumberlessText';

import store from '@store/appStore';

import {MessageStatus} from '@utils/Messaging/interfaces';
import {handleAsyncMediaDownload} from '@utils/Messaging/Receive/ReceiveGroup/HandleMediaDownload';
import {SendMediaGroupMessage} from '@utils/Messaging/Send/SendGroupMessage/senders/MediaSender';
import {
  GroupMessageData,
  GroupReplyContent,
  LoadedGroupMessage,
} from '@utils/Storage/DBCalls/groupMessage';
import {getSafeAbsoluteURI} from '@utils/Storage/StorageRNFS/sharedFileHandlers';
import {getTimeStamp} from '@utils/Time';

import Sending from '@assets/icons/statusIndicators/sendingBubble.svg';

//max width of message bubble
export const MAX_WIDTH = screen.width - 2 * PortSpacing.secondary.uniform - 64;
//max width of content container inside messabe bubble
export const MAX_WIDTH_CONTENT = MAX_WIDTH - 8;
//max width of reply container inside messabe bubble
export const MAX_WIDTH_REPLY = MAX_WIDTH - 8;
//min width of reply container inside messabe bubble
export const MIN_WIDTH_REPLY = 100;
//height of file bubble
export const FILE_BUBBLE_HEIGHT = 66;
//width of media bubble inside media reply bubble
export const REPLY_MEDIA_WIDTH = 56;
//initial height of media bubble inside media reply bubble
export const REPLY_MEDIA_HEIGHT = 48;
//width of time stamp container
export const TIME_STAMP_WIDTH = 64;
//width of image or video bubble;
export const IMAGE_DIMENSIONS = MAX_WIDTH_CONTENT - PortSpacing.primary.uniform;

export const TIME_STAMP_TEXT_PADDING_SENDER = '                     ‎';
export const TIME_STAMP_TEXT_PADDING_RECEIVER = '                 ‎';



export const hasOnlyEmojis = (text: string): boolean => {
  if (text.length > 5) {
    return false;
  }
  if (text === '') {
    return false;
  }
  const emojiRegex =
    /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B06}\u{2934}\u{2935}\u{2B05}\u{25AA}\u{25AB}\u{25FE}\u{25FD}\u{25FB}\u{25FC}\u{25B6}\u{25C0}]*$/gu;

  const hasEmojis = emojiRegex.test(text);
  return hasEmojis;
};

export const getEmojiSize = (text: string): FontSizeType => {
  if (text.length === 2) {
    return FontSizeType.el;
  } else if (text.length === 4) {
    return FontSizeType.em;
  } else {
    return FontSizeType.es;
  }
};



export const handleDownload = async (
  chatId: string,
  messageId: string,
  onFailure: () => void = () => {},
) => {
  try {
    await handleAsyncMediaDownload(chatId, messageId);
    store.dispatch({
      type: 'PING',
      payload: 'PONG',
    });
  } catch (error) {
    console.error('Error downloading media: ', error);
    onFailure();
  }
};

/**
 * Retries sending a media message in a direct chat
 * @param message
 */
export const handleRetry = async (message: GroupMessageData) => {
  try {
    const sender = new SendMediaGroupMessage(
      message.chatId,
      message.contentType,
      message.data,
      message.replyId,
      message.messageId,
    );
    await sender.retry();
  } catch (error) {
    console.error('Error sending multimedia: ', error);
  }
};

export const handleMediaOpen = (
  fileURI: string | undefined | null,
  fileName: string,
  onUndefined: () => void,
  onError: () => void,
) => {
  if (fileURI) {
    const safeAbsoluteURI = getSafeAbsoluteURI(fileURI, 'doc');
    const absoluteFilePath = safeAbsoluteURI.slice('file://'.length);
    FileViewer.open(absoluteFilePath, {
      displayName: fileName,
      showOpenWithDialog: true,
    }).catch(e => {
      console.log('Error opening file: ', e);
      onError();
    });
  } else {
    onUndefined();
  }
};

export const RenderTimeStamp = ({
  message,
  stampColor = 'rg',
  showReadReceipts = true,
  edited = false,
}: {
  message: LoadedGroupMessage;
  stampColor?: 'rg' | 'w'; // regular or white
  showReadReceipts?: boolean;
  edited?: boolean;
}): ReactNode => {
  const Colors = DynamicColors();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      transform: [
        {
          translateX: withTiming(
            message.messageStatus === MessageStatus.sent ? 16 : 1,
            {
              duration: 400,
            },
          ),
        },
      ],
    };
  });

  const rotation = useSharedValue(0);

  useMemo(() => {
    rotation.value = withRepeat(
      withTiming(360, {duration: 500, easing: Easing.linear}),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedRotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{rotate: `${rotation.value}deg`}],
    };
  });

  if (message.messageStatus === MessageStatus.failed) {
    return (
      <View style={styles.timestampContainer}>
        <NumberlessText
          style={{marginTop: 8}}
          fontSizeType={FontSizeType.xs}
          fontType={FontType.md}
          textColor={Colors.primary.red}>
          Failed to send message
        </NumberlessText>
      </View>
    );
  } else {
    return (
      <View style={styles.timestampContainer}>
        <Animated.View style={animatedStyle}>
          {edited && (
            <NumberlessText
              style={{
                paddingRight: 2,
              }}
              textColor={Colors.text.subtitle}
              fontSizeType={FontSizeType.s}
              fontType={FontType.rg}>
              Edited
            </NumberlessText>
          )}
          <NumberlessText
            fontSizeType={FontSizeType.s}
            fontType={FontType.rg}
            textColor={
              stampColor === 'w'
                ? Colors.primary.darkgrey
                : Colors.text.subtitle
            }>
            {getTimeStamp(message.timestamp)}
          </NumberlessText>

          {showReadReceipts && message.sender && (
            <View style={{marginLeft: 3}}>
              {message.messageStatus === MessageStatus.sent ? (
                <View style={styles.transparentblock} />
              ) : (
                <Animated.View style={animatedRotationStyle}>
                  <Sending />
                </Animated.View>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    );
  }
};

export const extractLink = (text: string): string | null => {
  const urlRegex: RegExp =
    /^(?:https?:\/\/)(?:www\.)?[\w.-]+\.[a-zA-Z]{2,}(?:\/\S*)?$/;
  const words = text.trim().split(/\s+|'/);
  for (const word of words) {
    if (urlRegex.test(word)) {
      return word;
    }
  }
  return null;
};

export function memberIdToHex(
  memberId: string | null | undefined,
  colors: any,
  defaultColor: string,
): string {
  if (!memberId) {
    return defaultColor;
  }
  const colorKeys = Object.keys(colors) as Array<keyof typeof colors>;

  // Compute a more varied hash to distribute folder IDs more evenly across colors
  let hash = 0;
  for (let i = 0; i < memberId.length; i++) {
    hash = (hash * 31 + memberId.charCodeAt(i)) % 1000000007; // A large prime number
  }

  const colorIndex = hash % colorKeys.length;
  return colors[colorKeys[colorIndex]];
}

const styles = StyleSheet.create({
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingLeft: PortSpacing.tertiary.left,
  },
  transparentblock: {
    height: 12,
    width: 12,
    backgroundColor: 'transparent',
  },
});
