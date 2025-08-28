import {
  LARGE_FILE_PRESIGNED_URL_RESOURCE,
  MULTIPART_ABORT,
  MULTIPART_BEGIN,
  MULTIPART_COMPLETE,
} from '@configs/api';

import NativeMediaUploadModule from '@specs/NativeMediaUploadModule';


NativeMediaUploadModule.initialize(
  LARGE_FILE_PRESIGNED_URL_RESOURCE,
  MULTIPART_BEGIN,
  MULTIPART_COMPLETE,
  MULTIPART_ABORT,
);

export default NativeMediaUploadModule;
