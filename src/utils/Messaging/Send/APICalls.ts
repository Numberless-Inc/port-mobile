import axios from 'axios';

import {MESSAGING_RESOURCE} from '@configs/api';

import {getToken} from '@utils/ServerAuth';
import {getBasicConnectionInfo} from '@utils/Storage/connections';
import {ChatType} from '@utils/Storage/DBCalls/connections';
import {ServerAuthToken} from '@utils/Storage/RNSecure/secureTokenHandler';

/**
 * API call to send a payload
 * @param chatId
 * @param processedPayload - payload string to send
 * @param isGroup
 * @param silent - if push notification should be silenced. default is false.
 */
export async function sendObject(
  chatId: string,
  processedPayload: object,
  isGroup: boolean = false,
  silent: boolean = false,
): Promise<void> {
  const token: ServerAuthToken = await getToken();

  const connection = await getBasicConnectionInfo(chatId);
  if (!connection) {
    throw new Error('No such connection');
  }
  let isGroupChat = isGroup;
  isGroupChat = connection.connectionType === ChatType.group;
  const routingId = connection.routingId;
  //post to messaging resource
  await axios.post(
    MESSAGING_RESOURCE,
    {
      type: isGroupChat ? 'group' : 'line',
      message: processedPayload,
      chatId: routingId,
      silent,
    },
    {headers: {Authorization: `${token}`}},
  );
}
