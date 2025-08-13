import React from 'react';
import { View } from 'react-native';

import PrimaryButton from '@components/Buttons/PrimaryButton';
import SecondaryButton from '@components/Buttons/SecondaryButton';
import GradientCard from '@components/Cards/GradientCard';
import { useColors } from '@components/colorGuide';
import { isIOS } from '@components/ComponentUtils';
import {
    FontSizeType,
    FontWeight,
    NumberlessText,
} from '@components/NumberlessText';
import { Spacing } from '@components/spacingGuide';
import useSVG from '@components/svgGuide';

const ExportBackup = ({
    onCloudExport,
    onLocalExport,
    exportMode,
}:{
    onCloudExport: () => void;
    onLocalExport: () => void;
    exportMode: string | null;
}) => {
    const color = useColors();
    const svgArray = [
        {
          assetName: 'GoogleLogo',
          light: require('@assets/icons/GoogleSmall.svg').default,
          dark: require('@assets/icons/GoogleSmall.svg').default,
        },
      ];
      const svgResults = useSVG(svgArray, color.theme);
      const GoogleLogo = svgResults.GoogleLogo;
      
    return (
        <GradientCard style={{ padding: Spacing.l, paddingVertical: Spacing.l }}>
            <View>
                <NumberlessText
                    textColor={color.text.title}
                    fontSizeType={FontSizeType.l}
                    fontWeight={FontWeight.md}>
                    Choose backup location
                </NumberlessText>
                <NumberlessText
                    style={{ marginTop: Spacing.m }}
                    textColor={color.text.subtitle}
                    fontSizeType={FontSizeType.s}
                    fontWeight={FontWeight.rg}>
                    We recommend saving your backup to the cloud. It'll be stored in a hidden folder, so only you can access it, and you'll be able to restore your chats even if you lose your device.
                </NumberlessText>
                <View style={{ gap: Spacing.s, marginTop: Spacing.m, justifyContent: 'center', alignItems: 'center' }}>
                    <PrimaryButton
                        text={isIOS ? "Continue with iCloud" : "Continue with Google"}
                        onClick={onCloudExport}
                        isLoading={exportMode === 'cloud'}
                        disabled={exportMode === 'cloud'}
                        theme={color.theme}
                        Icon={isIOS ? undefined : GoogleLogo}
                        textStyle={{ fontSize: FontSizeType.m, fontWeight: FontWeight.md }}
                    />
                    <NumberlessText
                        textColor={color.text.title}
                        fontSizeType={FontSizeType.s}
                        fontWeight={FontWeight.sb}>
                        Or                    
                    </NumberlessText>
                    <SecondaryButton
                        text="Create a local backup"
                        onClick={onLocalExport}
                        isLoading={exportMode === 'local'}
                        disabled={false}
                        theme={color.theme}
                        textStyle={{ fontSize: FontSizeType.m, fontWeight: FontWeight.md }}
                    />
                </View>
            </View>
        </GradientCard>
    );
};

export default ExportBackup;
