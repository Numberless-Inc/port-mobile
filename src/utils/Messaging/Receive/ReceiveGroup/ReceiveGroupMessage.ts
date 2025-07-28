import CryptoDriver from '@utils/Crypto/CryptoDriver';
import Group from '@utils/Groups/Group';
import {PayloadMessageParams} from '@utils/Messaging/interfaces';

import GroupReceiveAction from './GroupReceiveAction';
import {groupReceiveActionPicker} from './possibleActions';

class ReceiveGroupMessage {
  private message: any;
  private chatId: string;
  private groupId: string;
  private receiveTime: string;
  private senderId: string | null;
  private receiveClass: GroupReceiveAction | null;
  private decryptedMessageContent: PayloadMessageParams | null;
  //object containing unencrypted message sent by the server or encrytped message sent by another user
  private content: any;
  //construct the class
  constructor(
    chatId: string,
    groupId: string,
    senderId: string | null,
    message: any,
    receiveTime: string,
  ) {
    this.message = message;
    this.receiveTime = receiveTime;
    this.chatId = chatId;
    this.groupId = groupId;
    this.receiveClass = null;
    this.senderId = senderId;
    this.decryptedMessageContent = null;
  }
  /**
   * Save the message content object (un-decrypted)
   */
  private extractContent(): void {
    try {
      if (!this.message.messageContent) {
        this.content = null;
        return;
      }
      this.content = this.message.messageContent;
    } catch (error) {
      console.log('Error in extracting message content: ', error);
      this.content = null;
    }
  }
  /**
   * save decrypted message content if the message requires decryption.
   */
  private async extractDecryptedMessageContent(): Promise<void> {
    try {
      this.extractContent();
      if (!this.content) {
        this.decryptedMessageContent = null;
        return;
      } else {
        if (
          this.content.encryptedContent &&
          this.senderId &&
          this.senderId !== ''
        ) {
          const group = new Group(this.chatId);
          const member = await group.getMember(this.senderId);
          const cryptoDriver = new CryptoDriver(member!.cryptoId);
          const decryptedAndProcessed = JSON.parse(
            await cryptoDriver.decrypt(this.content.encryptedContent),
          );
          this.decryptedMessageContent =
            decryptedAndProcessed as PayloadMessageParams;
        } else {
          this.decryptedMessageContent = null;
        }
      }
    } catch (error) {
      console.log('Error in extracting decrypted message content: ', error);
      this.decryptedMessageContent = null;
    }
  }
  //assign receive action
  private async assignReceiverClass() {
    this.receiveClass = await groupReceiveActionPicker(
      this.chatId,
      this.groupId,
      this.senderId,
      this.message,
      this.receiveTime,
      this.content,
      this.decryptedMessageContent,
    );
  }
  //perform receive action
  async receive() {
    console.log('group message received', this.message);
    await this.extractDecryptedMessageContent();
    await this.assignReceiverClass();
    if (this.receiveClass) {
      await this.receiveClass.validate();
      await this.receiveClass.performAction();
    }
  }
}

export default ReceiveGroupMessage;
