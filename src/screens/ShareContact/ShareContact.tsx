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

import {
  shareContactPort,
} from '@utils/ContactSharing';
import {getDirectChats} from '@utils/DirectChats';
import {ConnectionInfo} from '@utils/Storage/DBCalls/connections';

import { ToastType, useToast } from 'src/context/ToastContext';


type Props = NativeStackScreenProps<AppStackParamList, 'ShareContact'>;

const ShareContact = ({route, navigation}: Props) => {
  const {chatId} = route.params;
  //for loader used in the screen
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [allMembers, setAllMembers] = useState<ConnectionInfo[]>([]);
  const [viewableMembers, setViewableMembers] = useState<ConnectionInfo[]>([]);

  const [isMembersLoading, setIsMembersLoading] = useState(true);
  
  //search text
  const [searchText, setSearchText] = useState(''); 
  const {showToast} = useToast();

  useEffect(() => {
    (async () => {
      const connections = (await getDirectChats()).filter(
        connection => connection.chatId !== chatId,
      );
      setAllMembers(connections);
      setViewableMembers(connections);
      setIsMembersLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMemo(() => {
    const filteredData = allMembers.filter(item => {
      return item.name.toLowerCase().includes(searchText.toLowerCase());
    });
    setViewableMembers(filteredData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);
 
  const onShare = async () => {
    setLoading(true);
    for (const mbr of selectedMembers) {
      try {
        await shareContactPort(mbr, chatId);
        console.info('Could use contact port, not falling back to legacy');
      } catch (e) {
        console.error('Could not share contact Port: ', e);
        console.info('Falling back to legacy contact sharing');
        showToast(
          'Error in sharing contact. You may not have permissions to share this contact.',
          ToastType.error,
        );
      }
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
          description="Selected contacts will be shared on this chat if you these contacts have given you the permission to do so."
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
      title={ `Select contacts to share${selectedMembers.size > 0 ? ` (${selectedMembers.size})` : ''}`}
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
          text={selectedMembers.size > 1? 'Share Contacts': 'Share Contact'}
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

export default ShareContact;
