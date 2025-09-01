/**
 * Paths to profile info
 * @param profileDir - path to directory where profile information is stored
 * @param profilePicAttributesPath - path to where attributes associated with profile picture are stored.
 */
export const profileDir = '/profile';
export const profilePicAttributesPath = '/profilePictureAttributes.json';

/**
 * Paths to connections info
 * @param connectionsPath - path to where the info is stored about all the connections
 */
export const connectionsPath = '/connections.json';

/**
 * Paths to connection links
 * @param linksDir - path to directory where connections links are stored
 * @param lineLinkspath - path to where the line connections links are stored.
 */
export const connnectionLinksDir = '/links';
export const connectionLinksPath = '/direct.json';

/**
 * Paths to token
 * @param tokenPath - path to where the token is stored.
 */
export const tokenPath = '/token.json';

/**
 * Paths to generated bundles
 * @param bundlesDir - path to where the read and generated bundles get stored
 * @param generatedBundlesPath - path to where the generated bundles get stored
 */
export const bundlesDir = '/bundles';
export const generatedBundlesPath = '/generatedBundles.json';
export const generatedSuperportsPath = '/generatedSuperports.json';
export const bundleMapPath = '/bundleMap.json';

/**
 * Paths to read bundles
 * @param readBundlesPath - path to where the read bundles get stored
 */
export const readBundlesPath = '/readBundles.json';

/**
 * @param conversationsDir - path where the actual conversation sub-folders and journal is stored
 */
export const conversationsDir = '/conversations';

/**
 * Paths to journaled messages
 * @param messageJournalDir - path to directory where the journaled messages are stored (this directory is inside conversations directory)
 * @param messageJournalPath - path to where the journaled messages are stored
 */
export const messageJournalDir = '/journal';
export const messageJournalPath = '/journaled.txt';

/**
 * Paths to messages and media
 * @param messagesDir - path to directory where the messages are stored (this directory is inside conversations directory within the respective lineId directory)
 * @param mediaDir - path to directory where the media are stored (this directory is inside conversations directory within the respective lineId directory)
 * @param filesDir - path to directory where the files are stored (this directory is inside conversations directory within the respective lineId directory)
 * @param groupsDir - path to directory where group data is stored (this directory is inside conversations directory within the respective groupId directory)
 */
export const messagesDir = '/messages';
export const mediaDir = '/media';
export const filesDir = '/files';
export const groupsInfoDirPath = '/info';
export const groupsDataPath = '/data.json';
export const groupDisplayPicAttributesPath = '/displayPictureAttributes.json';
export const groupConnectionLinksPath = '/groupLinks.json';

//path to temporary dir
export const tempDir = '/temp';

/**
 * Path to crypto info
 * @param cryptoDir - path to directory where cryptographic information of chats is stored.
 */
export const cryptoDir = '/crypto';

/**
 * Key to user profile storage
 */
export const sessionKey = 'PORT_USER_SESSION_KEY';
export const tokenKey = 'PORT_TOKEN_KEY';

// Key to store Short Lived Key
export const SLKey = 'SLK_PRI';
