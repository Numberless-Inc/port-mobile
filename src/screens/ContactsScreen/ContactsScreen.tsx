import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useColors } from '@components/colorGuide';
import { GradientScreenView } from '@components/GradientScreenView';
import SearchBar from '@components/SearchBar';
import {  Spacing } from '@components/spacingGuide';
import TopBarDescription from '@components/Text/TopBarDescription';

import { getContacts } from '@utils/Storage/contacts';
import { ContactEntry } from '@utils/Storage/DBCalls/contacts';

import ConnectionsCard from './components/ConnectionsCard';
import NewContactOptions from './components/NewContactOptions';

const ContactsScreen = () => {
  const Colors = useColors();

  const styles = styling(Colors);
  const navigation = useNavigation();
  const [allConnections, setAllConnections] = useState<ContactEntry[]>([]);
  const [filteredConnections, setFilteredConnections]= useState<ContactEntry[]>([]);
  const [searchText, setSearchtext] = useState<string>('');

  // handles back navigation on backpress
  const onBackPress = () => {
    navigation.goBack();
  };

  useEffect(() => {
    (async () => {
      const checkForConnections = await getContacts();
      console.log("checkForConnections",checkForConnections)
      setAllConnections(checkForConnections);
    })();
  }, []);

  useMemo(() => {
    if (allConnections) {
      // Filter the contacts based on the search text
      if (searchText.trim() === '') {
        setFilteredConnections(allConnections);
      } else {
        const filteredData = allConnections.filter(item => {
          return item.name?.toLowerCase()
            .includes(searchText.toLowerCase());
        });
        setFilteredConnections(filteredData);
      }
    }
  }, [searchText, allConnections]);

  const renderContent = () => {
    return (
      <View style={styles.scrollContainer}>
        <TopBarDescription
          theme={Colors.theme}
          description="Invite more contacts to Port and enjoy a clutter-free, secure chat experience."
        />
        <View style={styles.scrollableElementsParent}>
          <View style={styles.card}>
            <NewContactOptions /> 
            {allConnections.length>0 &&
             <SearchBar
             searchText={searchText}
             setSearchText={setSearchtext}
           />
            }
            <ConnectionsCard allConnections={filteredConnections} searchText={searchText} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <GradientScreenView
      color={Colors}
      title="Port contacts"
      onBackPress={onBackPress}
      modifyNavigationBarColor={true}
      bottomNavigationBarColor={Colors.black}>
      <FlatList
        data={[1]}
        renderItem={renderContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={'handled'}
      />
    </GradientScreenView>
  );
};
const styling = (color: any) =>
  StyleSheet.create({
    scrollableElementsParent: {
      marginTop: -Spacing.xxl,
      paddingBottom: Spacing.l,
      gap: Spacing.m,
    },
    card: { marginHorizontal: Spacing.l, gap: Spacing.l },
    scrollContainer: {
      backgroundColor: color.background,
    },
  });

export default ContactsScreen;
