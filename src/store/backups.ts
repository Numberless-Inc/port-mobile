import {BackupIntervalString, DEFAULT_BACKUP_INTERVAL} from '@utils/Time/interfaces';

type BackupReminderState = {
    backupReminderInterval: BackupIntervalString    
}

type BackupReminderActions = 
    | { type: 'UPDATE_REMINDER_INTERVAL', newInterval: BackupIntervalString};

/**
 * Reducer that manages state of backup reminders
 * 
 * @param {BackupReminderState} state - Existing state
 * @param {BackupReminderActions} payload - Action payload
 */
export default function backups(
    state: BackupReminderState = {
        backupReminderInterval: DEFAULT_BACKUP_INTERVAL,
    },
    payload: BackupReminderActions
): BackupReminderState {
    switch (payload.type) {
        case 'UPDATE_REMINDER_INTERVAL':
            return {
                ...state,
                backupReminderInterval: payload.newInterval,
            }
        default:
            return state
    }
}

