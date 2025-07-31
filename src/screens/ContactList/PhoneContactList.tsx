import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Contacts from 'react-native-contacts';
import { EmailAddress, PhoneNumber } from 'react-native-contacts/type';

import { useColors } from '@components/colorGuide';
import { GradientScreenView } from '@components/GradientScreenView';
import SearchBar from '@components/SearchBar';
import { Height, Spacing } from '@components/spacingGuide';
import TopBarDescription from '@components/Text/TopBarDescription';

import { defaultFolderInfo, defaultPermissions } from '@configs/constants';

import { AppStackParamList } from '@navigation/AppStack/AppStackTypes';

import ContactsList from './components/ContactsList';


type Props = NativeStackScreenProps<AppStackParamList, 'PhoneContactList'>;

interface ContactInfo {
  contactName: string;
  contactEmail: EmailAddress[];
  contactNumber: PhoneNumber[];
}

const PhoneContactList = ({ navigation }: Props) => {
  const Colors = useColors();

  const styles = styling(Colors);
  const [searchText, setSearchtext] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [contactList, setContactList] = useState<any>({});
  const [filteredContacts, setFilteredContacts] = useState<any>({});

  // handles back navigation on backpress
  const onBackPress = () => {
    navigation.goBack();
  };
  useEffect(() => {
    // fetching all contacts from phonebook
    (async () => {
      try {
        const contacts = await Contacts.getAll();
        // Sorting contacts alphabetically
        contacts.sort((a, b) =>
          (a.givenName + ' ' + a.familyName).localeCompare(
            b.givenName + ' ' + b.familyName,
          ),
        );

        setContactList(contacts);
        setFilteredContacts(contacts);
      } catch (error) {
        console.error('Error loading contacts: ', error);
      }
      setIsLoading(false);
    })();
  }, []);

  useMemo(() => {
    if (contactList) {
      // Filter the contacts based on the search text
      if (searchText.trim() === '') {
        setFilteredContacts(contactList);
      } else {
        const filteredData = contactList.filter(item => {
          return item.givenName
            .toLowerCase()
            .includes(searchText.toLowerCase());
        });
        setFilteredContacts(filteredData);
      }
    }
  }, [searchText, contactList]);



  const onInviteContactClick = (contact: ContactInfo) => {
    navigation.navigate('NewPortStack', {
      screen: 'PortQRScreen',
      params: {
        contactName: contact.contactName,
        permissions: { ...defaultPermissions },
        folderId: defaultFolderInfo.folderId,
      },
    });
  };

  const renderContent = () => {
    return (
      <View style={styles.scrollContainer}>
        <TopBarDescription
          theme={Colors.theme}
          description="Create Ports for your favourite phone contacts and invite them to Port to enjoy a clutter-free, secure chat experience."
        />
        <View style={styles.scrollableElementsParent}>
          {isLoading ? (
            <View style={{paddingTop: Spacing.xxxxl, justifyContent: 'flex-start', alignItems: 'center', height: 600}}>
              <ActivityIndicator color={Colors.text.subtitle} />
            </View>
          ) : (
            <View style={styles.card}>
              <SearchBar
                searchText={searchText}
                setSearchText={setSearchtext}
              />
              <ContactsList
                filteredContacts={filteredContacts}
                onInviteContactClick={onInviteContactClick}
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
      title="Invite phone contacts"
      onBackPress={onBackPress}
      modifyNavigationBarColor={true}
      bottomNavigationBarColor={Colors.black}>
      <FlatList
        data={[1]}
        renderItem={renderContent}
        showsVerticalScrollIndicator={false}
      />
    </GradientScreenView>
  );
};

const styling = (colors: any) =>
  StyleSheet.create({
    scrollContainer: {
      backgroundColor: colors.background,
    },
    scrollableElementsParent: {
      marginTop: -Spacing.xxl,
      paddingBottom: Spacing.l,
      gap: Spacing.l,
    },
    card: { marginHorizontal: Spacing.l, gap: Spacing.l },
  });

export default PhoneContactList;
