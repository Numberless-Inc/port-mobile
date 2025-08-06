import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import PrimaryButton from '@components/Buttons/PrimaryButton';
import MultiSelectMembersCard from '@components/Cards/MultiSelectMembersCard';
import SelectedMembersCard from '@components/Cards/SelectedMembersCard';
import { useColors } from '@components/colorGuide';
import { GradientScreenView } from '@components/GradientScreenView';
import SearchBar from '@components/SearchBar';
import {  Spacing } from '@components/spacingGuide';
import TopBarDescription from '@components/Text/TopBarDescription';

import { DEFAULT_AVATAR } from '@configs/constants';

import { AppStackParamList } from '@navigation/AppStack/AppStackTypes';

import { getDirectChats } from '@utils/DirectChats';
import { ContentType } from '@utils/Messaging/interfaces';
import SendMessage from '@utils/Messaging/Send/SendMessage';
import { GroupSuperPort } from '@utils/Ports/GroupSuperPorts/GroupSuperPort';
import { ConnectionInfo } from '@utils/Storage/DBCalls/connections';


type Props = NativeStackScreenProps<AppStackParamList, 'InviteGroupMembers'>;

const InviteGroupMembers = ({ route, navigation }: Props) => {
  const { chatId, groupData, fromNewGroup } = route.params;

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [allMembers, setAllMembers] = useState<ConnectionInfo[]>([]);
  const [viewableMembers, setViewableMembers] = useState<ConnectionInfo[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const connections = await getDirectChats();
      setAllMembers(connections);
      setViewableMembers(connections);
      setIsMembersLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMemo(() => {
    if (allMembers) {
      // Filter the contacts based on the search text
      if (searchText.trim() === '') {
        setViewableMembers(allMembers);
      } else {
        const filteredData = allMembers.filter(item => {
          return item.name
            .toLowerCase()
            .includes(searchText.toLowerCase());
        });
        setViewableMembers(filteredData);
      }
    }
  }, [searchText, allMembers]);

  const Colors = useColors();
  const styles = styling(Colors);

  const onAddMembers = async () => {
    setIsLoading(true);
    try {
      //create a group superport
      const groupSuperPort = await GroupSuperPort.generator.create(groupData.groupId);
      const link = await groupSuperPort.getShareableLink();
      if (link) {
        for (const chatId of selectedMembers) {
          try {
            const sender = new SendMessage(chatId, ContentType.text, {
              text: `Join the group "${groupData.name}" by clicking the link below: ${link}`,
            });
            await sender.send();
          } catch (error) {
            console.log('error in sending message to member: ', error);
          }
        }
      }
    } catch (error) {
      console.log('error in creating group superport: ', error);
    }
    setIsLoading(false);
    //navigate to group chat
    if (fromNewGroup) {
      navigation.replace('GroupChat', {
        chatId: chatId,
        isConnected: !groupData.disconnected,
        profileUri: groupData.groupPicture || DEFAULT_AVATAR,
        name: groupData.name,
      });
    } else {
      navigation.goBack();
    }
  }

  const renderContent = () => {
    return (
      <View style={styles.scrollContainer}>
        <TopBarDescription
          theme={Colors.theme}
          description="Selected members will be sent a link to join the group."
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
      title={`Invite members to ${groupData.name}${selectedMembers.size > 0 ? ` (${selectedMembers.size})` : ''}`}
      onBackPress={fromNewGroup ? undefined : () => navigation.goBack()}
      onSkipPress={fromNewGroup ? () => navigation.replace('GroupChat', {
        chatId: chatId,
        isConnected: !groupData.disconnected,
        profileUri: groupData.groupPicture || DEFAULT_AVATAR,
        name: groupData.name,
      }) : undefined}
      modifyNavigationBarColor={true}
      bottomNavigationBarColor={Colors.black}>
      <FlatList
        data={[1]}
        renderItem={renderContent}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.buttonWrapper}>
        <PrimaryButton
          isLoading={isLoading}
          disabled={selectedMembers.size === 0}
          theme={Colors.theme}
          text={'Invite members'}
          onClick={onAddMembers}
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

export default InviteGroupMembers;
