import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {DEFAULT_PROFILE_AVATAR_INFO} from '@configs/constants';

import {BlockedUser} from '@utils/Storage/DBCalls/blockUser';

import { useColors } from './colorGuide';
import {FontSizeType, FontWeight, NumberlessText} from './NumberlessText';
import {AvatarBox} from './Reusable/AvatarBox/AvatarBox';
import { Spacing } from './spacingGuide';



interface BlockedContactProps extends BlockedUser {
  isLast: boolean;
  isBlocked: boolean;
  onPressAction: (user: BlockedUser) => void;
}

const BlockedContactTile = ({
  name,
  pairHash,
  isLast,
  isBlocked,
  onPressAction,
}: BlockedContactProps) => {
  const Colors = useColors();
  const styles = styling(isLast, Colors);

  return (
    <Pressable onPress={() => onPressAction({name, pairHash})} style={styles.card}>
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
          {isBlocked ? 'Unblock' : 'Block'}
        </NumberlessText>
      </View>
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
