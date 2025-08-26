import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import GradientCard from '@components/Cards/GradientCard';
import { useColors } from '@components/colorGuide';
import {
    FontSizeType,
    FontWeight,
    NumberlessText,
} from '@components/NumberlessText';
import { Height, Spacing } from '@components/spacingGuide';

const ReminderCard = ({
    humanReadableBackupInterval,
    setShowBackupReminderModal,
}: {
    humanReadableBackupInterval: string;
    setShowBackupReminderModal: (value: boolean) => void;
}) => {
    const color = useColors();

    const dynamicContainer: ViewStyle = {
        backgroundColor: color.surface,
        borderColor: color.stroke,
    }
    const dynamicText: TextStyle = {
        color: color.text.title,
    }

    return (
        <GradientCard style={{ padding: Spacing.l, paddingVertical: Spacing.l }}>
            <View>
                <NumberlessText
                    textColor={color.text.title}
                    fontSizeType={FontSizeType.l}
                    fontWeight={FontWeight.md}>
                    Remind me:
                </NumberlessText>
                <Pressable
                    style={StyleSheet.compose(
                        styles.inputLike,
                        dynamicContainer,
                    )}
                    onPress={() => setShowBackupReminderModal(true)}
                >
                    <Text
                        style={StyleSheet.compose(
                            styles.inputText,
                            dynamicText,
                        )}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {humanReadableBackupInterval}
                    </Text>
                </Pressable>
            </View>
        </GradientCard>
    );
};

const styles = StyleSheet.create({
  inputLike: {
    marginTop: Spacing.m,
    paddingHorizontal: Spacing.l,
    paddingVertical: 0,
    borderRadius: 12,
    borderWidth: 0.5,
    height: Height.inputBar,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: FontSizeType.l,
    fontWeight: FontWeight.rg,
  },
})

export default ReminderCard;
