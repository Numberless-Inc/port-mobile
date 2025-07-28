import React, {useEffect, useMemo, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import BlockedContactTile from '@components/BlockedContactTile';
import ConfirmationBottomSheet from '@components/Bottomsheets/ConfirmationBottomsheet';
import GradientCard from '@components/Cards/GradientCard';
import { useColors } from '@components/colorGuide';
import { screen} from '@components/ComponentUtils';
import { CustomStatusBar } from '@components/CustomStatusBar';
import { GestureSafeAreaView } from '@components/GestureSafeAreaView';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import SearchBar from '@components/SearchBar';
import { Height, Spacing } from '@components/spacingGuide';
import GenericBackTopBar from '@components/TopBars/GenericBackTopBar';

import {blockUser, getAllBlockedUsers, unblockUser} from '@utils/Storage/blockUsers';
import {BlockedUser} from '@utils/Storage/DBCalls/blockUser';

const BlockedContacts = () => {
  const navigation = useNavigation();
  const [blockedContactsList, setBlockedContactsList] = useState<
    BlockedUser[] | []
  >([]);
  const [viewableMembers, setViewableMembers] = useState<BlockedUser[]>([]);
  const [searchText, setSearchtext] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);
const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);

  useEffect(() => {
    (async () => {
      setBlockedContactsList(await getAllBlockedUsers());
    })();
  }, []);

  useMemo(() => {
    const filteredData = blockedContactsList.filter(item => {
      return item.name.toLowerCase().includes(searchText.toLowerCase());
    });
    setViewableMembers(filteredData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const Colors = useColors();
  const styles = styling(Colors);
  const handleBlockUnblock = async () => {
    if (!selectedUser) return;
  
    const isCurrentlyBlocked = blockedContactsList.some(
      item => item.pairHash === selectedUser.pairHash
    );
  
    if (isCurrentlyBlocked) {
      await unblockUser(selectedUser.pairHash);
    } else {
      await blockUser({
        name: selectedUser.name,
        pairHash: selectedUser.pairHash,
        blockTimestamp: new Date().toISOString(),
      });
    }
  
    const updated = await getAllBlockedUsers();
    setBlockedContactsList(updated);
    setSearchtext('');
    setBottomSheetVisible(false);
  };
  
  const renderSelectedContact = ({item, index}) => {
    const isLast = viewableMembers.length - 1 === index;
    const isBlocked = blockedContactsList.some(u => u.pairHash === item.pairHash);
  
    return (
      <BlockedContactTile
        {...item}
        isLast={isLast}
        isBlocked={isBlocked}
        onPressAction={(user) => {
          setSelectedUser(user);
          setBottomSheetVisible(true);
        }}
      />
    );
  };
  
  return (
    <>
      <CustomStatusBar theme={Colors.theme}  backgroundColor={Colors.background} />
      <GestureSafeAreaView style={styles.screen}>
        <GenericBackTopBar
          onBackPress={() => navigation.goBack()}
          theme={Colors.theme}
          backgroundColor={Colors.background}
        />
          <View style={{width:'100%', marginLeft: Spacing.xl, gap:Spacing.m, marginBottom: Spacing.xl }}>
            <NumberlessText
          style={{textAlign:'left', }}
              textColor={Colors.text.title}
              fontWeight={FontWeight.sb}
              fontSizeType={FontSizeType.es}>
              Blocked contacts
            </NumberlessText>
            <NumberlessText
                style={{textAlign: 'left', paddingRight: Spacing.l}}
                fontSizeType={FontSizeType.m}
                fontWeight={FontWeight.rg}
                textColor={Colors.text.subtitle}>
                This is a list of your blocked contacts. These contacts cannot form a chat with your over any Port until you unblock them.
              </NumberlessText>
      
          </View>
          <View style={{paddingHorizontal: Spacing.m}}>

   
          <SearchBar
      style={{
        backgroundColor: Colors.surface,
        height: Height.searchBar,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Spacing.xml,
        marginBottom: Spacing.l,
      }}
      searchText={searchText}
      setSearchText={setSearchtext}
    />
           </View>
        <View style={styles.mainComponent}>
      
        {viewableMembers.length > 0 ? (
  <>
  
    <GradientCard style={{width: '100%'}}>
      <FlatList
        style={{width: '100%'}}
        data={viewableMembers}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        renderItem={renderSelectedContact}
      />
    </GradientCard>
  </>
) : searchText.length > 0 ? (
  <View style={{justifyContent: 'flex-start', flex: 1, width: '100%'}}>
    <GradientCard
      style={{
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.xl,
      }}>
      <NumberlessText
        style={{textAlign: 'center', marginBottom: Spacing.xs}}
        fontSizeType={FontSizeType.l}
        fontWeight={FontWeight.md}
        textColor={Colors.text.title}>
        No blocked contacts found
      </NumberlessText>
    </GradientCard>
  </View>
) : (
  <View style={{justifyContent: 'flex-start', flex: 1, width: '100%'}}>
  <GradientCard
    style={{
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.xl,
    }}>
    <NumberlessText
      style={{textAlign: 'center', marginBottom: Spacing.xs}}
      fontSizeType={FontSizeType.l}
      fontWeight={FontWeight.md}
      textColor={Colors.text.title}>
      You have not blocked any contacts yet
    </NumberlessText>
  </GradientCard>
</View>
)}

        </View>
        <ConfirmationBottomSheet
  visible={isBottomSheetVisible}
  onClose={() => setBottomSheetVisible(false)}
  onConfirm={handleBlockUnblock}
  title={
    blockedContactsList.some(u => u.pairHash === selectedUser?.pairHash)
      ? `Unblock ${selectedUser?.name}?`
      : `Block ${selectedUser?.name}?`
  }
  description={
    blockedContactsList.some(u => u.pairHash === selectedUser?.pairHash)
      ? `If you unblock this contact, they will be able to connect with you over a new Port.`
      : `Blocking ${selectedUser?.name} will prevent them from connecting with you over Ports, Superports or contact sharing until you unblock them.`
  }
  buttonText={
    blockedContactsList.some(u => u.pairHash === selectedUser?.pairHash)
      ? 'Yes, unblock'
      : 'Yes, block'
  }
/>

      </GestureSafeAreaView>
    </>
  );
};

const styling = colors =>
  StyleSheet.create({
    screen: {
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    mainComponent: {
      flex: 1,
      width: screen.width,
      backgroundColor: colors.background,
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: Spacing.l,
      paddingHorizontal: Spacing.m,
      
    },
  });
export default BlockedContacts;
