import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {useFocusEffect} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {CommonGroups} from '@components/CommonGroups';
import {PortSpacing, screen} from '@components/ComponentUtils';
import {CustomStatusBar} from '@components/CustomStatusBar';
import DynamicColors from '@components/DynamicColors';
import Notes from '@components/Notes';
import {
  FontSizeType,
  FontType,
  NumberlessText,
} from '@components/NumberlessText';
import {AvatarBox} from '@components/Reusable/AvatarBox/AvatarBox';
import ProfilePictureBlurViewModal from '@components/Reusable/BlurView/ProfilePictureBlurView';
import ConfirmationBottomSheet from '@components/Reusable/BottomSheets/ConfirmationBottomSheet';
import ContactSharingBottomsheet from '@components/Reusable/BottomSheets/ContactSharingBottomsheet';
import EditName from '@components/Reusable/BottomSheets/EditName';
import PrimaryButton from '@components/Reusable/LongButtons/PrimaryButton';
import UserInfoTopbar from '@components/Reusable/TopBars/UserInfoTopbar';
import {SafeAreaView} from '@components/SafeAreaView';

import {DEFAULT_AVATAR, DEFAULT_NAME, TOPBAR_HEIGHT} from '@configs/constants';

import {AppStackParamList} from '@navigation/AppStack/AppStackTypes';

import { jsonToUrl } from '@utils/JsonToUrl';
import { ContactPort } from '@utils/Ports/ContactPorts/ContactPort';
import * as storage from '@utils/Storage/blockUsers';
import {updateContact} from '@utils/Storage/contacts';
import {ChatType} from '@utils/Storage/DBCalls/connections';
import useDynamicSVG from '@utils/Themes/createDynamicSVG';
import {getChatTileTimestamp} from '@utils/Time';

import Alert from '@assets/icons/Alert.svg';
import EditIcon from '@assets/icons/PencilCircleAccent.svg';

import {ToastType, useToast} from 'src/context/ToastContext';

type Props = NativeStackScreenProps<AppStackParamList, 'ContactProfile'>;

const ContactProfile = ({route, navigation}: Props) => {
  const {contactInfo, chatId, chatData} = route.params;
  const showUserInfoInTopbar = false;
  const userAvatarViewRef = useRef<View>(null);
  const [displayName, setDisplayName] = useState<string>(
    contactInfo.name || DEFAULT_NAME,
  );
  const displayPic = contactInfo.displayPic || DEFAULT_AVATAR;

  const {showToast} = useToast();
  const [editingName, setEditingName] = useState(false);
  const [confirmBlockUserSheet, setConfirmBlockUserSheet] = useState(false);
  const pairHash = contactInfo.pairHash;
  const [isBlocked, setIsBlocked] = useState(false);

  const connected = chatId && !chatData?.disconnected;
  const [focusProfilePicture, setFocusProfilePicture] =
    useState<boolean>(false);
  const [isSharingContact, setIsSharingContact] = useState(false);
  const Colors = DynamicColors();
  const styles = styling(Colors);

  const svgArray = [
    {
      assetName: 'RightChevron',
      light: require('@assets/light/icons/navigation/AngleRight.svg').default,
      dark: require('@assets/dark/icons/navigation/AngleRight.svg').default,
    },
    {
      assetName: 'ContactShareIcon',
      dark: require('@assets/light/icons/ContactShareIcon.svg').default,
      light: require('@assets/dark/icons/ContactShareIcon.svg').default,
    },
  ];
  const results = useDynamicSVG(svgArray);

  const ContactShareIcon = results.ContactShareIcon;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
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

  const onSaveName = async () => {
    await updateContact(pairHash, {name: displayName});
    setEditingName(false);
  };
  useMemo(() => {
    onSaveName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName]);

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

  const onProfilePictureClick = () => {
    setFocusProfilePicture(true);
  };

  const [loading, setLoading] = useState(false);

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

  return (
    <>
      <CustomStatusBar
        backgroundColor={
          showUserInfoInTopbar
            ? Colors.primary.surface
            : Colors.primary.background
        }
      />
      <SafeAreaView style={{backgroundColor: Colors.primary.background}}>
        <UserInfoTopbar
          isConnected={connected}
          backgroundColor={showUserInfoInTopbar ? 'w' : 'g'}
          heading={displayName}
          avatarUri={displayPic}
          showUserInfo={showUserInfoInTopbar}
          IconRight={ContactShareIcon}
          onIconRightPress={onShareContactPressed}
          iconRightLoading={loading}
        />
        <ScrollView style={styles.mainContainer}>
          <KeyboardAvoidingView style={{height: connected ? 'auto' : '100%'}}>
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
                      screen.width - 2 * PortSpacing.secondary.uniform - 30,
                    marginRight: 4,
                  }}
                  textColor={Colors.labels.text}
                  fontSizeType={FontSizeType.xl}
                  fontType={FontType.sb}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {displayName}
                </NumberlessText>
                <EditIcon height={20} width={20} />
              </Pressable>
              {chatData && (
                <NumberlessText
                  textColor={Colors.text.subtitle}
                  fontSizeType={FontSizeType.s}
                  fontType={FontType.rg}>
                  {chatData.connectedOn
                    ? 'Connection since : ' +
                      getChatTileTimestamp(chatData.connectedOn)
                    : ''}
                </NumberlessText>
              )}
            </View>
            <Notes pairHash={pairHash} note={contactInfo.notes || ''} />
            <View style={{marginVertical: PortSpacing.secondary.top}}>
              <CommonGroups pairHash={pairHash} />
            </View>

            {chatId && connected ? (
              <View
                style={{
                  marginTop: PortSpacing.secondary.top,
                }}>
                <PrimaryButton
                  primaryButtonColor="p"
                  buttonText="Go to chat"
                  isLoading={false}
                  disabled={false}
                  onClick={async () => {
                    navigation.popToTop();
                    navigation.replace('HomeTab', {
                      screen: 'Home',
                      params: {
                        initialChatType: ChatType.direct,
                        chatData: {
                          chatId,
                          isConnected: true,
                          profileUri: contactInfo.displayPic,
                          name: contactInfo.name,
                          isAuthenticated: true, // We know this because of of the order of contact creation and authentication in the chat creation process
                        },
                      },
                    });
                  }}
                />
                <View
                  style={{
                    paddingTop: PortSpacing.secondary.top,
                  }}>
                  <NumberlessText
                    fontSizeType={FontSizeType.l}
                    textColor={Colors.text.primary}
                    fontType={FontType.sb}>
                    Contacts in Port are completely identifierless
                  </NumberlessText>
                  <NumberlessText
                    fontSizeType={FontSizeType.m}
                    textColor={Colors.text.primary}
                    fontType={FontType.it}>
                    No sensitive personal information or personal identifiers
                    are used to connect with any contact over Port. This means
                    that you never have to worry about your contact being shared
                    without your permission, being spammed incessantly, or
                    having people circumvent being blocked by using another app.
                  </NumberlessText>
                </View>
              </View>
            ) : !connected ? (
              <View style={styles.disconnectedwrapper}>
                <View style={styles.alertwrapper}>
                  <Alert style={{alignSelf: 'center'}} />
                  <NumberlessText
                    style={{
                      alignSelf: 'center',
                      textAlign: 'center',
                      width: '100%',
                      marginVertical: PortSpacing.secondary.top,
                    }}
                    textColor={Colors.text.subtitle}
                    fontSizeType={FontSizeType.m}
                    fontType={FontType.rg}>
                    You do not have an active chat with {contactInfo.name}. If
                    you block them they cannot connect with you using Ports,
                    Superports or contact sharing.
                  </NumberlessText>
                </View>
                <View
                  style={{
                    gap: 10,
                    marginBottom: PortSpacing.intermediate.top,
                  }}>
                  <PrimaryButton
                    primaryButtonColor={isBlocked ? 'w' : 'r'}
                    buttonText={isBlocked ? 'Unblock contact' : 'Block contact'}
                    onClick={() => setConfirmBlockUserSheet(true)}
                    isLoading={false}
                    disabled={false}
                  />
                </View>
              </View>
            ) : (
              <></>
            )}
          </KeyboardAvoidingView>
        </ScrollView>
        <EditName
          visible={editingName}
          onClose={() => setEditingName(false)}
          name={displayName}
          setName={setDisplayName}
          title="Update this contact's name"
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
        {isSharingContact && (
          <ContactSharingBottomsheet
            visible={isSharingContact}
            onClose={() => setIsSharingContact(false)}
            contactShareParams={{name: displayName, pairHash: pairHash}}
          />
        )}
        {focusProfilePicture && (
          <ProfilePictureBlurViewModal
            avatarUrl={displayPic}
            onClose={() => setFocusProfilePicture(false)}
          />
        )}
      </SafeAreaView>
    </>
  );
};

const styling = (colors: any) =>
  StyleSheet.create({
    mainContainer: {
      padding: PortSpacing.secondary.uniform,
      paddingTop: 0,
      paddingBottom: 0,
      flex: 1,
    },
    topbarAcontainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: PortSpacing.secondary.uniform,
      alignItems: 'center',
      backgroundColor: colors.primary.surface,
      height: TOPBAR_HEIGHT,
    },
    backButton: {
      position: 'absolute',
      left: 16,
    },
    disconnectedwrapper: {
      flexDirection: 'column',
      justifyContent: 'center',
      height: '100%',
      flex: 1,
    },
    nameEditHitbox: {
      marginTop: PortSpacing.secondary.top,
      flexDirection: 'row',
      alignItems: 'center',
    },
    alertwrapper: {flex: 1, justifyContent: 'center'},
    avatarContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: PortSpacing.primary.bottom,
    },
  });

export default ContactProfile;
