import React, {useEffect, useMemo, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import BlockedContactTile from '@components/BlockedContactTile';
import GradientCard from '@components/Cards/GradientCard';
import { useColors } from '@components/colorGuide';
import { screen} from '@components/ComponentUtils';
import {CustomStatusBar} from '@components/CustomStatusBar';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import BackTopbar from '@components/Reusable/TopBars/BackTopBar';
import {SafeAreaView} from '@components/SafeAreaView';
import SearchBar from '@components/SearchBar';
import { Height, Spacing } from '@components/spacingGuide';

import {getAllBlockedUsers} from '@utils/Storage/blockUsers';
import {BlockedUser} from '@utils/Storage/DBCalls/blockUser';

const BlockedContacts = () => {
  const navigation = useNavigation();
  const [blockedContactsList, setBlockedContactsList] = useState<
    BlockedUser[] | []
  >([]);
  const [viewableMembers, setViewableMembers] = useState<BlockedUser[]>([]);
  const [searchText, setSearchtext] = useState<string>('');

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

  const renderSelectedContact = (item: any) => {
    const isLast = blockedContactsList.length - 1 === item.index;

    return <BlockedContactTile {...item.item} isLast={isLast} />;
  };
  return (
    <>
      <CustomStatusBar backgroundColor={Colors.surface} />
      <SafeAreaView style={styles.screen}>
        <BackTopbar
          onBackPress={() => navigation.goBack()}
          title="Blocked contacts"
          bgColor="g"
        />
        <View style={styles.mainComponent}>
          {viewableMembers.length > 0 ? (
            < >
              <View style={{marginBottom: Spacing.m}}>
              <NumberlessText
                style={{textAlign: 'left'}}
                fontSizeType={FontSizeType.l}
                fontWeight={FontWeight.sb}
                textColor={Colors.text.title}>
                Blocked contacts
              </NumberlessText>
              <NumberlessText
                style={{textAlign: 'left'}}
                fontSizeType={FontSizeType.m}
                fontWeight={FontWeight.rg}
                textColor={Colors.text.subtitle}>
                This is a list of all your blocked contacts on Port. People who are blocked cannot text or call you and aren’t notified that you blocked them.
              </NumberlessText>
              </View>
              <SearchBar
                style={{
                  backgroundColor: Colors.surface,
                  height: Height.searchBar,
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: Spacing.xml,
                  marginBottom: Spacing.l
                }}
                searchText={searchText}
                setSearchText={setSearchtext}
              />
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
          ) : (
            <View style={{justifyContent:'center',flex:1}}>

            <GradientCard
              style={{
                paddingHorizontal: Spacing.m,
                paddingVertical: Spacing.m,
              
              }}>
              <NumberlessText
                style={{textAlign: 'left', marginBottom: Spacing.xs}}
                fontSizeType={FontSizeType.l}
                fontWeight={FontWeight.sb}
                textColor={Colors.text.title}>
                No blocked contacts
              </NumberlessText>
              <NumberlessText
                style={{textAlign: 'left'}}
                fontSizeType={FontSizeType.m}
                fontWeight={FontWeight.rg}
                textColor={Colors.text.subtitle}>
                This is a list of all your blocked contacts on Port. People who are blocked cannot text or call you and aren’t notified that you blocked them.
              </NumberlessText>
            </GradientCard>
            </View>
          )}
        </View>
      </SafeAreaView>
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
      paddingHorizontal: Spacing.l,
      marginTop:Spacing.l,
      
    },
  });
export default BlockedContacts;
