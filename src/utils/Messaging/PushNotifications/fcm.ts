import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from '@react-native-firebase/app';
import { getMessaging } from '@react-native-firebase/messaging';

import { isIOS } from '@components/ComponentUtils';

import { showDefaultNotification } from '@utils/Notifications';

import pullBacklog from '../pullBacklog';
import ReceiveMessage from '../Receive/ReceiveMessage';
import * as API from './APICalls';

export type FCMToken = string;

const FCM_KEY = 'fcmToken';

// Firebase messaging instance
const firebaseApp = getApp();
const messagingInstance = getMessaging(firebaseApp);

// const messagingInstance = getMessaging(getApp());

export const getFCMToken = async () => {
  const token = await messagingInstance.getToken();
  return token;
};

export const getAPNSToken = async () => {
  if (!isIOS) {
    throw new Error('not an iOS device');
  }
  const token = await messagingInstance.getAPNSToken();
  return token;
};

/**
 * Background FCM handler.
 * Payload is ignored, as pullBacklog is used to make an API call to fetch relevant messages
 */
export const registerBackgroundMessaging = (): void => {
  messagingInstance.setBackgroundMessageHandler(async ({ data }) => {
    console.log('[NEW BACKGROUND MESSAGE]');
    // In the background, we don't have very much time, and a ramp up over
    // websockets may not be possble. As such, just process the received message
    const receiver = new ReceiveMessage(data!.trigger);
    await receiver.receive();
  });
};

/**
 * Foreground FCM handler, does the same as background.
 */
export const foregroundMessageHandler = () => {
  messagingInstance.onMessage(async _ => {
    console.log('[NEW FOREGROUND MESSAGE] ');
    // In the foreground, we have a lor more resources to work with, and can
    // use pullBacklog to use a websocket over the network to fetch messages
    await pullBacklog().catch((e: any) => {
      console.log('Error in background message handler: ', e);
      showDefaultNotification();
    });
  });
};

/**
 * When we we successfully update an FCM token, we save a copy of it locally.
 * We call initialise FCM often, but it only submits the new token to the backend if
 * there is a change.
 * We increased our frequency of initialising FCM because if you migrate to a new device
 * using OS tools that ship with Android and iOS, we end up not detecting that we're on a new device
 * and as such never attempt to update the new FCM registration token on the server.
 */

/**
 * Reads FCM info from AsyncStorage
 * @returns {FCMToken|undefined} - FCM info read from AsyncStorage. Returns undefined if the storage doesn't exist
 */
async function readCachedFCMToken(): Promise<FCMToken | undefined> {
  try {
    const FCMToken: any = await AsyncStorage.getItem(FCM_KEY);
    return FCMToken;
  } catch (error) {
    console.log('Error reading token from AsyncStorage: ', error);
    return undefined;
  }
}

/**
 * Writes FCMToken in AsyncStorage with new info
 * @param {FCMToken} FCMToken - the token information to overwrite with
 */
async function cacheFCMToken(FCMToken: FCMToken): Promise<void> {
  await AsyncStorage.setItem(FCM_KEY, FCMToken);
}

/**
 * Checks if FCMToken is present in AsyncStorage and compares with FCM token from messaging servers
 *  If localFCMToken is different, overwrite and patch on server
 */
export async function initialiseFCM(): Promise<boolean> {
  const currentFCMToken = await getFCMToken();
  const cachedFCMToken = await readCachedFCMToken();
  try {
    if (cachedFCMToken !== currentFCMToken) {
      await API.patchFCMToken(currentFCMToken);
      // await API.patchToken('fcmtoken', currentFCMToken);
      await cacheFCMToken(currentFCMToken);
    }
    return true;
  } catch {
    return false;
  }
}
