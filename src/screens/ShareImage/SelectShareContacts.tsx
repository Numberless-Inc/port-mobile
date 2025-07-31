import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';


import PrimaryButton from '@components/Buttons/PrimaryButton';
import MultiSelectMembersCard from '@components/Cards/MultiSelectMembersCard';
import SelectedMembersCard from '@components/Cards/SelectedMembersCard';
import { useColors } from '@components/colorGuide';
import { GradientScreenView } from '@components/GradientScreenView';
import SearchBar from '@components/SearchBar';
import { Height, Spacing } from '@components/spacingGuide';
import TopBarDescription from '@components/Text/TopBarDescription';

import {AppStackParamList} from '@navigation/AppStack/AppStackTypes';


import { ContentType } from '@utils/Messaging/interfaces';
import SendMessage from '@utils/Messaging/Send/SendMessage';
import { getConnection, getConnections } from '@utils/Storage/connections';
import {ConnectionInfo} from '@utils/Storage/DBCalls/connections';



type Props = NativeStackScreenProps<AppStackParamList, 'SelectShareContacts'>;

const SelectShareContacts = ({route, navigation}: Props) => {
  const {shareMessages=[], isText= false} = route.params;
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
 
  const onShare = async () => {
    const members = await getSelectedConnections(selectedMembers);
    if (isText) {
        setLoading(true);
        for (const mbr of members) {
          for (const data of shareMessages) {
            const sender = new SendMessage(
              mbr.chatId,
              ContentType.text,
              {
                text: data,
              },
            );
            await sender.send();
          }
        }
        setLoading(false);
        navigation.popToTop();
      } else {
        navigation.push('GalleryConfirmation', {
          selectedMembers: members,
          shareMessages,
          fromShare: true,
        });
      }
  };

  const Colors = useColors();
  const styles = styling(Colors);



  const renderContent = () => {
    return (
      <View style={styles.scrollContainer}>
        <TopBarDescription
          theme={Colors.theme}
          description="Description to be changed"
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
      title={ `Select contacts to share media with${selectedMembers.size > 0 ? ` (${selectedMembers.size})` : ''}`}
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
          text={"Send to selected"}
          onClick={onShare}
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

export default SelectShareContacts;
