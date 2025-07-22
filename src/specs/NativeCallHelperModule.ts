import {TurboModule, TurboModuleRegistry} from 'react-native';

import type {EventEmitter} from 'react-native/Libraries/Types/CodegenTypes';

// Define the payload types for the events
export type AcceptEventPayload = {callUUID: string};
export type EndEventPayload = {callUUID: string};
export type MuteEventPayload = {callUUID: string; muted: boolean};
export type MappedAudioRoute = 'Speakerphone' | 'Earpiece' | 'unknown';

export type AudioOutput = {
  mappedAudioRoute: MappedAudioRoute;
};

export type NativeAudioRouteChangePayload = {
  outputs: AudioOutput[];
};
export interface Spec extends TurboModule {
  readonly startOutgoingCall: (callUUID: string, callerName: string) => void;
  readonly acceptIncomingCall: (callUUID: string) => void;
  readonly rejectIncomingCall: (callUUID: string) => void;
  readonly endOngoingCall: (callUUID: string) => void;
  readonly didAnswerCall: (callUUID: string) => string;
  readonly displayIncomingCall: (callerName: string, callUUID: string, callRingTimeSeconds: number) => void;
  readonly onAccept: EventEmitter<AcceptEventPayload>;
  readonly onEnd: EventEmitter<EndEventPayload>;
  readonly onMute: EventEmitter<MuteEventPayload>;
  readonly onNativeAudioRouteChange: EventEmitter<NativeAudioRouteChangePayload>;
  readonly getAudioRoutes: () => Promise<string[]>;
  readonly setAudioRoute: (route: string) => void;
  readonly cancelRingtone: () => void;  // Remove this, tie directly into answer/decline
  readonly startKeepPhoneAwake: () => void;
  readonly endKeepPhoneAwake: () => void;
  readonly endOutgoingRinging: () => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeCallHelperModule');
