/**
 * Tries to empty journal by sending messages.
 * unsent messages get re-journaled.
 */
import {getGroupJournaled} from '@utils/Storage/groupMessages';
import {getJournaled} from '@utils/Storage/messages';

import SendMessage from './SendMessage';

async function sendJournaled() {
  try {
    //get current journal

    const journaledGroupMessages = await getGroupJournaled();
    console.log('journaled group messages: ', journaledGroupMessages);
    for (let index = 0; index < journaledGroupMessages.length; index++) {
      try {
        const {contentType, data, replyId, messageId, chatId, singleRecepient} =
          journaledGroupMessages[index];

        const sender = new SendMessage(
          chatId,
          contentType,
          data,
          replyId,
          messageId,
          singleRecepient,
        );
        await sender.retry();
      } catch (error) {
        console.log(
          'Error in emptying journaled group message: ',
          error,
          journaledGroupMessages[index],
        );
      }
    }

    const journaledMessages = await getJournaled();
    for (let index = 0; index < journaledMessages.length; index++) {
      try {
        const {contentType, data, replyId, messageId, chatId} =
          journaledMessages[index];

        const sender = new SendMessage(
          chatId,
          contentType,
          data,
          replyId,
          messageId,
        );
        await sender.retry();
      } catch (error) {
        console.log(
          'Error in emptying journaled message: ',
          error,
          journaledMessages[index],
        );
      }
    }
  } catch (error) {
    console.log('Error fetching journal: ', error);
  }
}

export default sendJournaled;
