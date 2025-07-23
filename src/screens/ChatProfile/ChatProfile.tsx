import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';

import {useFocusEffect} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import { useColors } from '@components/colorGuide';
import {CommonGroups} from '@components/CommonGroups';
import { screen} from '@components/ComponentUtils';
import {CustomStatusBar} from '@components/CustomStatusBar';
import { GestureSafeAreaView } from '@components/GestureSafeAreaView';
import Notes from '@components/Notes';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import {AvatarBox} from '@components/Reusable/AvatarBox/AvatarBox';
import ProfilePictureBlurViewModal from '@components/Reusable/BlurView/ProfilePictureBlurView';
import AddFolderBottomsheet from '@components/Reusable/BottomSheets/AddFolderBottomsheet';
import ConfirmationBottomSheet from '@components/Reusable/BottomSheets/ConfirmationBottomSheet';
import EditName from '@components/Reusable/BottomSheets/EditName';
import PrimaryButton from '@components/Reusable/LongButtons/PrimaryButton';
import SecondaryButton from '@components/Reusable/LongButtons/SecondaryButton';
import UserInfoTopbar from '@components/Reusable/TopBars/UserInfoTopbar';
import SharedMediaCard from '@components/SharedMediaCard';
import { Spacing } from '@components/spacingGuide';
import useSVG from '@components/svgGuide';

import {
  DEFAULT_AVATAR,
  DEFAULT_NAME,
  defaultFolderInfo,
  safeModalCloseDuration,
} from '@configs/constants';

import {AppStackParamList} from '@navigation/AppStack/AppStackTypes';

import DirectChat from '@utils/DirectChats/DirectChat';
import { jsonToUrl } from '@utils/JsonToUrl';
import { ContactPort } from '@utils/Ports/ContactPorts/ContactPort';
import * as storage from '@utils/Storage/blockUsers';
import {getConnection} from '@utils/Storage/connections';
import {getContact} from '@utils/Storage/contacts';
import {FolderInfo} from '@utils/Storage/DBCalls/folders';
import {MediaEntry} from '@utils/Storage/DBCalls/media';
import {getAllFolders} from '@utils/Storage/folders';
import {getImagesAndVideos} from '@utils/Storage/media';
import {deleteAllMessagesInChat} from '@utils/Storage/messages';
import {getChatTileTimestamp, wait} from '@utils/Time';

import Alert from '@assets/icons/Alert.svg';

import { ToastType, useToast } from 'src/context/ToastContext';


type Props = NativeStackScreenProps<AppStackParamList, 'ChatProfile'>;

const ChatProfile = ({route, navigation}: Props) => {
  const {chatId, chatData} = route.params;
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [showUserInfoInTopbar, setShowUserInfoInTopbar] = useState(false);
  const userAvatarViewRef = useRef<View>(null);
  const [displayName, setDisplayName] = useState<string>(
    chatData.name || DEFAULT_NAME,
  );
  const displayPic = chatData.displayPic || DEFAULT_AVATAR;
  const [showAddFolderModal, setShowAddFolderModal] = useState<boolean>(false);

  const {showToast} = useToast();
  const [editingName, setEditingName] = useState(false);
  const [confirmSheet, setConfirmSheet] = useState(false);
  const [confirmSheetDelete, setConfirmSheetDelete] = useState(false);
  const [confirmSheetHistoryDelete, setConfirmSheetHistoryDelete] =
    useState(false);
  const [confirmBlockUserSheet, setConfirmBlockUserSheet] = useState(false);
  const pairHash = chatData.pairHash;
  const [isBlocked, setIsBlocked] = useState(false);

  const [note, setNote] = useState<string>(chatData.notes || '');

  const [connected, setConnected] = useState(!chatData.disconnected);
  const [focusProfilePicture, setFocusProfilePicture] =
    useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderInfo>({
    ...defaultFolderInfo,
  });

  const [loading, setLoading] = useState(false);

  const Colors = useColors();
  const styles = styling(Colors);

  const svgArray = [
    {
      assetName: 'ContactShareIcon',
      dark: require('@assets/light/icons/ContactShareIcon.svg').default,
      light: require('@assets/dark/icons/ContactShareIcon.svg').default,
    },
    {
      assetName: 'EditIcon',
      light: require('@assets/light/icons/Pencil.svg').default,
      dark: require('@assets/dark/icons/Pencil.svg').default,
    },
  ];
  const results = useSVG(svgArray);

  const ContactShareIcon = results.ContactShareIcon;
  const EditIcon = results.EditIcon;

  const loadMedia = async () => {
    const response = await getImagesAndVideos(chatId);
    setMedia(response);
  };
  const getNote = async () => {
    const response = await getContact(pairHash);
    setNote(response?.notes || '');
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
          await getNote();
          const userBlocked = await storage.isUserBlocked(pairHash);
          setIsBlocked(userBlocked);
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

  const onShareContactPressed = async () => {
    setLoading(true);
    try {
      const contactPortClass = await ContactPort.generator.accepted.fromPairHash(pairHash);
      const bundle = await contactPortClass.getShareableBundle();
      const link = jsonToUrl(bundle as any);
      navigation.push('ContactPortQRScreen', {
        contactName: displayName,
        profileUri: displayPic,
        contactPortClass: contactPortClass,
        bundle: bundle,
        link: link || '',
      })
    } catch (error) {
      console.error('Error in sharing contact', error);
      showToast(
        'Error in sharing contact. You may not have permissions to share this contact.',
        ToastType.error,
      );
    }
    setLoading(false);
  };

  const onSaveName = async () => {
    const chatHandler = new DirectChat(chatId);
    await chatHandler.updateName(displayName);
    setEditingName(false);
  };
  useMemo(() => {
    onSaveName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName]);

  const handleScroll = (event: NativeSyntheticEvent<ScrollViewProps>) => {
    const {contentOffset} = event.nativeEvent;
    if (contentOffset) {
      const {y} = contentOffset;
      if (y >= 120) {
        setShowUserInfoInTopbar(true);
      } else {
        setShowUserInfoInTopbar(false);
      }
    }
  };

  const blockUser = async () => {
    try {
      await storage.blockUser({
        name: displayName,
        pairHash: pairHash,
        blockTimestamp: new Date().toISOString(),
      });
      setIsBlocked(true);
    } catch {
      console.log('Error in blocking user');
    }
  };

  const unblockUser = async () => {
    try {
      await storage.unblockUser(pairHash);
      setIsBlocked(false);
    } catch {
      console.log('Error in unblocking user');
    }
  };

  const handleChatDisconnect = async (chatIdString: string) => {
    try {
      const chatHandler = new DirectChat(chatIdString);
      await chatHandler.disconnect();
      setConnected(false);
    } catch (error) {
      await wait(safeModalCloseDuration);
      showToast(
        'Error in disconnecting this chat. Please check you network connection',
        ToastType.error,
      );
    }
  };

  const onProfilePictureClick = () => {
    setFocusProfilePicture(true);
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
      <GestureSafeAreaView style={{backgroundColor: Colors.background}}>
        <UserInfoTopbar
          backgroundColor={showUserInfoInTopbar ? 'w' : 'g'}
          heading={displayName}
          avatarUri={displayPic}
          showUserInfo={showUserInfoInTopbar}
          IconRight={ContactShareIcon}
          onIconRightPress={onShareContactPressed}
          iconRightLoading={loading}
        />
        <View style={styles.mainContainer}>
          <ScrollView
            contentContainerStyle={{height: connected ? 'auto' : '100%'}}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            horizontal={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}>
            <View style={styles.avatarContainer} ref={userAvatarViewRef}>
              <AvatarBox
                onPress={() => onProfilePictureClick()}
                profileUri={displayPic}
                avatarSize="m"
              />

              <Pressable
                style={styles.nameEditHitbox}
                onPress={() => setEditingName(true)}>
                <NumberlessText
                  style={{
                    maxWidth:
                      screen.width - 2 * Spacing.l - 30,
                    marginRight: 4,
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

              <NumberlessText
                textColor={Colors.text.subtitle}
                fontSizeType={FontSizeType.s}
                fontWeight={FontWeight.rg}
              >
                {chatData.connectedOn
                  ? 'Connection since : ' +
                    getChatTileTimestamp(chatData.connectedOn)
                  : ''}
              </NumberlessText>
            </View>

            {connected ? (
              <>
               

                <Notes getNote={getNote} pairHash={pairHash} note={note} />
                <View style={styles.sharedMediaContainer}>
                  <SharedMediaCard media={media} chatId={chatId} />
                </View>
                <CommonGroups pairHash={pairHash} />
                <View style={{paddingBottom: Spacing.l,}}>
                  <NumberlessText
                    style={{
                      color: Colors.red,
                      marginTop: Spacing.l,
                    }}
                    fontSizeType={FontSizeType.l}
                    fontWeight={FontWeight.md}
                >
                    Disconnect chat?
                  </NumberlessText>
                  <NumberlessText
                    style={styles.footerDesc}
                    fontSizeType={FontSizeType.m}
                   fontWeight={FontWeight.rg}>
                    When a chat is disconnected, you can't contact the user
                    until you connect again using a new Port.
                  </NumberlessText>
                  <View style={{gap:Spacing.s,}}>
                    <PrimaryButton
                      isLoading={false}
                      disabled={false}
                      primaryButtonColor="r"
                      buttonText="Disconnect"
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
                  <Alert style={{alignSelf: 'center'}} />
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
                    Your chat has been disconnected. Deleting the chat will
                    erase all data associated with it.
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
                  <SecondaryButton
                    secondaryButtonColor="r"
                    buttonText={isBlocked ? 'Unblock contact' : 'Block contact'}
                    onClick={() => setConfirmBlockUserSheet(true)}
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
          name={displayName}
          setName={setDisplayName}
          title="Update this contact's name"
        />
        <ConfirmationBottomSheet
          visible={confirmSheet}
          onClose={() => setConfirmSheet(false)}
          onConfirm={async () => await handleChatDisconnect(chatId)}
          title={'Are you sure you want to disconnect this chat?'}
          description={
            'Disconnecting a chat will prevent further messaging. Current chat history will be saved, but you can subsequently choose to delete it.'
          }
          buttonText={'Disconnect'}
          buttonColor="r"
        />
        <ConfirmationBottomSheet
          visible={confirmSheetDelete}
          onClose={() => setConfirmSheetDelete(false)}
          onConfirm={async () => {
            try {
              const chatHandler = new DirectChat(chatId);
              await chatHandler.delete();
              navigation.popToTop();
              navigation.replace('HomeTab', {screen: 'Home'});
            } catch (error) {
              await wait(safeModalCloseDuration);
              showToast('Error in deleting this chat.', ToastType.error);
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
              await wait(safeModalCloseDuration);
              showToast('Error in deleting in history.', ToastType.error);
            }
          }}
          title={'Are you sure you want to delete chat history?'}
          description={'Deleting chat history will erase all messages.'}
          buttonText={'Delete history'}
          buttonColor="r"
        />
        <ConfirmationBottomSheet
          visible={confirmBlockUserSheet}
          onClose={() => setConfirmBlockUserSheet(false)}
          onConfirm={async () => {
            if (isBlocked) {
              await unblockUser();
            } else {
              await blockUser();
            }
          }}
          title={
            isBlocked
              ? `Are you sure you want to unblock ${displayName}?`
              : `Are you sure you want to block ${displayName}?`
          }
          description={
            isBlocked
              ? `After you unblock ${displayName}, you may connect with them over Ports or Superports.`
              : `Blocking ${displayName} will prevent them from connecting with you over Ports, Superports or contact sharing until you unblock them.`
          }
          buttonText={isBlocked ? 'Unblock contact' : 'Block contact'}
          buttonColor="r"
        />
        {focusProfilePicture && (
          <ProfilePictureBlurViewModal
            avatarUrl={displayPic}
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
      padding:Spacing.l,
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
      backgroundColor: colors.background,
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
      gap: Spacing.s
    },
    sharedMediaContainer: {
      marginBottom: Spacing.l,
      marginTop:Spacing.l,
    },
    alertwrapper: {flex: 1, justifyContent: 'center'},
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
      marginBottom: Spacing.xl,
    },
    advanceSettingsContainer: {
      marginBottom: Spacing.l,
    },
    avatarContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom:Spacing.xml,
    },
  });

export default ChatProfile;
