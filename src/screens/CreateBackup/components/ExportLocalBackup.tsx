import React from 'react';
import { View } from 'react-native';

import PrimaryButton from '@components/Buttons/PrimaryButton';
import GradientCard from '@components/Cards/GradientCard';
import { useColors } from '@components/colorGuide';
import {
    FontSizeType,
    FontWeight,
    NumberlessText,
} from '@components/NumberlessText';
import { Spacing } from '@components/spacingGuide';

const ExportLocalBackup = ({
    onExport,
    setExportMode,
    isExporting,
}: {
    onExport: () => void;
    setExportMode: (mode: 'cloud' | 'local' | null) => void;
    isExporting: boolean;
}) => {
    const color = useColors();
    return (
        <GradientCard style={{ padding: Spacing.l, paddingVertical: Spacing.l }}>
            <View>
                <NumberlessText
                    textColor={color.text.title}
                    fontSizeType={FontSizeType.l}
                    fontWeight={FontWeight.md}>
                    Choose backup location
                </NumberlessText>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <NumberlessText
                        style={{ marginTop: Spacing.s }}
                        textColor={color.text.subtitle}
                        fontSizeType={FontSizeType.s}
                        fontWeight={FontWeight.md}>
                        Local backup
                    </NumberlessText>
                    <NumberlessText
                        style={{ marginTop: Spacing.s }}
                        textColor={color.text.buttonText}
                        fontSizeType={FontSizeType.s}
                        fontWeight={FontWeight.rg}
                        onPress={() => setExportMode(null)}>
                        Go back
                    </NumberlessText>
                </View>
                <NumberlessText
                    style={{ marginTop: Spacing.m }}
                    textColor={color.text.subtitle}
                    fontSizeType={FontSizeType.s}
                    fontWeight={FontWeight.rg}>
                    By managing your backup yourself, you accept the potential of losing your account if your backup file is lost.
                </NumberlessText>
                <View style={{ gap: Spacing.s, marginTop: Spacing.m, justifyContent: 'center', alignItems: 'center' }}>
                    <PrimaryButton
                        text={'Back up now'}
                        onClick={onExport}
                        isLoading={isExporting}
                        disabled={isExporting}
                        theme={color.theme}
                        textStyle={{ fontSize: FontSizeType.m, fontWeight: FontWeight.md }}
                    />
                </View>
            </View>
        </GradientCard>
    );
};

export default ExportLocalBackup;
