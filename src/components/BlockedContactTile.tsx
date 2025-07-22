import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {DEFAULT_PROFILE_AVATAR_INFO} from '@configs/constants';

import {blockUser, unblockUser} from '@utils/Storage/blockUsers';
import {BlockedUser} from '@utils/Storage/DBCalls/blockUser';


import { useColors } from './colorGuide';
import {FontSizeType, FontWeight, NumberlessText} from './NumberlessText';
import {AvatarBox} from './Reusable/AvatarBox/AvatarBox';
import ConfirmationBottomSheet from './Reusable/BottomSheets/ConfirmationBottomSheet';
import { Spacing } from './spacingGuide';

interface BlockedContactProps extends BlockedUser {
  isLast: boolean;
}
const BlockedContactTile = (user: BlockedContactProps) => {
  const {name, pairHash, isLast} = user;
  const [isBlocked, setIsBlocked] = useState(true);
  const [isSelected, setIsSelected] = useState(false);
  const [confirmBlockUserSheet, setConfirmBlockUserSheet] = useState(false);
  const onPress = async () => {
    setConfirmBlockUserSheet(p => !p);
  };
  const blockUserClicked = async () => {
    try {
      await blockUser({
        name: name,
        pairHash: pairHash,
        blockTimestamp: new Date().toISOString(),
      });
      setIsBlocked(true);
      setIsSelected(false);
    } catch {
      console.log('Error in blocking user');
    }
  };

  const unblockUserClicked = async () => {
    try {
      await unblockUser(pairHash);
      setIsBlocked(false);
      setIsSelected(true);
    } catch {
      console.log('Error in unblocking user');
    }
  };
  const Colors = useColors();
  const styles = styling(isLast, Colors);

  return (
    <Pressable onPress={() => onPress()} style={styles.card}>
      <View style={styles.row}>
        <AvatarBox
          avatarSize="s"
          profileUri={DEFAULT_PROFILE_AVATAR_INFO.fileUri}
        />
        <NumberlessText
          textColor={Colors.text.title}
          fontWeight={FontWeight.rg}
          fontSizeType={FontSizeType.m}>
          {name}
        </NumberlessText>
      </View>

<View style={styles.button}>


      <NumberlessText
        textColor={Colors.text.title}
        fontWeight={FontWeight.md}
        fontSizeType={FontSizeType.s}>
        {isSelected ? 'Block' : 'Unblock'}
      </NumberlessText>
      </View>
      <ConfirmationBottomSheet
        visible={confirmBlockUserSheet}
        onClose={() => setConfirmBlockUserSheet(false)}
        onConfirm={async () => {
          if (isBlocked) {
            await unblockUserClicked();
          } else {
            await blockUserClicked();
          }
        }}
        title={
          isBlocked
            ? `Unblock ${name}?`
            : `Block ${name}?`
        }
        description={
          isBlocked
            ? `If you unblock this contact, they will be able to send you messages and call you, based on their individual permissions.`
            : `Blocking ${name} will prevent them from connecting with you over Ports, Superports or contact sharing until you unblock them.`
        }
        buttonText={isBlocked ? 'Yes, unblock' : 'Yes, block'}
      />
    </Pressable>
  );
};

const styling = (isLast: boolean, colors: any) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.s,
      marginHorizontal: Spacing.s,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.grey,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.s,
    },
    button:{
      backgroundColor: colors.surface2,
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.xs,
      borderRadius: Spacing.s
    }
  });

export default BlockedContactTile;
