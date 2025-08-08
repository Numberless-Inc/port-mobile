import NativeEncryptedStorage from "@specs/NativeEncryptedStorage";


/**
 * HAZMAT SUITS ON. This clears secure storage, including the user's id, keys, and tokens
 */
export function clearRNSS() {
  NativeEncryptedStorage.clear();
}
