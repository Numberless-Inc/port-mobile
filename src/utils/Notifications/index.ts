import {AppState, Platform, Settings} from 'react-native';

import notifee, {
  AndroidColor,
  AndroidGroupAlertBehavior,
  AndroidMessagingStyle,
  AndroidPerson,
  AndroidStyle,
  AndroidVisibility,
  Notification,
} from '@notifee/react-native';
import axios from 'axios';

import {isIOS} from '@components/ComponentUtils';

import {PERMISSION_MANAGEMENT_URL} from '@configs/api';
import {DEFAULT_AVATAR} from '@configs/constants';

import {getToken} from '@utils/ServerAuth';
import {
  getChatIdFromRoutingId,
  getConnection,
} from '@utils/Storage/connections';
import {ChatType} from '@utils/Storage/DBCalls/connections';
import {getLineData} from '@utils/Storage/lines';
import {updatePermissions} from '@utils/Storage/permissions';

/**
 * Routes the user to the appropriate chat screen when a notification is pressed
 * @param type - The type of notification event (e.g. press, dismiss)
 * @param detail - Contains notification data like chatId and source
 * @param navigation - Navigation object to handle screen transitions
 */
export const performNotificationRouting = async (
  notificationData: any,
  navigation: any,
) => {
  // Only handle notification press events that contain data
  if (!notificationData) {
    return;
  }
  const {chatId, source} = notificationData;
  console.log(chatId, source);

  // Use chatId if available, otherwise fallback to source
  let finalChatId: string;
  if (chatId) {
    finalChatId = chatId as string;
  } else if (source) {
    const x = await getChatIdFromRoutingId(source as string);
    if (x) {
      finalChatId = x;
    } else {
      return;
    }
  } else {
    // Could not get the chatId
    return;
  }
  let connection;
  try {
    connection = await getConnection(finalChatId);
  } catch {
    // Could not find the connection proposed
    console.log('Could not get the right chatId');
    return;
  }
  if (connection.connectionType === ChatType.group) {
    navigation.navigate('GroupChat', {
      chatId: connection.chatId,
      isConnected: !connection.disconnected,
      profileUri: connection.pathToDisplayPic || DEFAULT_AVATAR,
      name: connection.name,
    });
    return;
  }
  if (connection.connectionType === ChatType.direct) {
    navigation.navigate('DirectChat', {
      chatId: connection.chatId,
      isConnected: !connection.disconnected,
      profileUri: connection.pathToDisplayPic || DEFAULT_AVATAR,
      name: connection.name,
      isAuthenticated: connection.authenticated,
    });
    return;
    // Unkown chat type
  }
};

/**
 * Displays all notifications for the app.
 * @param chatName
 * @param body
 * @param chatId the chat that is linked to the notification
 * @param isGroup defines if the chat being linked to is a group
 */
export async function displaySimpleNotification(
  chatName: string,
  body: string,
  isConnected: boolean,
  chatId?: string,
  isGroup: boolean = false,
  memberName?: string,
) {
  if (Platform.OS === 'ios' || AppState.currentState === 'active') {
    // On iOS we let the NSE display the notification
    // On Android, we don't want to display a notification while in the foreground
    return;
  }
  const channelId = await setupNotifee();
  console.info('notification channelId: ', channelId);
  const currentNotifications = await notifee.getDisplayedNotifications();
  let messages: any[] = [];
  let notificationIdToReplace: string | undefined;
  for (let i = 0; i < currentNotifications.length; i++) {
    // Iterate over existing notifications to try to find a matching one.
    console.info(currentNotifications[i]);
    if (
      currentNotifications[i].notification.android?.groupId === chatId &&
      currentNotifications[i].notification.android?.style?.type ===
        AndroidStyle.MESSAGING
    ) {
      messages = (
        currentNotifications[i].notification.android
          ?.style as AndroidMessagingStyle
      ).messages;
      notificationIdToReplace = currentNotifications[i].id;
    }
  }

  // Add the message to the list of existing messages for this chat's notification
  const newestMessage: {
    text: string;
    timestamp: number;
    person?: AndroidPerson;
  } = {
    text: body,
    timestamp: Date.now(),
  };
  if (memberName) {
    const person = {name: memberName};
    newestMessage.person = person;
  }
  messages.push(newestMessage);

  const notification: Notification = {
    title: chatName,
    body: body,
    data: {
      ...(chatId && {chatId: chatId}),
      isGroup: isGroup.toString(),
      isConnected: isConnected.toString(),
    },
    android: {
      channelId,
      smallIcon: 'ic_small_icon',
      style: {
        type: AndroidStyle.MESSAGING,
        person: {
          name: chatName,
        },
        messages: messages,
        group: isGroup,
        title: chatName,
      },
      // Open the app when the notification is pressed
      pressAction: {
        id: 'default',
      },
      groupId: chatId,
      groupSummary: false,
      groupAlertBehavior: AndroidGroupAlertBehavior.ALL,
      color: AndroidColor.PURPLE,
    },
  };

  // Replace the existing notification for this chat with a new one that includes
  // the latest message
  if (notificationIdToReplace) {
    await notifee.cancelDisplayedNotification(notificationIdToReplace);
  }
  await notifee.displayNotification(notification);
}

/**
 * Default notification for when any operation during handling notifications fails.
 */
export async function showDefaultNotification() {
  /*
   * Guard to remove client-generated notifications on iOS until
   * we receive NSE Entitlement
   */
  if (Platform.OS === 'ios') {
    return;
  }
  const channelId = await setupNotifee();
  const notification: Notification = {
    title: 'You may have new messages',
    body: 'Open the app to see if you have new connections or messages',
    android: {
      channelId,
      visibility: AndroidVisibility.SECRET,
      // Open the app when the notification is pressed
      pressAction: {
        id: 'default',
      },
    },
  };
  await notifee.displayNotification(notification);
}

/**
 * Sets up notifee initially.
 * @returns {Promise<string>} which has the channelID (for Android)
 */
const setupNotifee = async (): Promise<string> => {
  // Needed for iOS
  if (Platform.OS === 'ios') {
    await notifee.requestPermission();
  }
  // Needed for Android
  return await notifee.createChannel({
    id: 'default',
    name: 'Messaging Notifications',
  });
};

export async function cancelAllNotifications() {
  // Clear all notifications
  await notifee.cancelAllNotifications();
}

/**
 * Reset the app badge on iOS devices
 * For related functionality see the portnse notification service
 * extension
 */
export async function resetAppBadge() {
  if (!isIOS) {
    return;
  }
  await notifee.setBadgeCount(0);
  Settings.set({count: 1});
}

interface chatWithType {
  id: string;
  type: 'line' | 'group';
}

/**
 * Set the notification permission for multiple chats on the back end
 * @param on Should notifications be set to on or off
 * @param chats the chats to update
 */
export async function setRemoteNotificationPermissionsForChats(
  on: boolean,
  chats: chatWithType[],
) {
  const token = await getToken();
  await axios.patch(
    PERMISSION_MANAGEMENT_URL,
    {
      notifications: on,
      // TODO Group logic needs to be shimmed when implemented
      chats,
    },
    {headers: {Authorization: `${token}`}},
  );
}

/**
 * Set the notification permission for a direct chat.
 * @param chatId - direct chat to set the permission for.
 * @param notificationState - whether the permission is enabled.
 */
export async function setRemoteNotificationPermissionForDirectChat(
  lineId: string,
  notificationState: boolean,
  fallbackState?: boolean,
) {
  const lineData = await getLineData(lineId);
  try {
    if (lineData) {
      await setRemoteNotificationPermissionsForChats(notificationState, [
        {id: lineId, type: 'line'},
      ]);
      await updatePermissions(lineData.permissionsId, {
        notifications: notificationState,
      });
    }
  } catch (error) {
    console.log(
      'Error setting remote notification permission for direct chat: ',
      error,
    );
    console.log(
      'updating permissions to fallback state for direct chat based on this failure',
    );
    if (lineData?.permissionsId && fallbackState !== undefined) {
      await updatePermissions(lineData.permissionsId, {
        notifications: fallbackState,
      });
    }
  }
}
