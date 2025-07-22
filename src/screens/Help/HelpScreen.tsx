import React from 'react';
import {Linking, Pressable, StyleSheet, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import { useColors } from '@components/colorGuide';
import {CustomStatusBar} from '@components/CustomStatusBar';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import BackTopbar from '@components/Reusable/TopBars/BackTopBar';
import {SafeAreaView} from '@components/SafeAreaView';
import { Spacing } from '@components/spacingGuide';
import useSVG from '@components/svgGuide';

// TODO: Why is the legal screen labeled HelpScreen
const HelpScreen = () => {
  const navigation = useNavigation();

  const Colors = useColors();
  const styles = styling(Colors);

  const svgArray = [
    {
      assetName: 'AngleRight',
      light: require('@assets/light/icons/navigation/AngleRight.svg').default,
      dark: require('@assets/dark/icons/navigation/AngleRight.svg').default,
    },
  ];
  const results = useSVG(svgArray);
  const BlackAngleRight = results.AngleRight;

  return (
    <>
      <CustomStatusBar backgroundColor={Colors.surface} />
      <SafeAreaView style={styles.screen}>
        <BackTopbar
          onBackPress={() => navigation.goBack()}
          bgColor="g"
        />
        <NumberlessText
        style={{textAlign:'left', width:'100%', marginLeft: Spacing.xl}}
          textColor={Colors.text.title}
          fontWeight={FontWeight.sb}
          fontSizeType={FontSizeType.xl}>
          Legal
        </NumberlessText>
        <View style={styles.mainComponent}>
            <Pressable
              style={styles.button}
              onPress={() =>
                Linking.openURL(
                  'https://portmessenger.com/TermsAndConditions',
                )
              }>
              <View style={{flexDirection: 'row'}}>
                <NumberlessText
                  style={{marginLeft: Spacing.s,}}
                  textColor={Colors.text.title}
                  fontWeight={FontWeight.rg}
                  fontSizeType={FontSizeType.l}>
                  Terms & Conditions
                </NumberlessText>
              </View>
              <View
                style={{flexDirection: 'row', gap: 3, alignItems: 'center'}}>
                <BlackAngleRight />
              </View>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() =>
                Linking.openURL('https://portmessenger.com/PrivacyPolicy')
              }>
              <View style={{flexDirection: 'row'}}>
                <NumberlessText
                  style={{
                    marginLeft: Spacing.s
                  }}
                  textColor={Colors.text.title}
                  fontWeight={FontWeight.rg}
                  fontSizeType={FontSizeType.l}>
                  Privacy Policy
                </NumberlessText>
              </View>
              <View
                style={{flexDirection: 'row', gap: 3, alignItems: 'center'}}>
                <BlackAngleRight />
              </View>
            </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
};

const styling = (colors: any) =>
  StyleSheet.create({
    screen: {
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    mainComponent: {
      flex: 1,
      backgroundColor: colors.background,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingBottom: Spacing.l,
      paddingHorizontal: Spacing.m,
      marginTop:Spacing.l,
      gap: Spacing.s
    },
    button: {
      width: '100%',
      backgroundColor: colors.surface,
      height: 58,
      justifyContent: 'space-between',
      flexDirection: 'row',
      borderRadius: 16,
      paddingHorizontal: Spacing.l,
      alignItems: 'center',
      borderWidth: 0.5, 
      borderColor: colors.stroke
    },
  });
export default HelpScreen;
