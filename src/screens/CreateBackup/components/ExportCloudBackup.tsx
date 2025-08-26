import React from 'react';
import { View } from 'react-native';

import PrimaryButton from '@components/Buttons/PrimaryButton';
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

const ExportCloudBackup = ({
    onExport,
    setExportMode,
    isExporting,
}: {
    onExport: () => void;
    setExportMode: (mode: 'cloud' | 'local' | null) => void;
    isExporting: boolean;
}) => {
    const color = useColors();
    const svgArray = [
        {
          assetName: 'GoogleLogo',
          light: require('@assets/icons/GoogleSmall.svg').default,
          dark: require('@assets/icons/GoogleSmall.svg').default,
        },
    ];
    // const email = "test@example.com"; // Standin for now
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
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <NumberlessText
                        style={{ marginTop: Spacing.s }}
                        textColor={color.text.subtitle}
                        fontSizeType={FontSizeType.s}
                        fontWeight={FontWeight.md}>
                        {isIOS ? 'iCloud Backup' : 'Google Backup'}
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
                {/* <View style={{flexDirection: 'row', justifyContent: 'space-between'}}> */}
                {/*     <NumberlessText */}
                {/*         style={{ marginTop: Spacing.s }} */}
                {/*         textColor={color.text.subtitle} */}
                {/*         fontSizeType={FontSizeType.s} */}
                {/*         fontWeight={FontWeight.md}> */}
                {/*         Account: {email} */}
                {/*     </NumberlessText> */}
                {/*     <NumberlessText */}
                {/*         style={{ marginTop: Spacing.s }} */}
                {/*         textColor={color.text.buttonText} */}
                {/*         fontSizeType={FontSizeType.s} */}
                {/*         fontWeight={FontWeight.rg} */}
                {/*         onPress={() => setExportMode(null)}> */}
                {/*         Change */}
                {/*     </NumberlessText> */}
                {/* </View> */}
                <View style={{ gap: Spacing.s, marginTop: Spacing.m, justifyContent: 'center', alignItems: 'center' }}>
                    <PrimaryButton
                        text={isIOS ? "Back up to iCloud" : "Back up to Google"}
                        onClick={onExport}
                        isLoading={isExporting}
                        disabled={isExporting}
                        theme={color.theme}
                        Icon={isIOS ? undefined : GoogleLogo}
                        textStyle={{ fontSize: FontSizeType.m, fontWeight: FontWeight.md }}
                    />
                </View>
            </View>
        </GradientCard>
    );
};

export default ExportCloudBackup;
