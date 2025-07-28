import {getChatIdFromRoutingId} from '@utils/Storage/connections';

import ReceiveDirectMessage from './ReceiveDirect/ReceiveDirectMessage';
import ReceiveGroupMessage from './ReceiveGroup/ReceiveGroupMessage';

class ReceiveMessage {
  private message: any;
  private chatId: string;
  private receiveTime: string;
  private isGroupMessage: boolean;
  private senderId: string | null;
  private routingId: string;
  //construct the class
  constructor(messageRaw: any, receiveTime: string = new Date().toISOString()) {
    this.message = this.processRawMessage(messageRaw);
    let messageTime = receiveTime;
    try {
      if (this.message.timestamp) {
        const serverTime = new Date(this.message.timestamp).toISOString();
        messageTime = serverTime;
      }
    } catch (error) {
      console.log('Incompatible time stamp received', error);
    }
    this.receiveTime = messageTime;
    this.routingId = this.assignRoutingId();
    //empty string is initially assigned to chat Id.
    //We will later extrapolate chatId from routingId.
    this.chatId = '';
    this.isGroupMessage = this.checkIfGroupMessage();
    this.senderId = this.assignSenderId();
  }
  //processes raw message
  private processRawMessage(messageRaw: any) {
    try {
      const processed = JSON.parse(messageRaw);
      return processed;
    } catch (error) {
      console.log('error processing raw message: ', error);
      return messageRaw;
    }
  }
  //assigns chatId
  private assignRoutingId(): string {
    return (
      this.message.lineId ||
      this.message.deletion ||
      this.message.group ||
      this.message.removedFromGroup ||
      ''
    );
  }
  //checks if group message
  private checkIfGroupMessage(): boolean {
    return this.message.group || this.message.removedFromGroup ? true : false;
  }
  //assigns sender Id
  private assignSenderId(): string | null {
    if (this.isGroupMessage) {
      return this.message.sender || '';
    }
    return null;
  }

  /**
   * Extrapolate chatId to proceed with message processing.
   */
  private async extrapolateChatId() {
    try {
      const extrapolatedChatId = await getChatIdFromRoutingId(this.routingId);
      if (!extrapolatedChatId) {
        throw new Error('NoChatIdForRoutingId');
      }
      this.chatId = extrapolatedChatId;
    } catch (error) {
      console.log(
        'No chatId for routing Id. Using routing Id as chat Id: ',
        error,
      );
      this.chatId = this.routingId;
    }
  }

  //receives message appropriately
  public async receive() {
    try {
      //extrapolate chat Id.
      await this.extrapolateChatId();
      if (this.isGroupMessage) {
        //call group receive class and receive
        const receiver = new ReceiveGroupMessage(
          this.chatId,
          this.routingId,
          this.senderId,
          this.message,
          this.receiveTime,
        );
        await receiver.receive();
      } else {
        //call direct receive class and receive
        const receiver = new ReceiveDirectMessage(
          this.chatId,
          this.routingId,
          this.message,
          this.receiveTime,
        );
        await receiver.receive();
      }
    } catch (error: any) {
      if (error.message !== 'AttemptedReprocessingError') {
        console.log('Error receiving message: ', error);
      }
    }
  }
}

export default ReceiveMessage;
