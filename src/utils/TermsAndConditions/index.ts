import AsyncStorage from '@react-native-async-storage/async-storage';

import store from '@store/appStore';

import {getProfileInfo} from '@utils/Profile';
import {ProfileInfo} from '@utils/Storage/RNSecure/secureProfileHandler';

import {TermsAndConditionParams, getTermsAndConditions, sendUpdatedAcceptance} from './APICalls';

/**
 * Checks for updates to the terms and conditions
 */
export async function checkForUpdates() {
  const profile: ProfileInfo | undefined = await getProfileInfo();
  // If a profile is not found, we can't check for updates
  if (!profile) {
    return;
  }
  //check local storage for terms and conditions status.
  //If needsToAccept is true, then we don't need to make an api call.
  //If needsToAccept is false, then we need to make an api call 
  //to check if the user needs to accept the terms and conditions.
  let localResponse = await getUpdateStatusKeyFromLocal();
  if (!(localResponse && localResponse.needsToAccept)) {
    const response = await getTermsAndConditions();
    if (response !== null) {
      // if hardNotif and softNotif both are true then we will only show hardNotif modal
      await saveUpdateStatusToLocal(response);
      localResponse = response;
    } else {
      console.error('Failed to fetch Terms and Conditions');
    }
  }
  // If the user needs to accept the terms and conditions, or the user should be notified, 
  // then we need to trigger that event.
  if (localResponse && (localResponse.needsToAccept || localResponse.shouldNotify)) {
    store.dispatch({
      type: 'TRIGGER_TERMS_REFETCH',
    });
  }
}

/**
 * Saves the terms and conditions status to local storage
 * @param value - The terms and conditions status to save
 */
export async function saveUpdateStatusToLocal(value: TermsAndConditionParams) {
  try {
    await AsyncStorage.setItem('TnCUpdateStatus', JSON.stringify(value));
  } catch (error) {
    console.log('saveUpdateStatusToLocal error', error);
  }
}

/**
 * Gets the terms and conditions status from local storage
 * @returns The terms and conditions status from local storage
 */
export async function getUpdateStatusKeyFromLocal() {
  try {
    const itemString = await AsyncStorage.getItem('TnCUpdateStatus');
    if (itemString) {
      return JSON.parse(itemString);
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Accepts the terms and conditions
 */
export async function acceptTerms() {
    await sendUpdatedAcceptance();
    await saveUpdateStatusToLocal({ needsToAccept: false, shouldNotify: false });
}