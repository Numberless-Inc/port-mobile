import React from 'react';
import {FlatList, Pressable, StyleSheet, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import {AvatarBox} from '@components/Reusable/AvatarBox/AvatarBox';

import {ContentType} from '@utils/Messaging/interfaces';
import {isGroupChat} from '@utils/Storage/connections';
import {MediaEntry} from '@utils/Storage/DBCalls/media';
import {getGroupMessage} from '@utils/Storage/groupMessages';
import {getMessage} from '@utils/Storage/messages';
import {getSafeAbsoluteURI} from '@utils/Storage/StorageRNFS/sharedFileHandlers';

import Play from '@assets/icons/videoPlay.svg';

import GradientCard from './Cards/GradientCard';
import { useColors } from './colorGuide';
import { Spacing } from './spacingGuide';
import useSVG from './svgGuide';

const SharedMediaCard = ({
  chatId,
  media,
}: {
  chatId: string;
  media: MediaEntry[];
}) => {
  const navigation = useNavigation();
  const Colors = useColors();
  const svgArray = [
    // 1.NotificationOutline
    {
      assetName: 'RightChevron',
      light: require('@assets/light/icons/navigation/AngleRight.svg').default,
      dark: require('@assets/dark/icons/navigation/AngleRight.svg').default,
    },
  ];
  const results = useSVG(svgArray);

  const RightChevron = results.RightChevron;
  const renderSelectedPhoto = ({item}: {item: MediaEntry}) => {
    const onClickMedia = async item => {
      const isGroup = await isGroupChat(item.chatId);
      const media = isGroup
        ? await getGroupMessage(item.chatId, item.messageId)
        : await getMessage(item.chatId, item.messageId);
      if (media) {
        // On navigating back, we want to return to this screen, so push the media viewer onto the stack
        navigation.push('MediaViewer', {
          isGroup: isGroup,
          message: media,
        });
      }
    };
    return (
      <View
        key={item.mediaId}
        style={{marginRight: Spacing.s}}>
        <AvatarBox
          avatarSize="i"
          onPress={() => {
            onClickMedia(item);
          }}
          profileUri={
            item.type === ContentType.video && item.previewPath != undefined
              ? getSafeAbsoluteURI(item.previewPath, 'cache')
              : getSafeAbsoluteURI(item.filePath, 'doc')
          }
        />
        {item.type === ContentType.video && (
          <Play
            style={{
              height: 40,
              width: 40,
              position: 'absolute',
              top: 4,
              left: 4,
            }}
          />
        )}
      </View>
    );
  };

  return (
    <GradientCard
      style={{
        paddingVertical: Spacing.l,
        paddingHorizontal: Spacing.l,
      }}>
      <View style={styles.headerWrapper}>
        <NumberlessText
          textColor={Colors.text.title}
          fontWeight={FontWeight.sb}
          fontSizeType={FontSizeType.l}>
          Shared media
        </NumberlessText>
        <Pressable
          /**
           * On navigating back, we want to return o the settings page, so push this onto the stack
           */
          onPress={() => navigation.push('SharedMedia', {chatId: chatId})}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <NumberlessText
            style={{
              color: Colors.text.title,
              paddingRight: 4,
            }}
            fontWeight={FontWeight.rg}
            fontSizeType={FontSizeType.m}>
            See all
          </NumberlessText>
          <RightChevron width={20} height={20} />
        </Pressable>
      </View>
      <View style={{marginTop: 12}}>
        {media.length > 0 ? (
          <FlatList
            data={media.slice(0, 10)}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            horizontal={true}
            renderItem={renderSelectedPhoto}
          />
        ) : (
          <View style={styles.noSharedmediaWrapper}>
            <NumberlessText
              fontSizeType={FontSizeType.s}
              fontWeight={FontWeight.rg}
              textColor={Colors.text.title}
              style={styles.noSharedMediaText}>
              No shared media
            </NumberlessText>
          </View>
        )}
      </View>
    </GradientCard>
  );
};
const styles = StyleSheet.create({
  noSharedmediaWrapper: {
    alignSelf: 'center',
    marginTop: Spacing.s
  },
  noSharedMediaText: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    textAlign: 'center',
  },
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default SharedMediaCard;
