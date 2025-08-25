import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
    readonly initialize: (
        presign: string,
        begin: string,
        complete: string,
        abort: string,
    ) => void;
    readonly uploadFile: (
        path: string,
        token: string,
        partSize: number,
    ) => Promise<string>;
    readonly cancelUpload: (
        path: string,
    ) => Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeMediaUploadModule');
