/**
 * This file exposes a helper to delete a user's account.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import {INITIAL_POST_MANAGEMENT_RESOURCE} from '@configs/api';

import {getToken} from '@utils/ServerAuth';
import { deleteDatabase } from '@utils/Storage/DBCalls/dbCommon';
import {clearRNSS} from '@utils/Storage/RNSecure/clearRNSS';
import clearAllFiles from '@utils/Storage/StorageRNFS/clearStorage';


/**
 * Permanently delete a user's account.
 * Make a request to the backend to delete an account.
 * Delete media locally.
 * Clear the sqlite database.
 * Clear async storage.
 * Clear secure storage.
 */
export default async function permanentlyDeleteAccount() {
  console.warn('[ACCOUNT DELETION] initiated');

  // Make the API call to delete the account.
  await requestDeletion();

  // From here on out, everything is best effort as we have met our legal and ethical
  // obligation of clearing anything that is sketchy from our servers.
  // If the client ends up in a weird state,
  // they can always delete and re-install the app.

  // Upon success, delete the entire local filesystem.
  try {
    await clearAllFiles();
  } catch (e) {
    console.error('[ACCOUNT DELETION] Could not delete local media', e);
  }
  // Depending on the OS, we may have already cleared some of the following things.
  // For example, the database is already gone on iOS since we clear the app security
  // group's directory.

  // Clear data in async storage.
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error('[ACCOUNT DELETION] Could not clear async storage', e);
  }
  // Clear RNSS
  try {
    clearRNSS();
  } catch (e) {
    console.error('[ACCOUNT DELETION] Could not clear RNSS', e);
  }

  // Re-instate the database in an empty state
  try {
    console.warn('Final step');
    await deleteDatabase();
  } catch (e) {
    console.error('[ACCOUNT DELETION] Could not reset the database', e);
  }
}

async function requestDeletion() {
  const token = await getToken();
  await axios.delete(INITIAL_POST_MANAGEMENT_RESOURCE, {
    headers: {Authorization: `${token}`},
  });
}
