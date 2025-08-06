import {TurboModule, TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  readonly reverseString: (input: string) => string;
  readonly hashSHA256: (input: string) => string;
  readonly randHex: (input: number) => string;
  readonly generateEd25519Keypair: () => string;
  readonly ed25519SignMessage: (message: string, key: string) => string;
  readonly generateX25519Keypair: () => string;
  readonly deriveX25519Secret: (
    privateKey: string,
    publicKey: string,
  ) => string;
  readonly aes256Encrypt: (plaintext: string, secret: string) => string;
  readonly aes256Decrypt: (ciphertext: string, secret: string) => string;
  readonly aes256FileEncrypt: (
    pathToInput: string,
    pathToOutput: string,
  ) => Promise<string>;
  readonly aes256FileDecrypt: (
    pathToInput: string,
    pathToOutput: string,
    keyAndIV: string,
  ) => Promise<void>;
  readonly pbEncrypt: (
    password: string,
    metadata: string,
    pathToDatabase: string,
    pathToDestination: string,
  ) => Promise<void>;
  readonly pbDecrypt: (
    password: string,
    pathToEncryptedFile: string,
    pathToDestination: string,
  ) => Promise<string>;
  readonly yapV1Encrypt: (
    sharedSecretHex: string,
    peerPublicKeyHex: string,
    plaintext: string,
  ) => string;
  readonly yapV1Decrypt: (
    sharedSecretHex: string,
    privateKeyHex: string,
    plaintext: string,
  ) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeCryptoModule');
