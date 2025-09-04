export const expiryOptions: expiryOptionsTypes[] = [
  'forever',
  '1 hour',
  '12 hours',
  '1 day',
  '1 week',
];
export type expiryOptionsTypes =
  | '1 hour'
  | '12 hours'
  | '1 day'
  | '1 week'
  | 'forever';
export const expiryDuration: {[key in expiryOptionsTypes]: number | null} = {
  '1 hour': 1 * 60 * 60 * 1000,
  '12 hours': 12 * 60 * 60 * 1000,
  '1 day': 24 * 60 * 60 * 1000,
  '1 week': 7 * 24 * 60 * 60 * 1000,
  forever: null,
};

export const disappearOptions: disappearOptionsTypes[] = [
  '30 seconds',
  '12 hours',
  '1 day',
  '1 week',
  '90 days',
  'Off',
];
export type disappearOptionsTypes =
  | '30 seconds'
  | '12 hours'
  | '1 day'
  | '1 week'
  | '90 days'
  | 'Off';

export const disappearDuration: {[key in disappearOptionsTypes]: number} = {
  '30 seconds': 30 * 1000,
  '12 hours': 12 * 60 * 60 * 1000,
  '1 day': 24 * 60 * 60 * 1000,
  '1 week': 7 * 24 * 60 * 60 * 1000,
  '90 days': 90 * 24 * 60 * 60 * 1000,
  Off: 0,
};

export const backupIntervals = {
  'in 3 days': 3 * 24 * 60 * 60 * 1000,
  'in 7 days': 7 * 24 * 60 * 60 * 1000,
  'in 15 days': 15 * 24 * 60 * 60 * 1000,
  'in 30 days': 30 * 24 * 60 * 60 * 1000,
  'in 90 days': 90 * 24 * 60 * 60 * 1000,
  'Never': 0,
}
export type BackupIntervalString = keyof typeof backupIntervals;
export const backupIntervalStrings = Object.keys(backupIntervals) as BackupIntervalString[];
export const DEFAULT_BACKUP_INTERVAL: BackupIntervalString = 'Never'; // Potential badness - default value in non-config file
