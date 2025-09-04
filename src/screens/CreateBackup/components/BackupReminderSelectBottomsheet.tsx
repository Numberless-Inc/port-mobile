import React from 'react';
import {StyleSheet, View} from 'react-native';

import {FlatList} from 'react-native-gesture-handler';

import BaseBottomSheet from '@components/BaseBottomsheet';
import {useColors} from '@components/colorGuide';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import OptionWithRadio from '@components/Options/OptionWithRadio';
import LineSeparator from '@components/Separators/LineSeparator';
import {Spacing,Width} from '@components/spacingGuide';

import {
  BackupIntervalString,
  backupIntervalStrings,
  backupIntervals,
} from '@utils/Time/interfaces';

const BackupReminderSelectBottomsheet = ({
  setShowBackupReminderModal,
  showBackupReminderModal,
  currentInterval,
  onUpdateBackupInterval,
}: {
  setShowBackupReminderModal: (show: boolean) => void;
  showBackupReminderModal: boolean;
  currentInterval: BackupIntervalString;
  onUpdateBackupInterval: (option: BackupIntervalString) => Promise<void>;
}) => {
  const Colors = useColors();
  
  return (
    <BaseBottomSheet
      onClose={() => setShowBackupReminderModal(false)}
      visible={showBackupReminderModal}>
      <View style={styles.connectionOptionsRegion}>
        <View style={styles.mainContainer}>
          <NumberlessText
            textColor={Colors.text.title}
            fontSizeType={FontSizeType.xl}
            fontWeight={FontWeight.sb}>
            Choose duration
          </NumberlessText>
          <LineSeparator style={{width: Width.screen}} />
        </View>
      </View>
      <View
        style={{
          width: Width.screen,
        }}>
        <FlatList
          keyExtractor={(_item, index) => index.toString()}
          data={backupIntervalStrings}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <View style={styles.optionWrapper}>
              <OptionWithRadio
                selectedOptionComparision={backupIntervals[item]}
                selectedOption={backupIntervals[currentInterval]}
                separator={index != backupIntervalStrings.length - 1}
                title={item}
                onClick={async () => {
                  await onUpdateBackupInterval(
                    item,
                  );
                  setShowBackupReminderModal(false);
                }}
              />
            </View>
          )}
        />
      </View>
    </BaseBottomSheet>
  );
};

const styles = StyleSheet.create({
  connectionOptionsRegion: {
    width: Width.screen,
    paddingHorizontal: Spacing.l,
  },
  mainContainer: {
    width: '100%',
    paddingTop: Spacing.s,
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.m,
  },
  optionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default BackupReminderSelectBottomsheet;

