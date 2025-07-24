import React, {useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import LargeTextInput from '@components/Reusable/Inputs/LargeTextInput';

import Group from '@utils/Groups/Group';
import {ContentType} from '@utils/Messaging/interfaces';
import SendMessage from '@utils/Messaging/Send/SendMessage';
import {GroupData} from '@utils/Storage/DBCalls/group';

import Greentick from '@assets/icons/notes/Greentick.svg';
import Tick from '@assets/icons/notes/Tick.svg';

import GradientCard from '../../../components/Cards/GradientCard';
import { useColors } from '../../../components/colorGuide';
import { Spacing } from '../../../components/spacingGuide';
import useSVG from '../../../components/svgGuide';

const Description = ({
  description,
  chatId,
  chatData,
}: {
  description: string;
  chatId: string;
  chatData: GroupData;
}) => {
  const Colors = useColors();
  const [changesSaved, setChangesSaved] = useState(false);
  const [newNote, setNewNote] = useState(description);

  const onChangeText = (text: string) => {
    setNewNote(text);
    setChangesSaved(false);
  };

  const svgArray = [
    {
      assetName: 'Cross',
      light: require('@assets/icons/notes/Cross.svg').default,
      dark: require('@assets/dark/icons/RedCross.svg').default,
    },
  ];
  const results = useSVG(svgArray);
  const Cross = results.Cross;
  useMemo(() => {
    if (description) {
      setNewNote(description);
    }
  }, [description]);

  return (
    <GradientCard style={styles.main}>
      <View style={styles.container}>
        <NumberlessText
          textColor={Colors.text.title}
          fontWeight={FontWeight.sb}
          fontSizeType={FontSizeType.l}>
          Group Description
        </NumberlessText>

        {newNote !== description && (
          <View style={styles.row}>
            {changesSaved ? (
              <>
                <Greentick />
                <NumberlessText
                  textColor={Colors.text.subtitle}
                  fontWeight={FontWeight.rg}
                  fontSizeType={FontSizeType.s}>
                  Changes Saved
                </NumberlessText>
              </>
            ) : (
              <>
                <Tick
                  onPress={async () => {
                    //update group description
                    const chatHandler = new Group(chatId);
                    await chatHandler.updateData({description: newNote});
                    const groupData = await chatHandler.getData();
                    if (
                      groupData &&
                      groupData.amAdmin &&
                      groupData.description
                    ) {
                      const sender = new SendMessage(
                        chatId,
                        ContentType.groupDescription,
                        {
                          groupDescription: groupData.description,
                        },
                      );
                      sender.send();
                    }
                    setChangesSaved(true);
                  }}
                />
                <Cross
                  onPress={() => {
                    setNewNote(description);
                    setChangesSaved(false);
                  }}
                />
              </>
            )}
          </View>
        )}
      </View>
      <LargeTextInput
        maxLength={2000}
        setText={onChangeText}
        text={newNote}
        bgColor="w"
        placeholderText="Add a description"
        isEditable={chatData.amAdmin}
      />
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  main: {
    paddingVertical: Spacing.l,
    paddingHorizontal: Spacing.l,
    
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.l,
    alignItems: 'center',
    height: 30,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.s
  },
});
export default Description;
