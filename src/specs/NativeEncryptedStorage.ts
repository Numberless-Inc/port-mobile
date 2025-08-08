import {TurboModule, TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  readonly setItem: (key: string, value: string) => void;
  readonly getItem: (key: string) => string | undefined;
  readonly clear: () => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeEncryptedStorage',
);
