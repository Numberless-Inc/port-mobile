import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import GradientCard from '@components/Cards/GradientCard';
import { useColors } from '@components/colorGuide';
import { screen } from '@components/ComponentUtils';
import { CustomStatusBar } from '@components/CustomStatusBar';
import { GestureSafeAreaView } from '@components/GestureSafeAreaView';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import { AvatarBox } from '@components/Reusable/AvatarBox/AvatarBox';
import ProfilePictureBlurViewModal from '@components/Reusable/BlurView/ProfilePictureBlurView';
import AddFolderBottomsheet from '@components/Reusable/BottomSheets/AddFolderBottomsheet';
import ConfirmationBottomSheet from '@components/Reusable/BottomSheets/ConfirmationBottomSheet';
import EditAvatar from '@components/Reusable/BottomSheets/EditAvatar';
import EditName from '@components/Reusable/BottomSheets/EditName';
import PrimaryButton from '@components/Reusable/LongButtons/PrimaryButton';
import SecondaryButton from '@components/Reusable/LongButtons/SecondaryButton';
import GroupInfoTopbar from '@components/Reusable/TopBars/GroupInfoTopbar';
import SharedMediaCard from '@components/SharedMediaCard';
import { Spacing } from '@components/spacingGuide';
import useSVG from '@components/svgGuide';

import {
  DEFAULT_GROUP_NAME,
  DEFAULT_PROFILE_AVATAR_INFO,
  GROUP_MEMBER_LIMIT,
  defaultFolderInfo,
  safeModalCloseDuration,
} from '@configs/constants';

import { AppStackParamList } from '@navigation/AppStack/AppStackTypes';

import AddMembersCard from '@screens/GroupsV2/components/AddMembersCard';
import Description from '@screens/GroupsV2/components/Description';
import GroupPortInviteCard from '@screens/GroupsV2/components/GroupPortInviteCard';

import Group from '@utils/Groups/GroupClass';
import { ContentType } from '@utils/Messaging/interfaces';
import SendMessage from '@utils/Messaging/Send/SendMessage';
import { GroupSuperPort } from '@utils/Ports/GroupSuperPorts/GroupSuperPort';
import { getConnection } from '@utils/Storage/connections';
import { FolderInfo } from '@utils/Storage/DBCalls/folders';
import { MediaEntry } from '@utils/Storage/DBCalls/media';
import { getAllFolders } from '@utils/Storage/folders';
import { deleteAllMessagesInChat } from '@utils/Storage/groupMessages';
import { getImagesAndVideos } from '@utils/Storage/media';
import { FileAttributes } from '@utils/Storage/StorageRNFS/interfaces';
import { isAvatarUri } from '@utils/Storage/StorageRNFS/sharedFileHandlers';
import { getChatTileTimestamp, wait } from '@utils/Time';

import Alert from '@assets/icons/Alert.svg';

import { useTheme } from 'src/context/ThemeContext';
import { ToastType, useToast } from 'src/context/ToastContext';


type Props = NativeStackScreenProps<AppStackParamList, 'GroupProfile'>;

const GroupProfile = ({ route, navigation }: Props) => {
  const { chatId, chatData, members } = route.params;
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [showUserInfoInTopbar, setShowUserInfoInTopbar] = useState(false);
  const userAvatarViewRef = useRef<View>(null);
  const [displayName, setDisplayName] = useState<string>(
    chatData.name || DEFAULT_GROUP_NAME,
  );
  const [displayPic, setDisplayPic] = useState<FileAttributes>(
    chatData.groupPicture
      ? {
        fileUri: chatData.groupPicture,
        fileName: 'redundant',
        fileType: 'redundant',
      }
      : DEFAULT_PROFILE_AVATAR_INFO,
  );
  const [showAddFolderModal, setShowAddFolderModal] = useState<boolean>(false);

  const { showToast } = useToast();
  const [editingName, setEditingName] = useState(false);
  const [confirmSheet, setConfirmSheet] = useState(false);
  const [confirmSheetDelete, setConfirmSheetDelete] = useState(false);
  const [confirmSheetHistoryDelete, setConfirmSheetHistoryDelete] =
    useState(false);

  const [connected, setConnected] = useState(!chatData.disconnected);
  const [focusProfilePicture, setFocusProfilePicture] =
    useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderInfo>({
    ...defaultFolderInfo,
  });
  //to edit group picture
  const [openEditAvatarModal, setOpenEditAvatarModal] = useState(false);
  const [groupClass, setGroupClass] = useState<Group | null>(null);
  const [labelText, setLabelText] = useState<string>('');
  const Colors = useColors();
  const styles = styling(Colors);

  const svgArray = [
    // 1.NotificationOutline
    {
      assetName: 'RightChevron',
      light: require('@assets/light/icons/navigation/AngleRight.svg').default,
      dark: require('@assets/dark/icons/navigation/AngleRight.svg').default,
    },
    {
      assetName: 'EditCameraIcon',
      light: require('@assets/light/icons/EditCamera.svg').default,
      dark: require('@assets/dark/icons/EditCamera.svg').default,
    },
    {
      assetName: 'EditIcon',
      light: require('@assets/light/icons/Pencil.svg').default,
      dark: require('@assets/dark/icons/Pencil.svg').default,
    },
  ];

  const results = useSVG(svgArray);

  const RightChevron = results.RightChevron;
  const EditCameraIcon = results.EditCameraIcon;
  const EditIcon = results.EditIcon;

  useEffect(() => {
    (async () => {
      const groupHandler = await Group.load(chatId);
      setGroupClass(groupHandler);
      setLabelText(GROUP_MEMBER_LIMIT - groupHandler.getGroupMemberCount() + ' left');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMedia = async () => {
    const response = await getImagesAndVideos(chatId);
    setMedia(response);
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const connection = await getConnection(chatId);
          const folders = await getAllFolders();
          const folder = folders.find(f => f.folderId === connection.folderId);
          if (folder) {
            setSelectedFolder(folder);
          }
          await loadMedia();
        } catch (error) {
          console.log('Error running initial effect', error);
          showToast(
            'Error fetching information regarding this contact',
            ToastType.error,
          );
        }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected]),
  );

  const onSaveName = async (name?: string) => {
    if (name) {
      //update name if group admin
      await groupClass?.updateGroupData({ name: name });
      const groupData = groupClass?.getGroupData();
      if (groupData && groupData.amAdmin) {
        const sender = new SendMessage(chatId, ContentType.groupName, {
          groupName: groupData.name,
        });
        await sender.send();
      }
    }
  };

  /**
   * Save group picture
   * @param profilePicAttr
   */
  async function onSavePicture(profilePicAttr: FileAttributes) {
    const profilePic = profilePicAttr.fileUri;
    // const chatHandler = new Group(chatId);
    await groupClass?.saveGroupPicture(profilePic);
    await groupClass?.uploadGroupPicture();
    const groupData = groupClass?.getGroupData();
    if (groupData && groupData.amAdmin && groupData.groupPicture) {
      const sender = isAvatarUri(groupData.groupPicture)
        ? new SendMessage(chatId, ContentType.groupAvatar, {
          fileUri: groupData.groupPicture,
        })
        : groupData.groupPictureKey
          ? new SendMessage(chatId, ContentType.groupPicture, {
            groupPictureKey: groupData.groupPictureKey,
          })
          : null;
      if (sender) {
        await sender.send();
      }
    }
  }

  const handleScroll = (event: NativeSyntheticEvent<ScrollViewProps>) => {
    const { contentOffset } = event.nativeEvent;
    if (contentOffset) {
      const { y } = contentOffset;
      if (y >= 120) {
        setShowUserInfoInTopbar(true);
      } else {
        setShowUserInfoInTopbar(false);
      }
    }
  };

  const handleChatDisconnect = async () => {
    try {
      //handle exiting group
      await groupClass?.leaveGroup();
      setConnected(false);
    } catch (error) {
      wait(safeModalCloseDuration).then(() => {
        showToast(
          'Error in disconnecting this chat. Please check you network connection',
          ToastType.error,
        );
      });
    }
  };

  const { themeValue } = useTheme();

  const onProfilePictureClick = () => {
    setFocusProfilePicture(true);
  };

  // generates qr code from group superport class
  const onQRGeneration = async () => {
    try {
      const group = await Group.load(chatId);
      const groupSuperPortHandler = await GroupSuperPort.generator.create(
        chatData.groupId,
      );
      navigation.navigate('GroupSuperPortQRScreen', {
        chatId: chatId,
        groupData: chatData,
        memberCount: group.getGroupMemberCount(),
        bundle: await groupSuperPortHandler.getShareableBundle(),
        link: await groupSuperPortHandler.getShareableLink(),
      });
    } catch (error) {
      console.log('Error fetching group superport', error);
      showToast('Error fetching group Port. Please check your internet connection and try again.', ToastType.error);
    }
  };
  return (
    <>
      <CustomStatusBar
        backgroundColor={
          showUserInfoInTopbar
            ? Colors.surface
            : Colors.background
        }
      />
      <GestureSafeAreaView style={{ backgroundColor: Colors.background }}>
        <GroupInfoTopbar
          backgroundColor={showUserInfoInTopbar ? 'w' : 'g'}
          heading={displayName}
          avatarUri={displayPic.fileUri}
          showUserInfo={showUserInfoInTopbar}
        />
        <View style={styles.mainContainer}>
          <ScrollView
            contentContainerStyle={{ height: connected ? 'auto' : '100%' }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            horizontal={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}>
            <View style={styles.avatarContainer} ref={userAvatarViewRef}>
              <View style={styles.profilePictureHitbox}>
                <AvatarBox
                  profileUri={displayPic.fileUri}
                  avatarSize="m"
                  onPress={() => onProfilePictureClick()}
                />
                {chatData.amAdmin && (
                  <Pressable
                    onPress={() => setOpenEditAvatarModal(true)}
                    style={styles.cameraIconWrapper}>
                    <EditCameraIcon height={20} width={20} />
                  </Pressable>
                )}
              </View>
              {chatData.amAdmin ? (
                <Pressable
                  style={styles.nameEditHitbox}
                  onPress={() => setEditingName(true)}>
                  <NumberlessText
                    style={{
                      maxWidth:
                        screen.width - 2 * Spacing.l - 30,
                      marginRight: 4,
                      paddingBottom: 2,
                    }}
                    textColor={Colors.text.title}
                    fontSizeType={FontSizeType.xl}
                    fontWeight={FontWeight.sb}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {displayName}
                  </NumberlessText>
                  <EditIcon height={20} width={20} />
                </Pressable>
              ) : (
                <View style={styles.nameEditHitbox}>
                  <NumberlessText
                    style={{
                      maxWidth:
                        screen.width - 2 * Spacing.l - 30,
                      marginRight: 4,
                      paddingBottom: 2,
                    }}
                    textColor={Colors.text.title}
                    fontSizeType={FontSizeType.xl}
                    fontWeight={FontWeight.sb}

                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {displayName}
                  </NumberlessText>
                </View>
              )}

              <NumberlessText
                textColor={Colors.text.subtitle}
                fontSizeType={FontSizeType.s}
                fontWeight={FontWeight.rg}
              >
                {chatData.joinedAt
                  ? 'Member since : ' + getChatTileTimestamp(chatData.joinedAt)
                  : ''}
              </NumberlessText>
            </View>

            {connected ? (
              <>
                <View style={styles.chatSettingsContainer}>
                  <Description
                    description={chatData.description || ''}
                    chatData={chatData}
                    chatId={chatId}
                  />


                </View>
                <GradientCard style={styles.folderCard}>
                  <Pressable
                    style={styles.clickableCard}
                    onPress={() => setShowAddFolderModal(true)}>
                    <View style={styles.cardTitle}>
                      <NumberlessText
                        textColor={Colors.text.title}
                        fontSizeType={FontSizeType.l}
                        fontWeight={FontWeight.sb}
                      >
                        Chat folder
                      </NumberlessText>
                    </View>
                    <View style={styles.labelContainer}>
                      <View style={styles.labelWrapper}>
                        <NumberlessText
                          textColor={
                            selectedFolder.name === defaultFolderInfo.name
                              ? Colors.text.title
                              : themeValue === 'light'
                                ? Colors.accent
                                : Colors.text.title
                          }
                          fontSizeType={FontSizeType.m}
                          fontWeight={FontWeight.rg}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {selectedFolder.name}
                        </NumberlessText>
                      </View>
                      <RightChevron width={20} height={20} />
                    </View>
                  </Pressable>
                </GradientCard>


                <View style={styles.sharedMediaContainer}>
                  <SharedMediaCard media={media} chatId={chatId} />
                </View>
                {chatData.amAdmin && <View style={{ marginBottom: Spacing.l }}>
                  <GroupPortInviteCard onQRGeneration={onQRGeneration} labelText={labelText} />
                </View>}
                <AddMembersCard
                  chatData={chatData}
                  chatId={chatId}
                  members={members}
                />
                <View style={{ paddingBottom: Spacing.l }}>
                  <NumberlessText
                    style={{
                      color: Colors.red,
                      marginTop: Spacing.l,
                    }}
                    fontSizeType={FontSizeType.l}
                    fontWeight={FontWeight.sb}>
                    Exit group?
                  </NumberlessText>
                  <NumberlessText
                    style={styles.footerDesc}
                    fontSizeType={FontSizeType.m}
                    fontWeight={FontWeight.rg}
                  >
                    You will need to be invited again to join this group.
                  </NumberlessText>
                  <View style={{ gap: Spacing.s }}>
                    <PrimaryButton
                      isLoading={false}
                      disabled={false}
                      primaryButtonColor="r"
                      buttonText="Exit group"
                      onClick={() => {
                        setConfirmSheet(true);
                      }}
                    />
                    <SecondaryButton
                      secondaryButtonColor="r"
                      buttonText={'Delete chat history'}
                      onClick={() => setConfirmSheetHistoryDelete(true)}
                    />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.disconnectedwrapper}>
                <View style={styles.alertwrapper}>
                  <Alert style={{ alignSelf: 'center' }} />
                  <NumberlessText
                    style={{
                      alignSelf: 'center',
                      textAlign: 'center',
                      width: '100%',
                      marginTop: Spacing.l,
                    }}
                    textColor={Colors.text.subtitle}
                    fontSizeType={FontSizeType.m}
                    fontWeight={FontWeight.rg}
                  >
                    You have exited this group. Deleting the chat will erase all
                    data associated with it.
                  </NumberlessText>
                </View>
                <View
                  style={{
                    gap: 10,
                    marginBottom: Spacing.xl,
                  }}>
                  <PrimaryButton
                    isLoading={false}
                    disabled={false}
                    primaryButtonColor="r"
                    buttonText="Delete chat"
                    onClick={() => {
                      setConfirmSheetDelete(true);
                    }}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
        <AddFolderBottomsheet
          chatId={chatId}
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
          setVisible={setShowAddFolderModal}
          visible={showAddFolderModal}
        />
        <EditName
          visible={editingName}
          onClose={() => setEditingName(false)}
          onSave={(name: string) => onSaveName(name)}
          name={displayName}
          setName={setDisplayName}
          title="Update this group's name"
        />
        <EditAvatar
          visible={openEditAvatarModal}
          onSave={onSavePicture}
          localImageAttr={displayPic}
          setLocalImageAttr={setDisplayPic}
          onClose={() => {
            setOpenEditAvatarModal(false);
          }}
        />
        <ConfirmationBottomSheet
          visible={confirmSheet}
          onClose={() => setConfirmSheet(false)}
          onConfirm={async () => await handleChatDisconnect()}
          title={'Are you sure you want to exit this group?'}
          description={
            'Current chat history will be saved, but you can subsequently choose to delete it.'
          }
          buttonText={'Exit'}
          buttonColor="r"
        />
        <ConfirmationBottomSheet
          visible={confirmSheetDelete}
          onClose={() => setConfirmSheetDelete(false)}
          onConfirm={async () => {
            try {
              //delete chat
              await Group.delete(chatId);
              navigation.popToTop();
              navigation.replace('HomeTab', {
                screen: 'Home',
              });
            } catch (error) {
              wait(safeModalCloseDuration).then(() => {
                showToast('Error in deleting this chat.', ToastType.error);
              });
            }
          }}
          title={'Are you sure you want to delete this chat?'}
          description={
            'Deleting this chat will erase all data associated with it.'
          }
          buttonText={'Delete Chat'}
          buttonColor="r"
        />
        <ConfirmationBottomSheet
          visible={confirmSheetHistoryDelete}
          onClose={() => setConfirmSheetHistoryDelete(false)}
          onConfirm={async () => {
            try {
              await deleteAllMessagesInChat(chatId);
            } catch (error) {
              wait(safeModalCloseDuration).then(() => {
                showToast('Error in deleting in history.', ToastType.error);
              });
            }
          }}
          title={'Are you sure you want to delete chat history?'}
          description={'Deleting chat history will erase all messages.'}
          buttonText={'Delete history'}
          buttonColor="r"
        />
        {focusProfilePicture && (
          <ProfilePictureBlurViewModal
            avatarUrl={displayPic.fileUri}
            onClose={() => setFocusProfilePicture(false)}
          />
        )}
      </GestureSafeAreaView>
    </>
  );
};

const styling = (colors: any) =>
  StyleSheet.create({
    mainContainer: {
      padding: Spacing.l,
      paddingTop: 0,
      paddingBottom: 0,
      flex: 1,
    },
    labelContainer: {
      flexDirection: 'row',
      gap: 4,
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 1,
    },
    cardTitle: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginRight: 24,
    },
    disconnectedwrapper: {
      flexDirection: 'column',
      justifyContent: 'center',
      height: '100%',
      flex: 1,
    },
    labelWrapper: {
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 4,
      backgroundColor: colors.surface2,
    },
    folderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.l,
      paddingVertical: Spacing.l,
    },
    nameEditHitbox: {
      marginTop: Spacing.l,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    sharedMediaContainer: {
      marginBottom: Spacing.l,
      marginTop: Spacing.l,
    },
    alertwrapper: { flex: 1, justifyContent: 'center' },
    chatSettingsContainer: {
      marginBottom: Spacing.l,
    },
    clickableCard: {
      flexDirection: 'row',
      gap: 5,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    footerDesc: {
      color: colors.text.title,
      lineHeight: 16,
      marginTop: Spacing.s,
      marginBottom: Spacing.xl
    },
    advanceSettingsContainer: {
      marginBottom: Spacing.l,
    },
    avatarContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.s
    },
    profilePictureHitbox: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
    },
    cameraIconWrapper: {
      width: 32,
      bottom: -4,
      right: -4,
      height: 32,
      backgroundColor: colors.purple,
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 9,
    },
  });

export default GroupProfile;
