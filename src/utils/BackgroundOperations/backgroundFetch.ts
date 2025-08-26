
import {performPeriodicOperations} from '@utils/AppOperations';

export async function initBackgroundFetch() {

  console.log('[BackgroundFetch] Disabled. Manually trigger operations if needed.');
}

export async function manuallyTriggerPeriodicOperations() {
  console.log('[Manually triggering background operations]');
  try {
    await performPeriodicOperations();
    console.log('[Manual operation completed]');
  } catch (err) {
    console.error('[Manual operation failed]', err);
  }
}

// On android force background fetch using the following while debugging
// adb shell cmd jobscheduler run -f com.numberless 999
