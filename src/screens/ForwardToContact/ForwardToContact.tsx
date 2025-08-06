import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import PrimaryButton from '@components/Buttons/PrimaryButton';
import MultiSelectMembersCard from '@components/Cards/MultiSelectMembersCard';
import { useColors } from '@components/colorGuide';
import { GradientScreenView } from '@components/GradientScreenView';
import SearchBar from '@components/SearchBar';
import {  Spacing } from '@components/spacingGuide';
import TopBarDescription from '@components/Text/TopBarDescription';
 
import {AppStackParamList} from '@navigation/AppStack/AppStackTypes';

import {LargeDataParams} from '@utils/Messaging/interfaces';
import LargeDataUpload from '@utils/Messaging/LargeData/LargeDataUpload';
import {mediaContentTypes} from '@utils/Messaging/Send/SendDirectMessage/senders/MediaSender';
import SendMessage from '@utils/Messaging/Send/SendMessage';
import {getConnection,getConnections} from '@utils/Storage/connections';
import {ChatType,ConnectionInfo} from '@utils/Storage/DBCalls/connections';
import {getGroupMessage} from '@utils/Storage/groupMessages';
import {getMessage} from '@utils/Storage/messages';
import {copyToTmp} from '@utils/Storage/StorageRNFS/sharedFileHandlers';


import SelectedMembersCard from '../../components/Cards/SelectedMembersCard';

type Props = NativeStackScreenProps<AppStackParamList, 'ForwardToContact'>;

const ForwardToContact = ({route, navigation}: Props) => {
  const {messages = [], chatId} = route.params;
  //for loader used in the screen
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [allMembers, setAllMembers] = useState<ConnectionInfo[]>([]);
  const [viewableMembers, setViewableMembers] = useState<ConnectionInfo[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  //search text
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    (async () => {
      const connections = await getConnections(true);
      setAllMembers(connections);
      setViewableMembers(connections);
      setIsMembersLoading(false);
    })();
  }, []);

  useMemo(() => {
    const filteredData = allMembers.filter(item => {
      return item.name.toLowerCase().includes(searchText.toLowerCase());
    });
    setViewableMembers(filteredData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  async function getSelectedConnections(selectedMembers: Set<string>): Promise<ConnectionInfo[]> {
    const chatIds = Array.from(selectedMembers);
  
    const connections = await Promise.all(
      chatIds.map(async (chatId) => {
        try {
          return await getConnection(chatId);
        } catch (error) {
          console.error(`Failed to load connection for chatId: ${chatId}`, error);
          return null;
        }
      })
    );
  
    return connections.filter((conn): conn is ConnectionInfo => conn !== null);
  }

  const onForward = async () => {
    const membersWithInfo = await getSelectedConnections(selectedMembers);
    setLoading(true);
    try {
      const getMessageFromChat =
        (await getConnection(chatId)).connectionType === ChatType.group
          ? getGroupMessage
          : getMessage;
      for (const id of messages) {
        const msg = await getMessageFromChat(chatId, id);
        if (msg) {
          if (mediaContentTypes.includes(msg.contentType)) {
            // Pre upload data to prevent iteration
            //forward screen fileUri to be forwarded is always from app storage.
            //create copy of file in tmp dir.
            const tmpUri = await copyToTmp(
              (msg.data as LargeDataParams).fileUri,
            );
            //then upload and send.
            const mediaData = msg.data as LargeDataParams;
            mediaData.fileUri = tmpUri;
            const uploader = new LargeDataUpload(
              mediaData.fileUri || 'Bad file uri',
              mediaData.fileName,
              mediaData.fileType || 'unused filetype',
            );
            await uploader.upload();
            const {mediaId, key} = uploader.getMediaIdAndKey();
            mediaData.mediaId = mediaId;
            mediaData.key = key;
          }
          for (const mbr of membersWithInfo) {
            const sender = new SendMessage(
              mbr.chatId,
              msg.contentType,
              msg.data,
            );
            sender.send();
          }
        }
      }
    } catch (error) {
      console.error('Error forwarding', error);
    }
    setLoading(false);

    navigation.goBack();
  };

  const Colors = useColors();
  const styles = styling(Colors);


  const renderContent = () => {
    return (
      <View style={styles.scrollContainer}>
        <TopBarDescription
          theme={Colors.theme}
          description="Select the chats to forward to"
        />
        <View style={styles.scrollableElementsParent}>
          {isMembersLoading ? (
            <View style={{ paddingTop: Spacing.xxxxl, justifyContent: 'flex-start', alignItems: 'center', height: 600 }}>
              <ActivityIndicator color={Colors.text.subtitle} />
            </View>
          ) : (
            <View style={styles.card}>
              <SelectedMembersCard
              setSelectedMembers={setSelectedMembers}
              members={selectedMembers}/>
              <SearchBar
                searchText={searchText}
                setSearchText={setSearchText}
              />
            <MultiSelectMembersCard
                setSelectedMembers={setSelectedMembers}
                members={viewableMembers}
                selectedMembers={selectedMembers}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <GradientScreenView 
      color={Colors}
      title={ `Forward to chats${selectedMembers.size > 0 ? ` (${selectedMembers.size})` : ''}`}
      onBackPress={() => navigation.goBack()}
      modifyNavigationBarColor={true}
      bottomNavigationBarColor={Colors.black}>
      <FlatList
        data={[1]}
        renderItem={renderContent}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.buttonWrapper}>
        <PrimaryButton
          isLoading={loading}
          disabled={selectedMembers.size === 0}
          theme={Colors.theme}
          text={"Forward to selected"}
          onClick={onForward}
        />
      </View>
    </GradientScreenView>
  );
};

const styling = (color: any) =>
  StyleSheet.create({
    buttonWrapper: {
      padding: Spacing.l,
      backgroundColor: color.surface,
    },
    scrollContainer: {
      backgroundColor: color.background,
    },
    scrollableElementsParent: {
      marginTop: -Spacing.xl,
      paddingBottom: Spacing.l,
      gap: Spacing.l,
    },
    card: { marginHorizontal: Spacing.l, gap: Spacing.l },
  });


export default ForwardToContact;
