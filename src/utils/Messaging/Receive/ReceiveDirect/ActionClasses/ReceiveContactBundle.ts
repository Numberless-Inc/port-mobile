// this is to receieve the final contact bundle
import {getChatPermissions} from '@utils/ChatPermissions';
import getConnectionTextByContentType from '@utils/Connections/getConnectionTextByContentType';
import {ContactBundleParams, MessageStatus} from '@utils/Messaging/interfaces';
import {displaySimpleNotification} from '@utils/Notifications';
import {
  getConnection,
  updateConnectionOnNewMessage,
} from '@utils/Storage/connections';
import {
  ChatType,
  NewMessageCountAction,
} from '@utils/Storage/DBCalls/connections';

import DirectReceiveAction from '../DirectReceiveAction';
class ReceiveContactBundle extends DirectReceiveAction {
  generatePreviewText(): string {
    this.decryptedMessageContent = this.decryptedMessageContentNotNullRule();
    const text = getConnectionTextByContentType(
      this.decryptedMessageContent.contentType,
      this.decryptedMessageContent.data,
    );
    return text;
  }

  async performAction(): Promise<void> {
    this.decryptedMessageContent = this.decryptedMessageContentNotNullRule();
    await this.doubleProcessingGuard();
    //save message to storage
    await this.saveMessage();
    await updateConnectionOnNewMessage(
      {
        chatId: this.chatId,
        text: this.generatePreviewText(),
        readStatus: MessageStatus.latest,
        recentMessageType: this.decryptedMessageContent.contentType,
        latestMessageId: this.decryptedMessageContent.messageId,
        timestamp: this.receiveTime,
      },
      NewMessageCountAction.increment,
    );
    //notify user if notifications are ON
    const permissions = await getChatPermissions(this.chatId, ChatType.direct);
    await this.notify(permissions.notifications);
  }
  async notify(shouldNotify: boolean) {
    if (shouldNotify) {
      this.decryptedMessageContent = this.decryptedMessageContentNotNullRule();
      const connection = await getConnection(this.chatId);
      const notificationData = {
        title: connection.name,
        body:
          'contact of ' +
          (this.decryptedMessageContent.data as ContactBundleParams).bundle
            .name +
          ' has been shared with you',
      };
      displaySimpleNotification(
        notificationData.title,
        notificationData.body,
        !connection.disconnected,
        this.chatId,
      );
    }
  }
}

export default ReceiveContactBundle;
