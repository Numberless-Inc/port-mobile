import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DeviceInfo from 'react-native-device-info';
import { useSelector } from 'react-redux';

import PrimaryButton from '@components/Buttons/PrimaryButton';
import { useColors } from '@components/colorGuide';
import { CustomStatusBar } from '@components/CustomStatusBar';
import DeveloperBox from '@components/DeveloperBox';
import { GestureSafeAreaView } from '@components/GestureSafeAreaView';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import { AvatarBox } from '@components/Reusable/AvatarBox/AvatarBox';
import EditAvatar from '@components/Reusable/BottomSheets/EditAvatar';
import EditName from '@components/Reusable/BottomSheets/EditName';
import ThemeBottomsheet from '@components/Reusable/BottomSheets/ThemeBottomsheet';
import { Spacing } from '@components/spacingGuide';
import useSVG from '@components/svgGuide';
import GenericTitle from '@components/Text/GenericTitle';

import { DEFAULT_NAME, DEFAULT_PROFILE_AVATAR_INFO } from '@configs/constants';

import { BottomNavStackParamList } from '@navigation/AppStack/BottomNavStack/BottomNavStackTypes';

import { turnOffDeveloperMode , turnOnDeveloperMode } from '@utils/DeveloperMode';
import { updateProfileName } from '@utils/Profile';
import { setNewProfilePicture } from '@utils/ProfilePicture';
import { FileAttributes } from '@utils/Storage/StorageRNFS/interfaces';
import { ThemeType, getTheme } from '@utils/Themes';
import { getChatTileTimestamp } from '@utils/Time';

type Props = NativeStackScreenProps<BottomNavStackParamList, 'Settings'>;

const NewProfileScreen = ({ navigation }: Props) => {
  const profile = useSelector(state => state.profile.profile);
  const isDeveloperMode = useSelector(state => state.developerMode.developerMode);
  const [versionTapCount, setVersionTapCount] = useState(0);

  const { name, avatar, lastBackupTime } = useMemo(() => {
    return {
      name: profile?.name || DEFAULT_NAME,
      avatar: profile?.profilePicInfo || DEFAULT_PROFILE_AVATAR_INFO,
      lastBackupTime: profile?.lastBackupTime || null,
    };
  }, [profile]);
  const processedName: string = name || DEFAULT_NAME;
  const processedAvatar: FileAttributes = avatar || DEFAULT_PROFILE_AVATAR_INFO;

  const [profilePicAttr, setProfilePicAttr] =
    useState<FileAttributes>(processedAvatar);
  const [openEditAvatarModal, setOpenEditAvatarModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>(
    ThemeType.default,
  );
  const [openThemeBottomSheet, setOpenThemeBottomSheet] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState<string>(processedName);
  const colors = useColors();
  const styles = styling(colors);

  useEffect(() => {
    (async () => {
      try {
        const currentTheme = await getTheme();
        setSelectedTheme(currentTheme);
      } catch (error) {
        console.log('error getting theme: ', error);
        setSelectedTheme(ThemeType.default);
      }
    })();
  }, []);

  const svgArray = [
    {
      assetName: 'DefaultPermissions',
      light: require('@assets/light/icons/Profile/DefaultPermissions.svg')
        .default,
      dark: require('@assets/dark/icons/Profile/DefaultPermissions.svg')
        .default,
    },
    {
      assetName: 'Blocked',
      light: require('@assets/light/icons/Profile/Blocked.svg').default,
      dark: require('@assets/dark/icons/Profile/Blocked.svg').default,
    },
    {
      assetName: 'Legal',
      light: require('@assets/light/icons/Profile/Legal.svg').default,
      dark: require('@assets/dark/icons/Profile/Legal.svg').default,
    },
    {
      assetName: 'Backup',
      light: require('@assets/light/icons/Profile/Backup.svg').default,
      dark: require('@assets/dark/icons/Profile/Backup.svg').default,
    },
    {
      assetName: 'Appearance',
      light: require('@assets/light/icons/Profile/Apperance.svg').default,
      dark: require('@assets/dark/icons/Profile/Apperance.svg').default,
    },
    {
      assetName: 'AngleRight',
      light: require('@assets/light/icons/navigation/AngleRight.svg').default,
      dark: require('@assets/dark/icons/navigation/AngleRight.svg').default,
    },
    {
      assetName: 'RoundPencil',
      light: require('@assets/light/icons/RoundPencil.svg').default,
      dark: require('@assets/dark/icons/RoundPencil.svg').default,
    },
    {
      assetName: 'Account',
      light: require('@assets/light/icons/Profile/Account.svg').default,
      dark: require('@assets/dark/icons/Profile/Account.svg').default,
    },
  ];
  const results = useSVG(svgArray);
  const DefaultPermissions = results.DefaultPermissions;
  const Blocked = results.Blocked;
  const Legal = results.Legal;
  const Backup = results.Backup;
  const Appearance = results.Appearance;
  const AngleRight = results.AngleRight;
  const RoundPencil = results.RoundPencil;
  const Account = results.Account;

  async function onSavePicture(newProfilePicAttr: FileAttributes) {
    await setNewProfilePicture(newProfilePicAttr);
  }

  const onSaveName = async (newName: string) => {
    await updateProfileName(newName);
  };

  const handleVersionTap = () => {
    const newTapCount = versionTapCount + 1;
    if (newTapCount >= 5) {
      if (isDeveloperMode) {
        turnOffDeveloperMode();
      } else {
        turnOnDeveloperMode();
      }
      setVersionTapCount(0); // Reset count
    } else {
      setVersionTapCount(newTapCount);
    }
  };

  return (
    <>
      <CustomStatusBar
        backgroundColor={colors.background2}
        theme={colors.theme}
      />
      <GestureSafeAreaView backgroundColor={colors.background2}>
        <GenericTitle title="Settings" />
        <ScrollView contentContainerStyle={styles.profile}>
          <AvatarBox
            profileUri={profilePicAttr.fileUri}
            avatarSize="m"
            onPress={() => setOpenEditAvatarModal(true)}
          />
          <Pressable
            onPress={() => setEditingName(true)}
            style={styles.bottomCard}>
            <NumberlessText
              fontSizeType={FontSizeType.xl}
              fontWeight={FontWeight.sb}
              textColor={colors.text.title}>
              {newName}
            </NumberlessText>
            <RoundPencil width={20} height={20} />
          </Pressable>
          <NumberlessText
            fontSizeType={FontSizeType.s}
            fontWeight={FontWeight.rg}
            textColor={colors.text.subtitle}
            style={styles.bottomCard}>
            Your name and profile picture are private — only visible to you
            and your chosen contacts. We don't see or store them.
          </NumberlessText>

          <Pressable
            onPress={() => navigation.navigate('DefaultPermissionsScreen')}
            style={StyleSheet.compose(
              {
                borderBottomColor: colors.stroke,
                borderBottomWidth: 0.5,
                marginTop: Spacing.l,
              },
              styles.row,
            )}>
            <View style={styles.card}>
              <DefaultPermissions />
              <NumberlessText
                fontSizeType={FontSizeType.l}
                fontWeight={FontWeight.md}
                textColor={colors.text.title}>
                Default Permissions
              </NumberlessText>
            </View>
            <AngleRight />
          </Pressable>
          <Pressable
            onPress={() => setOpenThemeBottomSheet(true)}
            style={StyleSheet.compose(
              {
                borderBottomColor: colors.stroke,
                borderBottomWidth: 0.5,
              },
              styles.row,
            )}>
            <View style={styles.card}>
              <Appearance />
              <NumberlessText
                fontSizeType={FontSizeType.l}
                fontWeight={FontWeight.md}
                textColor={colors.text.title}>
                Appearance
              </NumberlessText>
            </View>

            <View style={styles.card}>
              <NumberlessText
                style={{
                  backgroundColor: colors.lowAccentColors.tealBlue,
                  paddingHorizontal: Spacing.s,
                  paddingVertical: 4,
                  borderRadius: 20,
                }}
                fontSizeType={FontSizeType.s}
                fontWeight={FontWeight.rg}
                textColor={colors.boldAccentColors.tealBlue}>
                {selectedTheme}
              </NumberlessText>
              <AngleRight />
            </View>
          </Pressable>
          <Pressable
            onPress={() => navigation.push('CreateBackupScreen')}
            style={StyleSheet.compose(
              {
                borderBottomColor: colors.stroke,
                borderBottomWidth: 0.5,
              },
              styles.row,
            )}>
            <View style={styles.card}>
              <Backup />
              <NumberlessText
                fontSizeType={FontSizeType.l}
                fontWeight={FontWeight.md}
                textColor={colors.text.title}>
                Backup
              </NumberlessText>
            </View>
            <View style={styles.card}>
              <NumberlessText
                style={{
                  backgroundColor: colors.lowAccentColors.darkGreen,
                  paddingHorizontal: Spacing.s,
                  paddingVertical: 4,
                  borderRadius: 20,
                }}
                fontSizeType={FontSizeType.s}
                fontWeight={FontWeight.rg}
                textColor={colors.boldAccentColors.darkGreen}>
                Last Backup: {lastBackupTime ? getChatTileTimestamp(lastBackupTime) : 'Never'}
              </NumberlessText>
              <AngleRight />
            </View>
          </Pressable>
          <Pressable
            onPress={() => navigation.push('BlockedContacts')}
            style={StyleSheet.compose(
              {
                borderBottomColor: colors.stroke,
                borderBottomWidth: 0.5,
              },
              styles.row,
            )}>
            <View style={styles.card}>
              <Blocked />
              <NumberlessText
                fontSizeType={FontSizeType.l}
                fontWeight={FontWeight.md}
                textColor={colors.text.title}>
                Blocked Contacts
              </NumberlessText>
            </View>
            <AngleRight />
          </Pressable>
          <Pressable
            onPress={() => navigation.push('AccountSettings')}
            style={StyleSheet.compose(
              {
                borderBottomColor: colors.stroke,
                borderBottomWidth: 0.5,
              },
              styles.row,
            )}>
            <View style={styles.card}>
              <Account />
              <NumberlessText
                fontSizeType={FontSizeType.l}
                fontWeight={FontWeight.md}
                textColor={colors.text.title}>
                Account settings
              </NumberlessText>
            </View>
            <AngleRight />
          </Pressable>
          <Pressable
            onPress={() => navigation.push('HelpScreen')}
            style={styles.row}>
            <View style={styles.card}>
              <Legal />
              <NumberlessText
                fontSizeType={FontSizeType.l}
                fontWeight={FontWeight.md}
                textColor={colors.text.title}>
                Legal
              </NumberlessText>
            </View>
            <AngleRight />
          </Pressable>
          <View style={styles.bottomContainer}>
            <PrimaryButton
              disabled={false}
              isLoading={false}
              onClick={() => navigation.push('GiveUsFeedbackScreen')}
              text="Give us feedback"
              theme={colors.theme}
            />
          </View>
          <Pressable onPress={handleVersionTap} style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <NumberlessText textColor={colors.text.subtitle}>Version: {DeviceInfo.getReadableVersion()}</NumberlessText>
            <DeveloperBox>
              <NumberlessText textColor={colors.text.subtitle}>Developer mode turned ON. tap 5 times to turn off.</NumberlessText>
            </DeveloperBox>
          </Pressable>
        </ScrollView>
        <EditAvatar
          localImageAttr={profilePicAttr}
          setLocalImageAttr={setProfilePicAttr}
          visible={openEditAvatarModal}
          onSave={onSavePicture}
          onClose={() => {
            setOpenEditAvatarModal(false);
          }}
        />
        <ThemeBottomsheet
          selected={selectedTheme}
          setSelected={setSelectedTheme}
          setShowThemeBottomsheet={setOpenThemeBottomSheet}
          showThemeBottomsheet={openThemeBottomSheet}
        />

        <EditName
          title={'Edit your name'}
          visible={editingName}
          name={newName}
          onSave={onSaveName}
          setName={setNewName}
          onClose={() => {
            setEditingName(false);
          }}
        />
      </GestureSafeAreaView>
    </>
  );
};

const styling = (colors: any) =>
  StyleSheet.create({
    profile: {
      backgroundColor: colors.background2,
      flexDirection: 'column',
      alignItems: 'center',
      paddingVertical: Spacing.l,
      paddingHorizontal: Spacing.l,
    },
    bottomContainer: {
      width: '100%',
      paddingVertical: Spacing.m,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      paddingVertical: Spacing.m,
    },
    bottomCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.s,
      marginTop: Spacing.m,
      textAlign: 'center',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.l,
    },
  });

export default NewProfileScreen;
