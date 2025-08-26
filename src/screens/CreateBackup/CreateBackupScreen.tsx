import React, { useEffect, useMemo, useReducer, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import { useColors } from '@components/colorGuide';
import { CustomStatusBar } from '@components/CustomStatusBar';
import { GestureSafeAreaView } from '@components/GestureSafeAreaView';
import { FontSizeType, FontWeight, NumberlessText } from '@components/NumberlessText';
import { Spacing } from '@components/spacingGuide';
import GenericBackTopBar from '@components/TopBars/GenericBackTopBar';

import { AppStackParamList } from '@navigation/AppStack/AppStackTypes';

import { createAndSaveBackup, createAndUploadBackup, getBackupIntervalInStorage, setBackupIntervalInStorage } from '@utils/Backup';
import { setBackupTime } from '@utils/Profile';
import { getChatTileTimestamp } from '@utils/Time';
import { BackupIntervalString, DEFAULT_BACKUP_INTERVAL } from '@utils/Time/interfaces';

import { ToastType, useToast } from 'src/context/ToastContext';

import AddPasswordCard from './components/AddPasswordCard';
import BackupReminderSelectBottomsheet from './components/BackupReminderSelectBottomsheet';
import ExportBackup from './components/ExportBackup';
import ExportCloudBackup from './components/ExportCloudBackup';
import ExportLocalBackup from './components/ExportLocalBackup';
import ReminderCard from './components/ReminderCard';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateBackupScreen'>;

type ExportMode = 'cloud' | 'local' | null;

type ExportState = {
  exportMode: ExportMode;
  isExporting: boolean;
  exportComplete: boolean;
}

type ExportAction =
  | { type: 'SET_MODE'; mode: ExportMode }
  | { type: 'START_EXPORT' }
  | { type: 'COMPLETE_EXPORT' }
  | { type: 'RESET_EXPORT' };

function exportReducer(state: ExportState, action: ExportAction): ExportState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        exportMode: action.mode,
        exportComplete: false, // reset on mode change
      };
    case 'START_EXPORT':
      return {
        ...state,
        isExporting: true,
        exportComplete: false,
      };
    case 'COMPLETE_EXPORT':
      return {
        ...state,
        isExporting: false,
        exportComplete: true,
      };
    case 'RESET_EXPORT':
      return {
        exportMode: null,
        isExporting: false,
        exportComplete: false,
      };
    default:
      return state;
  }
}

type PasswordState = {
  password: string
  reenterPassword: string
  isPasswordValid: boolean
  error?: string
}

type PasswordAction =
  | { type: 'UPDATE_PASSWORD'; newPassword: string }
  | { type: 'UPDATE_REENTER_PASSWORD'; newReenterPassword: string }

function passwordReducer(
  state: PasswordState,
  action: PasswordAction
): PasswordState {
  let newPassword = state.password;
  let newReenterPassword = state.reenterPassword;
  if (action.type === 'UPDATE_PASSWORD') {
    newPassword = action.newPassword;
  } else if (action.type === 'UPDATE_REENTER_PASSWORD') {
    newReenterPassword = action.newReenterPassword;
  }
  const rules: {
    check: (pw: string, repw: string) => boolean
    message: string
  }[] = [
    {
      check: (pw, _) => pw.length < 8,
      message: 'Password must be at least 8 characters.',
    },
    {
      check: (pw, repw) => pw !== repw,
      message: 'Passwords do not match.',
    }, // …add more rules here later
  ]
  const failed = rules.find(r => r.check(newPassword, newReenterPassword))
  const error = failed?.message;
  const isPasswordValid = !failed; // Evil inline falsiness check
  return {
    password: newPassword,
    reenterPassword: newReenterPassword,
    isPasswordValid,
    error
  };
}

const CreateBackupScreen = ({ navigation }: Props) => {

  const { showToast } = useToast();

  const [exportState, dispatchExport] = useReducer(exportReducer, {
    exportMode: null,
    isExporting: false,
    exportComplete: false,
  });

  const [passwordState, passwordDispatch] = useReducer(passwordReducer, {
    password: '',
    reenterPassword: '',
    isPasswordValid: false,
    error: undefined,
  });

  //colors and styles
  const color = useColors();
  const styles = styling(color);

  const [showBackupReminderModal, setShowBackupReminderModal] = useState(false);
  const [currentInterval, setCurrentInterval] = useState<BackupIntervalString>(DEFAULT_BACKUP_INTERVAL);
  useEffect(() => {
    (async () => {
      const interval = await getBackupIntervalInStorage();
      if (interval) {
        setCurrentInterval(interval);
      }
    })();
  }, []);
  
  const exportCloudBackup = async () => {
    dispatchExport({ type: 'START_EXPORT' });
    try {
      await createAndUploadBackup(passwordState.password);
      await setBackupTime();
      showToast('Backup created successfully', ToastType.success);
      dispatchExport({ type: 'COMPLETE_EXPORT' });
    } catch (error: any) {
      console.error('Backup failed:', error);
      showToast('Backup creation failed', ToastType.error);
      dispatchExport({ type: 'RESET_EXPORT' });
    }
  };

  const exportLocalBackup = async () => {
    dispatchExport({ type: 'START_EXPORT' });
    try {
      await createAndSaveBackup(passwordState.password);
      await setBackupTime();
      showToast('Backup created successfully', ToastType.success);
      dispatchExport({ type: 'COMPLETE_EXPORT' });
    } catch (error: any) {
      console.error('Backup failed:', error);
      showToast('Backup creation failed', ToastType.error);
      dispatchExport({ type: 'RESET_EXPORT' });
    }
  };

  const onUpdateBackupInterval = async (option: BackupIntervalString) => {
    setBackupIntervalInStorage(option);
    setCurrentInterval(option);
  }

  const profile = useSelector((val: any) => val.profile.profile);
  const { lastBackupTime } = useMemo(() => {
    return {
      lastBackupTime: profile?.lastBackupTime || null,
    };
  }, [profile]);

  const renderExportSection = () => {
    if (!passwordState.isPasswordValid) return null;
    switch (exportState.exportMode) {
      case 'cloud':
        return (
          <ExportCloudBackup
            onExport={exportCloudBackup}
            setExportMode={(mode) =>
              dispatchExport({ type: 'SET_MODE', mode })
            }
            isExporting={exportState.isExporting}
          />
        );
      case 'local':
        return (
          <ExportLocalBackup
            onExport={exportLocalBackup}
            setExportMode={(mode) =>
              dispatchExport({ type: 'SET_MODE', mode })
            }
            isExporting={exportState.isExporting}
          />
        );
      default:
        return (
          <ExportBackup
            onCloudExport={() =>
              dispatchExport({ type: 'SET_MODE', mode: 'cloud' })
            }
            onLocalExport={() =>
              dispatchExport({ type: 'SET_MODE', mode: 'local' })
            }
            exportMode={exportState.exportMode}
          />
        );
    }
  };

  return (
    <>
      <CustomStatusBar theme={color.theme} backgroundColor={color.background} />
      <GestureSafeAreaView style={{flex: 1}} backgroundColor={color.background}>
        <GenericBackTopBar
          onBackPress={() => navigation.goBack()}
          theme={color.theme}
          backgroundColor={color.background}
        />
        <ScrollView contentContainerStyle={styles.mainContainer}>
          <View style={{ gap: Spacing.m, marginBottom: Spacing.l }}>
            <NumberlessText
              textColor={color.text.title}
              fontWeight={FontWeight.sb}
              fontSizeType={FontSizeType.es}>
              {'Create a backup'}
            </NumberlessText>
            <NumberlessText
              textColor={color.text.title}
              fontWeight={FontWeight.rg}
              fontSizeType={FontSizeType.l}>
              (Last backup: {lastBackupTime
                ? getChatTileTimestamp(lastBackupTime)
                : <NumberlessText
                    textColor={color.red}
                    fontWeight={FontWeight.rg}
                    fontSizeType={FontSizeType.l}
                  >
                    Never
                  </NumberlessText>
              })
            </NumberlessText>
            <NumberlessText
              textColor={color.text.subtitle}
              fontWeight={FontWeight.rg}
              fontSizeType={FontSizeType.l}>
              Effortlessly secure and restore your conversations with our encrypted chat backup feature. Designed to safeguard your data and ensure seamless access whenever needed.
            </NumberlessText>
          </View>
          <AddPasswordCard
            password={passwordState.password}
            setPassword={(newPassword) =>
              passwordDispatch({ type: 'UPDATE_PASSWORD', newPassword })
            }
            reenterPassword={passwordState.reenterPassword}
            setReenterPassword={(newReenterPassword) =>
              passwordDispatch({ type: 'UPDATE_REENTER_PASSWORD', newReenterPassword })
            }
            error={passwordState.error}
          />
          {renderExportSection()}
          {exportState.exportComplete && (
            <ReminderCard 
              humanReadableBackupInterval={currentInterval}
              setShowBackupReminderModal={setShowBackupReminderModal}
            />
          )}
        </ScrollView>
        <BackupReminderSelectBottomsheet 
          showBackupReminderModal={showBackupReminderModal}
          setShowBackupReminderModal={setShowBackupReminderModal}
          currentInterval={currentInterval}
          onUpdateBackupInterval={onUpdateBackupInterval}
        />
      </GestureSafeAreaView>
    </>
  );
};

const styling = (colors: any) =>
  StyleSheet.create({
    inputContainer: {
      marginBottom: Spacing.l,
    },
    mainContainer: {
      flex: 1,
      justifyContent: 'flex-start',
      paddingHorizontal: Spacing.l,
      paddingBottom: Spacing.l,
      gap: Spacing.l,
    },
    label: {
      fontSize: 16,
      color: colors.text.title,
      marginBottom: Spacing.s,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.stroke,
      borderRadius: 8,
      padding: Spacing.m,
      fontSize: 16,
      color: colors.text.title,
      backgroundColor: colors.background1,
    },
    displayContainer: {
      marginTop: Spacing.xl,
    },
    displayText: {
      fontSize: 16,
      color: colors.text.body,
      marginTop: Spacing.s,
    },
    buttonContainer: {
      marginTop: Spacing.xl,
      width: '100%',
      alignItems: 'center',
    },
    successText: {
      color: 'green',
      marginTop: Spacing.s,
      textAlign: 'center',
    },
    errorText: {
      color: 'red',
      marginTop: Spacing.s,
      textAlign: 'center',
    },
  });

export default CreateBackupScreen;
