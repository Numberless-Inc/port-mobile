//these imports have the potential to create dependency cycles. Please try not to import anything into this file.
import {FolderInfo} from '@utils/Storage/DBCalls/folders';
import {PermissionsStrict} from '@utils/Storage/DBCalls/permissions/interfaces';
import {FileAttributes} from '@utils/Storage/StorageRNFS/interfaces';

export const ORG_NAME = 'numberless.tech';
export const APP_GROUP_IDENTIFIER = 'group.tech.numberless.port';
export const NAME_LENGTH_LIMIT = 30;
export const MIN_NAME_LENGTH = 1;
export const PAGINATION_LIMIT = 60;
export const ARTIFICIAL_LOADER_INTERVAL = 300;
export const TOKEN_EXPIRY_TIME_BUFFER = 10 * 60 * 1000;
export const IDEAL_UNUSED_PORTS_NUMBER = 5;
export const DEFAULT_NAME = 'New contact';
export const DEFAULT_GROUP_NAME = 'New group';
export const DEFAULT_GROUP_MEMBER_NAME = 'Unknown member';
export const GROUP_MEMBER_LIMIT = 64;
export const APP_VERSION = '1.0';
export const SLK_EXPIRY_TIME_BUFFER = 1 * 60 * 60 * 1000; // 1 hour
//                            hours * minutes * seconds * 1000

//versions
export const CURRENT_PORT_VERSION = '1.0.0';
export const CURRENT_SUPERPORT_VERSION = '1.0.0';
export const CURRENT_GROUPPORT_VERSION = '1.0.0';
export const CURRENT_CONTACTPORT_VERSION = '1.0.0';

export const RETRY_INTERVAL = 2 * 60 * 60 * 1000; //2 hours

export const BUNDLE_VALIDITY_INTERVAL = 24 * 60 * 60 * 1000;
export const ERROR_MODAL_VALIDITY_TIMEOUT = 3000;
export const SELECTED_MESSAGES_LIMIT = 20;
export const START_OF_TIME = '2023-11-30T09:47:11Z';
export const MESSAGE_DATA_MAX_LENGTH = 2048;
export const SIDE_DRAWER_WIDTH = 300;
export const DRAWER_SWIPE_EDGE_WIDTH = 100;
//UI Definitions for elements
export const TOPBAR_HEIGHT = 68;
export const BOTTOMBAR_HEIGHT = 64;
export const BOTTOMBAR_ICON_SIZE = 24;
export const AVATAR_ARRAY = [
  'avatar://1',
  'avatar://2',
  'avatar://3',
  'avatar://4',
  'avatar://5',
  'avatar://6',
  'avatar://7',
  'avatar://8',
  'avatar://9',
  'avatar://10',
  'avatar://11',
  'avatar://12',
  'avatar://13',
  'avatar://14',
  'avatar://15',
];
export const DEFAULT_AVATAR = AVATAR_ARRAY[0];
export const DEFAULT_PROFILE_AVATAR_INFO: FileAttributes = {
  fileUri: 'avatar://1',
  fileName: '1',
  fileType: 'avatar',
};

export const DEFAULT_GROUP_PROFILE_AVATAR_INFO: FileAttributes = {
  fileUri: 'avatar://52',
  fileName: '52',
  fileType: 'avatar',
};
export const MAX_PERMISSION_PRESETS = 5;
export const SHARED_FILE_SIZE_LIMIT_IN_BYTES = 256 * 1024 * 1024; //256MB limit
export const FILE_ENCRYPTION_KEY_LENGTH = 160;

export const RECENT_CREATED_SUPERPORT_TIME_LIMIT = 15 * 60 * 1000; //time limit in miliseconds (15 minutes)

//CryptoIDs used for identifying reactors in reactions.
export const REACTION_SENDER_ID = '01';
export const REACTION_RECEIVER_ID = '02';

//default permissions used to initialise default folder
export const defaultPermissions: PermissionsStrict = {
  notifications: true,
  focus: true,
  autoDownload: false,
  displayPicture: true,
  contactSharing: true,
  readReceipts: true,
  disappearingMessages: 0,
  favourite: true,
  calling: true,
};

export const defaultPermissionsId: string = '00000000000000000000000000000000';
export const defaultFolderId: string = '00000000000000000000000000000000';
export const defaultFolderInfo: FolderInfo = {
  folderId: defaultFolderId,
  name: 'Default',
  permissionsId: defaultPermissionsId,
};

export const defaultSuperportConnectionsLimit: number = 50;

export const safeModalCloseDuration: number = 500;
//images and videos get compressed if higher than threshold.(currently 6MB)
export const FILE_COMPRESSION_THRESHOLD: number = 6 * 1024 * 1024;
export const PREVIEW_PICTURE_DIMENSIONS = 200;

export const MAX_CALL_ANSWER_WINDOW_SECONDS = 60;


