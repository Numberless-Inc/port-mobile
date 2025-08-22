import React, {ReactNode, useEffect, useRef} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import {PortSpacing, screen} from '@components/ComponentUtils';
import DynamicColors from '@components/DynamicColors';
import {
  FontSizeType,
  FontType,
  NumberlessText,
} from '@components/NumberlessText';

import {
  MessageSelectionMode,
  useSelectionContext,
} from '@screens/DirectChat/ChatContexts/SelectedMessages';

import {
  ContentType,
  InfoContentTypes,
  MessageStatus,
  UpdateRequiredMessageContentTypes,
} from '@utils/Messaging/interfaces';
import SendMessage from '@utils/Messaging/Send/SendMessage';
import {LoadedMessage} from '@utils/Storage/DBCalls/lineMessage';
import {generateISOTimeStamp, getDateStamp} from '@utils/Time';

import {InfoBubble} from './InfoBubble';
import {MessageBubble} from './MessageBubble';



//Currently only sends read receipts for DMs
const sendReadReceipt = async (chatId: string, message: LoadedMessage) => {
  if (
    message.shouldAck &&
    !message.sender &&
    UpdateRequiredMessageContentTypes.includes(message.contentType)
  ) {
    //If message wasn't sent by us, it has to be delivered at the least and only then do we need to send an update.
    if (
      message.messageStatus !== undefined &&
      message.messageStatus === MessageStatus.delivered
    ) {
      const sender = new SendMessage(chatId, ContentType.receipt, {
        messageId: message.messageId,
        readAt: generateISOTimeStamp(),
      });
      sender.send();
    }
  }
};

//Decides if a date stamp should appear before a message bubble.
//If date stamp shouldn't appear, decides if additional padding needs to be added.
const MessagePrecursor = ({
  message,
  hasExtraPadding,
  isDateBoundary,
}: {
  message: LoadedMessage;
  hasExtraPadding: boolean;
  isDateBoundary: boolean;
}): ReactNode => {
  const Colors = DynamicColors();
  return (
    <View style={styles.precursorContainer}>
      {isDateBoundary && (
        <View style={styles.dateContainer}>
          <NumberlessText
            fontSizeType={FontSizeType.s}
            fontType={FontType.md}
            textColor={Colors.text.primary}>
            {getDateStamp(message.timestamp)}
          </NumberlessText>
        </View>
      )}
      {hasExtraPadding && !isDateBoundary && (
        <View style={{width: screen.width, paddingVertical: 4}} />
      )}
    </View>
  );
};

export const MessageBubbleParent = ({
  message,
  isDateBoundary,
  hasExtraPadding,
}: {
  message: LoadedMessage;
  isDateBoundary: boolean;
  hasExtraPadding: boolean;
}): ReactNode => {
  const chatId = message.chatId;

  const {selectionMode, selectedMessages, toggleSelected} =
    useSelectionContext();

  const bubbleRef = useRef(null);

  const toggleSelectedWithMeasuredLayout = () => {
    bubbleRef.current.measure((_x, _y, _width, height, _pageX, pageY) => {
      toggleSelected(message, {
        height,
        y: pageY,
      });
    });
  };

  const handleMessageBubbleLongPress = () => {
    // Only do something if we're in single message selection mode
    if (MessageSelectionMode.Single === selectionMode) {
      const hapticsOptions = {
        enableVibrateFallback: true /* iOS Only */,
        ignoreAndroidSystemSettings: true /* Android Only */,
      };
      ReactNativeHapticFeedback.trigger('impactMedium', hapticsOptions);
      toggleSelectedWithMeasuredLayout();
    }
  };

  const handlePress = () => {
    // Only add or remove this message from the list of selected messages when clicked if
    // in multi select mode
    if (MessageSelectionMode.Multiple !== selectionMode) {
      return false;
    }
    toggleSelectedWithMeasuredLayout();
    return true;
  };

  //responsible for sending read receipts
  useEffect(() => {
    sendReadReceipt(chatId, message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View>
      <MessagePrecursor
        message={message}
        isDateBoundary={isDateBoundary}
        hasExtraPadding={hasExtraPadding}
      />
      <View style={styles.container}>
        {InfoContentTypes.includes(message.contentType) ? (
          <View style={styles.infoBubbleContainer}>
            <InfoBubble message={message} />
          </View>
        ) : (
          <Pressable
            ref={bubbleRef}
            style={
              message.sender
                ? {
                    ...styles.messageBubbleContainer,
                    justifyContent: 'flex-end',
                  }
                : styles.messageBubbleContainer
            }
            onPress={handlePress}
            onLongPress={handleMessageBubbleLongPress}
            delayLongPress={300}>
            <MessageBubble
              message={message}
              handleLongPress={handleMessageBubbleLongPress}
              selected={selectedMessages.some(
                m => m.messageId === message.messageId,
              )}
              swipeable={true}
              handlePress={handlePress}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  precursorContainer: {
    width: screen.width,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: PortSpacing.secondary.uniform,
    paddingVertical: PortSpacing.tertiary.uniform,
  },
  container: {
    width: screen.width,
    alignSelf: 'flex-end',
  },
  messageBubbleContainer: {
    width: screen.width - PortSpacing.secondary.left,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignSelf: 'flex-end',
  },
  infoBubbleContainer: {
    width: screen.width,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  empty: {},
  overlay: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(78, 117, 255, 0.25)',
  },
});
