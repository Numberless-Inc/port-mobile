import NativeMediaUploadModule from '@utils/Messaging/LargeData/NativeUploader';
import {getToken} from '@utils/ServerAuth';
import {
  addFilePrefix,
  deleteFile,
  encryptFile,
  getSafeAbsoluteURI,
} from '@utils/Storage/StorageRNFS/sharedFileHandlers';

import * as API from './APICalls';

/**
 * Class responsible for uploading large files to a pre-signed url.
 */
class LargeDataUpload {
  private fileUri: string; //can be relative or absolute Uri
  private fileName: string;
  private fileType: string | null;
  private key: string | null;
  private mediaId: string | null;
  private encryptedTempFilePath: string | null;
  constructor(
    fileUri: string,
    fileName: string,
    fileType: string | null = null,
    key: string | null = null,
    mediaId: string | null = null,
    encryptedTempFilePath: string | null = null,
  ) {
    //we need to convert relative URIs to absolute URIs with the 'file://' prefix added.
    this.fileUri = getSafeAbsoluteURI(fileUri);
    this.fileName = fileName;
    this.fileType = fileType;
    this.key = key;
    this.mediaId = mediaId;
    this.encryptedTempFilePath = encryptedTempFilePath;
  }

  //fetch pre-signed url and upload large data file to it.
  async upload() {
    try {
      //create encrypted temp file with associated decryption key
      await this.createEncryptedTempFile();
      //upload large data to s3 bucket
      await this.s3Upload();
    } catch (error) {
      await this.cleanUpEncryptedTempFile();
      console.log('Error uploading large data: ', error);
    }
  }

  /**
   * Upload to group's large data bucket
   * @param groupId
   */
  async uploadGroupData(groupId: string) {
    try {
      //create encrypted temp file with associated decryption key
      await this.createEncryptedTempFile();
      //upload large data to s3 bucket
      await this.groupS3Upload(groupId);
    } catch (error) {
      await this.cleanUpEncryptedTempFile();
      console.log('Error uploading large data: ', error);
    }
  }

  //get upload media Id and key
  getMediaIdAndKey() {
    return {mediaId: this.mediaId, key: this.key};
  }

  /**
   * Gets the key used to encrypt large file.
   * @returns - key used for encryption
   */
  public getKeyNotNull() {
    if (!this.key) {
      throw new Error('KeyIsNull');
    }
    return this.key;
  }

  private async createEncryptedTempFile() {
    const encryptedFileParams = await encryptFile(this.fileUri);
    this.encryptedTempFilePath = addFilePrefix(
      encryptedFileParams.encryptedFilePath,
    );
    this.key = encryptedFileParams.key;
  }

  private checkEncryptedTempFileNotNull() {
    if (!this.encryptedTempFilePath) {
      throw new Error('EncryptedTempFilePathNull');
    }
    return this.encryptedTempFilePath;
  }

  private async cleanUpEncryptedTempFile() {
    if (this.encryptedTempFilePath) {
      await deleteFile(this.encryptedTempFilePath);
      this.encryptedTempFilePath = null;
    }
  }

  private async s3Upload() {
    this.encryptedTempFilePath = this.checkEncryptedTempFileNotNull();
    this.mediaId = await NativeMediaUploadModule.uploadFile(
      // This is one of the few instances where we need to remove the 'file://' prefix
      this.encryptedTempFilePath.replace('file://', ''),
      await getToken(),
      5 * 1024 * 1024,
    );
    await this.cleanUpEncryptedTempFile();
  }

  private async groupS3Upload(groupId: string) {
    this.encryptedTempFilePath = this.checkEncryptedTempFileNotNull();
    const response = await API.getUploadPresignedUrlFromGroupPictureResource(
      groupId,
    );
    const uploadParams = response.uploadParams;
    const mediaId = response.mediaId;
    const url: string | null = uploadParams.url ? uploadParams.url : null;
    const fields: object | null = uploadParams.fields
      ? uploadParams.fields
      : null;
    if (!url || !fields) {
      throw new Error('ImproperUploadParams');
    }
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    await API.s3Upload(
      this.encryptedTempFilePath,
      formData,
      url,
      this.fileName,
    );
    if (mediaId) {
      this.mediaId = mediaId;
    }
    await this.cleanUpEncryptedTempFile();
  }
}

export default LargeDataUpload;
