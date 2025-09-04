import {NativeModules} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {saveDocuments} from '@react-native-documents/picker';
import {
  CloudStorage,
  CloudStorageProvider,
  CloudStorageScope,
} from 'react-native-cloud-storage';
import RNFS from 'react-native-fs';

import {isIOS} from '@components/ComponentUtils';

import store from '@store/appStore';

import {generateRandomHexId} from '@utils/IdGenerator';
import {getProfileInfo} from '@utils/Profile';
import {
  deleteDatabase,
  snapshotDatabase,
} from '@utils/Storage/DBCalls/dbCommon';
import {saveProfileInfo} from '@utils/Storage/profile';
import {ProfileInfo} from '@utils/Storage/RNSecure/secureProfileHandler';
import {
  getFileNameFromUri,
  getSafeAbsoluteURI,
} from '@utils/Storage/StorageRNFS/sharedFileHandlers';
import {wait} from '@utils/Time';
import {DEFAULT_BACKUP_INTERVAL, BackupIntervalString} from '@utils/Time/interfaces';

import NativeCryptoModule from '@specs/NativeCryptoModule';
const {GoogleSignInModule} = NativeModules;

/**
 * Creates a backup file and places it in the cache directory
 * @param password used to secure the backup
 * @returns a path to the backup
 */
async function createBackup(password: string): Promise<string> {
  /**
   * Creating a backup uses 3 things,
   * 1. account metadata: to register the user
   * 2. a database snapshot: complete with tracked migrations
   * 3. an alphanumeric password: to protect the backup
   * Taking these 3 items, we createa an output file that contains
   * encrypted versions of the metadata and the acount information.
   * We additionallly store a salt and IVs, but those are managed natively.
   */
  const backupDest =
    RNFS.CachesDirectoryPath + `/${generateRandomHexId()}-port-account.bak`;
  await RNFS.write(backupDest, '');
  const databaseSnapshot = await snapshotDatabase();
  const metadata = JSON.stringify(await getProfileInfo());
  await NativeCryptoModule.pbEncrypt(
    password,
    metadata,
    databaseSnapshot,
    backupDest,
  );

  // Remove the snapshot from the cached directory
  await RNFS.unlink(databaseSnapshot);

  return backupDest;
}

/**
 * Fetches Google Drive access credentials on Android.
 * This function interfaces with the native GoogleSignInModule.
 * @returns A promise that resolves with the access token string.
 * @throws An error if not running on Android, the native module is not found, or the sign-in fails.
 */
async function getGoogleDriveCredentials(): Promise<string | null> {
  if (isIOS) {
    console.log('Google Drive sign-in skipped on iOS.');
    return null;
  }

  if (!GoogleSignInModule) {
    throw new Error('Native module GoogleSignInModule not found.');
  }

  try {
    const accessToken: string = await GoogleSignInModule.signIn();
    return accessToken;
  } catch (error) {
    throw new Error('Failed to get Google Drive credentials.');
  }
}

/**
 * Initializes the Cloud Storage module on Android using Google Drive credentials.
 * @throws An error if initialization fails.
 */
async function _initializeCloudStorageAndroid(): Promise<void> {
  const accessToken = await getGoogleDriveCredentials();

  if (!accessToken) {
    // On Android, if it's null, it means signIn failed.
    throw new Error('Failed to get Google Drive access token');
  }

  // Set the provider options for Google Drive with the obtained access token.
  CloudStorage.setProvider(CloudStorageProvider.GoogleDrive);
  CloudStorage.setProviderOptions({
    accessToken,
    scope: CloudStorageScope.AppData,
    timeout: 30000,
  });
}

/**
 * Initializes the Cloud Storage module on iOS using iCloud.
 */
async function _initializeCloudStorageIOS(): Promise<void> {
  CloudStorage.setProvider(CloudStorageProvider.ICloud);
  // No specific options needed for iCloud AppData scope typically
}

/**
 * Initializes the Cloud Storage module based on the current platform.
 * @throws An error if initialization fails.
 */
async function initializeCloudStorage(): Promise<void> {
  if (isIOS) {
    await _initializeCloudStorageIOS();
  } else {
    await _initializeCloudStorageAndroid();
  }
}

/**
 * Uploads a backup file to the configured cloud storage provider (AppData scope).
 * Initializes cloud storage before uploading.
 *
 * @param backupFilePath The local path to the backup file to upload.
 * @throws An error if initialization or upload fails.
 */
async function uploadBackupToCloud(backupFilePath: string): Promise<void> {
  // Check if the backup file exists before proceeding
  const fileExists = await RNFS.exists(backupFilePath);
  if (!fileExists) {
    throw new Error(`Backup file not found at path: ${backupFilePath}`);
  }

  await initializeCloudStorage();

  const filename = backupFilePath.split('/').pop();
  if (!filename) {
    throw new Error('Invalid backup file path provided.');
  }

  // Read the file content as a base64 string
  const fileContentBase64 = await RNFS.readFile(backupFilePath, 'base64');

  // Pass the base64 encoded file content to writeFile
  await CloudStorage.writeFile(
    filename, // Using filename directly without leading slash
    fileContentBase64,
    CloudStorageScope.AppData,
  );
  // Delete any file that isn't the one we just uploaded
  const files = await CloudStorage.readdir('/', CloudStorageScope.AppData);
  for (const file of files) {
    if (file !== filename && file.endsWith('bak')) {
      await CloudStorage.unlink(file, CloudStorageScope.AppData);
    }
  }
}

/**
 * Creates a backup and uploads it to the configured cloud storage.
 * @param password Password to encrypt the backup with.
 * @throws An error if backup creation or upload fails.
 */
export async function createAndUploadBackup(password: string): Promise<void> {
  const backupFilePath = await createBackup(password);
  try {
    await uploadBackupToCloud(backupFilePath);
  } finally {
    // Ensure the local backup file is deleted even if upload fails
    await RNFS.unlink(backupFilePath).catch(console.error);
  }
}

/**
 * Creates a backup and saves it to the device.
 * @param password Password to encrypt the backup with.
 * @throws An error if backup creation or saving fails.
 */
export async function createAndSaveBackup(password: string): Promise<void> {
  const backupFilePath = await createBackup(password);
  console.log('Backup file path:', backupFilePath);
  try {
    const [{uri: targetUri}] = await saveDocuments({
      sourceUris: [getSafeAbsoluteURI(backupFilePath)],
      mimeType: 'application/octet-stream',
      fileName: getFileNameFromUri(backupFilePath),
      copy: true,
    });
    console.log('User saved file at:', targetUri);
  } catch (error) {
    console.error('Error saving backup:', error);
    // Optionally re-throw or handle specific share errors
    // throw error;
  } finally {
    // Ensure the local backup file is deleted after sharing attempt
    // Note: Some share targets might copy the file, others might move it.
    // Deleting it here ensures cleanup, but consider implications if the share
    // target expects the file to remain (less common for 'share' action).
    await RNFS.unlink(backupFilePath).catch(console.error);
  }
}

/**
 * Helper to attempt downloading the backup file from a specific directory in the cloud backup data
 * @param directory the directory to search in the AppData sector
 * @returns path to the downloaded file, if found
 */
async function downloadBackupFromCloudDir(
  directory: string,
): Promise<string | null> {
  // List files in the AppData scope
  let filenames = await CloudStorage.readdir(
    `/${directory}`,
    CloudStorageScope.AppData,
  );

  // Find the first file that matches the backup naming convention
  // TODO: Implement a strategy for multiple backups (e.g., latest) if needed.
  console.log('Filenames in AppData scope:', filenames);
  // Check if there is a backup file that hasn't yet been downloaded to this device. Only really applicable for iOS.
  const unsyncedBackupFile = filenames.find(name =>
    name.endsWith('-port-account.bak.icloud'),
  );
  if (unsyncedBackupFile) {
    console.log('Found unsynced backup file:', unsyncedBackupFile);
    await CloudStorage.downloadFile(
      unsyncedBackupFile,
      CloudStorageScope.AppData,
    );
    // wait for up to 25 seconds for the download to complete
    let i = 0;
    for (i = 0; i < 25; i++) {
      // Loop until we timeout or the file is downloaded
      filenames = await CloudStorage.readdir('/', CloudStorageScope.AppData);
      if (!filenames.includes(unsyncedBackupFile)) {
        break;
      }
      await wait(1000); // Sleep for a second
    }
  }
  const backupFilename = filenames.find(name =>
    name.endsWith('-port-account.bak'),
  );

  if (!backupFilename) {
    return null;
  }

  // Use the found filename, ensuring it includes the leading '/' for readFile if needed
  // According to docs, readFile path should be like '/some/file.txt'
  const cloudPath = `/${backupFilename}`;

  // Read the file content (returns base64 string)
  const fileContentBase64 = await CloudStorage.readFile(
    cloudPath,
    CloudStorageScope.AppData,
  );

  // Define a local path to save the downloaded backup
  const localBackupPath = RNFS.CachesDirectoryPath + `/${backupFilename}`;

  // Write the base64 decoded content to the local file
  await RNFS.writeFile(localBackupPath, fileContentBase64, 'base64');

  console.log(`Backup file downloaded successfully to: ${localBackupPath}`);
  return localBackupPath;
}

// On iOS there appears to be some inconsistency in where the backup might be saved
const backupDirsToCheck = isIOS ? ['', 'Documents'] : [''];

/**
 * Downloads the latest backup file from the configured cloud storage provider (AppData scope).
 * Initializes cloud storage before downloading. Finds the first file matching the backup pattern.
 *
 * @returns The local path to the downloaded backup file.
 * @throws An error if initialization fails, no backup file is found, or download fails.
 */
export async function downloadBackupFromCloud(): Promise<string> {
  await initializeCloudStorage();
  let path: string | null;
  for (const dir of backupDirsToCheck) {
    try {
      path = await downloadBackupFromCloudDir(dir);
      if (path) {
        return path;
      }
    } catch (e) {
      console.error(`Downlaod for cloud dir ${dir} failed: `, e);
    }
  }
  throw new Error('No backup file found in cloud storage.');
}

/**
 * Replaces the current database file with the newly decrypted one.
 * Handles closing the connection, deleting old files, and moving the new file.
 * @param decryptedDbPath Path to the decrypted database file (in a temporary location).
 * @throws An error if any step fails critically.
 */
async function replaceDatabaseFile(decryptedDbPath: string): Promise<void> {
  console.log(`Attempting to replace database with file: ${decryptedDbPath}`);

  // 1. Delete the existing database and get the path it was at
  const targetDbPath = await deleteDatabase();
  // 2. Move the decrypted database file to the target location
  try {
    await RNFS.moveFile(decryptedDbPath, targetDbPath);
    console.log(`Successfully moved decrypted database to ${targetDbPath}`);
  } catch (error) {
    // Clean up source file on move failure
    await RNFS.unlink(decryptedDbPath).catch(err =>
      console.warn(
        `Failed to clean up source decrypted file after move error: ${decryptedDbPath}`,
        err,
      ),
    );
    throw new Error(`Failed to move decrypted database: ${error}`);
  }
}

/**
 * Restores profile info and database from a previously downloaded backup file located in the cache.
 * Cleans up the provided encrypted backup file and any temporary decryption files.
 *
 * @param encryptedBackupPath The path to the encrypted backup file in the cache.
 * @param password The password used to decrypt the backup.
 * @throws An error if decryption, restoration, or file replacement fails.
 */
export async function restoreBackupFromCache(
  encryptedBackupPath: string,
  password: string,
): Promise<void> {
  console.log('Restoring backup from:', encryptedBackupPath, password);

  let decryptedDbPath: string | null = null; // Track temporary decrypted path

  try {
    // Ensure the provided backup file exists
    const backupExists = await RNFS.exists(encryptedBackupPath);
    if (!backupExists) {
      throw new Error(
        `Encrypted backup file not found at specified path: ${encryptedBackupPath}`,
      );
    }

    // 1. Define temporary destination path for the decrypted database
    decryptedDbPath =
      RNFS.CachesDirectoryPath +
      `/${generateRandomHexId()}-decrypted-db.sqlite`;
    // Create empty file at destination path
    await RNFS.writeFile(decryptedDbPath, '');

    // 2. Decrypt the file and get metadata
    const metadataString = await NativeCryptoModule.pbDecrypt(
      password,
      encryptedBackupPath,
      decryptedDbPath, // Decrypt to temporary path
    );

    // 3. Restore profile info from metadata
    if (metadataString) {
      console.log('Restoring profile information...');
      const profileInfo = JSON.parse(metadataString) as ProfileInfo;
      await saveProfileInfo(profileInfo); // Reuse saveProfileInfo
      console.log('Profile information restored successfully.');
    } else {
      throw new Error(
        'Decryption failed to return metadata or backup metadata is missing.',
      );
    }

    // 4. Replace the current database with the decrypted one
    await replaceDatabaseFile(decryptedDbPath); // Use the helper function
  } catch (error) {
    console.error('Backup restoration from cache failed:', error);
    // Clean up temporary decrypted file if it exists and wasn't handled by replaceDatabaseFile
    if (decryptedDbPath) {
      await RNFS.unlink(decryptedDbPath).catch(err =>
        console.warn(
          `Failed to clean up temporary decrypted DB file after error: ${decryptedDbPath}`,
          err,
        ),
      );
    }
    // Re-throw the error
    throw new Error(`${error}`); // Keep original error context
  }
  console.log('Cleaning up encrypted backup file:', encryptedBackupPath);
  // Always clean up the downloaded *encrypted* backup file provided to this function
  if (await RNFS.exists(encryptedBackupPath)) {
    await RNFS.unlink(encryptedBackupPath).catch(err =>
      console.warn(
        `Failed to delete provided encrypted backup file: ${encryptedBackupPath}`,
        err,
      ),
    );
  }
}

/**
 * Sets the backup reminder interval in storage.
 * 
 * @param {BackupIntervalString} backupInterval - Backup interval to set
 */
export async function setBackupIntervalInStorage(backupInterval: BackupIntervalString) {
    store.dispatch({ type: 'UPDATE_REMINDER_INTERVAL', newInterval: backupInterval })
    await AsyncStorage.setItem('BackupReminderInterval', backupInterval);
}

/**
 * Gets the backup reminder interval in storage.
 * 
 * @returns {BackupIntervalString} The backup reminder interval
 */
export async function getBackupIntervalInStorage(): Promise<BackupIntervalString> {
  const value = await AsyncStorage.getItem('BackupReminderInterval');
  // Check value exists and is valid interval string, else fall back to default
  const interval: BackupIntervalString = (
    value && backupIntervalStrings.includes(value as BackupIntervalString)
      ? value
      : DEFAULT_BACKUP_INTERVAL
  ) as BackupIntervalString;

  store.dispatch({ type: 'UPDATE_REMINDER_INTERVAL', newInterval: interval });
  return interval;
}
