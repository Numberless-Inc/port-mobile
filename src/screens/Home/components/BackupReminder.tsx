/**
 * Default chat tile displayed when there are no connections
 */
import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useSelector } from 'react-redux';

import { Colors } from '@components/colorGuide';
import {
    FontSizeType,
    FontWeight,
    NumberlessText,
} from '@components/NumberlessText';
import { Spacing, Width } from '@components/spacingGuide';

import { formatTimeAgo } from '@utils/Time';

import Backup from '@assets/icons/GreenBackup.svg';
import GreenCross from '@assets/icons/GreenCross.svg';

// Get reminder interval from storage
function shouldShowReminder(
    latestBackupTime: string | null | undefined,
    interval: number,
) {
    if (!interval || !latestBackupTime) return false; // Reminders off, or backup time is null
    if (latestBackupTime === '') return true; // Never backed up
    try {
        return new Date(latestBackupTime).getTime() - Date.now() > interval;
    } catch (error) {
        return false;
    }
}

function BackupReminder({
    lastBackupTime,
    hideReminder,
    onBackupPress,
    onClosePress
}: {
    lastBackupTime: string | undefined,
    hideReminder: boolean,
    onBackupPress: () => void,
    onClosePress: () => void
}): ReactNode {
    const interval = useSelector(state => state.backups.backupReminderInterval);
    const profile = useSelector(state => state.profile.profile);

    const { showReminder, reminderText } = useMemo(() => {
        if (hideReminder) {
            return {
                showReminder: false,
                reminderText: ''
            };
        } else {
            const latestBackupTime = profile?.lastBackupTime || lastBackupTime;
            return {
                showReminder: shouldShowReminder(latestBackupTime, interval),
                reminderText: latestBackupTime
                    ? `Your last backup was ${formatTimeAgo(latestBackupTime)}. Backup now to avoid losing your data.`
                    : 'You haven\'t backed up your chats yet. Backup now to avoid losing your data.'
                };
        }
    }, [hideReminder, lastBackupTime, profile, interval]);

    return (
        showReminder
        ? (
            <View style={styles.mainContainer}>
                <TouchableOpacity onPress={onBackupPress} style={styles.backupContainer}>
                    <View style={styles.svg1Container}>
                        <Backup width={24} height={24} />
                    </View>
                    <NumberlessText
                        style={styles.textContainer}
                        textColor={Colors.common.boldAccentColors.darkGreen}
                        fontSizeType={FontSizeType.m}
                        fontWeight={FontWeight.rg}>
                        {reminderText}
                    </NumberlessText>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClosePress} style={styles.svg2Container}>
                    <GreenCross width={20} height={20} />
                </TouchableOpacity>
            </View>
        ) : null
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        width: Width.screen - 2*Spacing.s,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.s,
        paddingVertical: Spacing.s,
        borderRadius: Spacing.l,
        backgroundColor: Colors.common.lowAccentColors.darkGreen,
    },
    backupContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    textContainer: {
        width: Width.screen - 128,
        textDecorationLine: 'underline',
    },
    svg1Container: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    svg2Container: {
        width: 52,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default BackupReminder;
