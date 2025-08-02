import {
  SLK_EXPIRY_TIME_BUFFER,
  TOKEN_EXPIRY_TIME_BUFFER,
} from '@configs/constants';

import {generateKeys,signMessage} from '@utils/Crypto/ed25519';
import {
  SavedServerAuthToken,
  ServerAuthToken,
} from '@utils/Storage/RNSecure/secureTokenHandler';
import {
  ShortLivedKey,
  ShortLivedKeyExpiryWithTokenExpiry,
} from '@utils/Storage/RNSecure/ShortLivedKeyHandler';

import {getProfileInfo} from '../Profile';
import {readAuthToken, saveAuthToken} from '../Storage/authToken';
import {readShortLivedKey, saveShortLivedKey} from '../Storage/shortLivedKey';
import {connectionFsSync} from '../Synchronization';

import * as API from './APICalls';


// global object to cache auth token so that it doesn't have to be repeatedly read from storage.
let cachedToken: SavedServerAuthToken | undefined;

/**
 * Checks if a server auth token is still valid.
 * @param timestamp - timestamp of when the token was created
 * @param expiryTimeBuffer - how long the server auth token is valid
 * @returns true if token is still valid
 */
function checkAuthTokenTimeout(
  timestamp: string | null | undefined,
  expiryTimeBuffer: number = TOKEN_EXPIRY_TIME_BUFFER,
): boolean {
  if (!timestamp) {
    console.log('NoTimestampToCheckTimeout: return expired');
    return false;
  }
  const now = Date.now() + expiryTimeBuffer;
  if (now > Date.parse(timestamp)) {
    return false;
  }
  return true;
}

/**
 * Generates new auth token by posting solved authentication challenge.
 * @throws {Error} - If there is an issue fetching new token
 * @returns {ServerAuthToken} - valid token issued by server
 */
async function generateAndSaveNewAuthToken(): Promise<ServerAuthToken | undefined> {
  // read from in memory obj
  let profile;
  try {
    profile = await getProfileInfo();
    if (!profile) {
      throw new Error('NoProfileWhileGetToken');
    }
  } catch (error) {
    return undefined
  }
  const challenge = await API.getNewAuthChallenge(profile.clientId);
  const savedSLK = await readShortLivedKey();
  if (
    savedSLK &&
    checkAuthTokenTimeout(savedSLK.timestamp, SLK_EXPIRY_TIME_BUFFER)
  ) {
    //return fresh JWT
    try {
      const encChallenge: string = signMessage(challenge, savedSLK.privateKey);
      cachedToken = await API.postSolvedAuthChallenge(profile.clientId, {
        signedChallenge: encChallenge,
      });
      await saveAuthToken(cachedToken);
      return cachedToken.token;
    } catch (error) {
      console.log('Error while trying to retrieve JWT', error);
    }
  } else {
    //try generating a new ShortLivedKey
    try {
      const shortLivedKeys = await generateKeys();
      const encChallenge: string = signMessage(
        challenge,
        profile.privateKey,
      );

      const response: ShortLivedKeyExpiryWithTokenExpiry =
        await API.postSolvedAuthChallengeWithShortLivedKey(profile.clientId, {
          signedChallenge: encChallenge,
          shortLivedKey: shortLivedKeys.publicKey,
        });

      const newSLK: ShortLivedKey = {
        timestamp: response.slk_timestamp,
        privateKey: shortLivedKeys.privateKey,
      };

      cachedToken = {
        timestamp: response.token_timestamp,
        token: response.token,
      };

      await saveShortLivedKey(newSLK);
      await saveAuthToken(cachedToken);
      return cachedToken.token;
    } catch (error) {
      console.log(
        'Error while trying to perform short lived key mechanism ',
        error,
      );
    }
  }
}


/**
 * Returns a valid token
 * @throws {Error} If there is an issue getting a valid token.
 * @returns {ServerAuthToken} - valid token
 */
export async function getToken(): Promise<ServerAuthToken> {
  const synced = async () => {
    //case1 : no token in cache
    if (!cachedToken || !cachedToken.timestamp || !cachedToken.token) {
      try {
        //try loading token from file
        const savedToken = await readAuthToken();
        if (!savedToken) {
          throw new Error('NoTokenInFile');
        }
        if (
          checkAuthTokenTimeout(savedToken.timestamp, TOKEN_EXPIRY_TIME_BUFFER)
        ) {
          //returns token and updates cache if token is found in file and is still valid.
          cachedToken = savedToken;
          return savedToken.token;
        } else {
          //throw an error is token is not valid
          throw new Error('TokenExpired');
        }
      } catch (error) {
        //if token is not valid or if there is no token found in file:
        //try generating a new token
        const token = await generateAndSaveNewAuthToken();
        if (!token) {
          throw new Error('failed in generateAndSaveNewAuthToken (most likely fresh install/no profile)');
        }
        return token;
      }
    } else {
      //case2 : token found in store
      //check validity
      if (
        checkAuthTokenTimeout(cachedToken.timestamp, TOKEN_EXPIRY_TIME_BUFFER)
      ) {
        //return the token
        return cachedToken.token;
      } else {
        //try generating a new token
        const token = await generateAndSaveNewAuthToken();
        if (!token) {
          throw new Error('failed in generateAndSaveNewAuthToken');
        }
        return token;
      }
    }
  };
  return await connectionFsSync(synced);
}

export async function clearTokenCache() {
  cachedToken = undefined;
}