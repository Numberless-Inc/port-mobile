import { useCallback, useEffect, useMemo, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CameraDevice } from 'react-native-vision-camera';
import { useCameraDevices } from 'react-native-vision-camera';

const STORAGE_KEY = 'camera.preferredDeviceId';

export function usePreferredCameraDevice(): [CameraDevice | undefined, (device: CameraDevice) => void] {
  const [preferredDeviceId, setPreferredDeviceIdState] = useState<string | null>(null);
  const devices = useCameraDevices();

  // Load from AsyncStorage once on mount
  useEffect(() => {
    (async () => {
      try {
        const savedId = await AsyncStorage.getItem(STORAGE_KEY);
        setPreferredDeviceIdState(savedId);
      } catch (err) {
        console.error('Failed to load preferred camera ID:', err);
      }
    })();
  }, []);

  const setPreferredDevice = useCallback(async (device: CameraDevice) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, device.id);
      setPreferredDeviceIdState(device.id);
    } catch (err) {
      console.error('Failed to save preferred camera ID:', err);
    }
  }, []);

  const device = useMemo(() => {
    return devices.find((d) => d.id === preferredDeviceId);
  }, [devices, preferredDeviceId]);

  return [device, setPreferredDevice];
}
