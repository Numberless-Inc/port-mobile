import React, {useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import LargeTextInput from '@components/Reusable/Inputs/LargeTextInput';

import {updateContact} from '@utils/Storage/contacts';

import Greentick from '@assets/icons/notes/Greentick.svg';
import Tick from '@assets/icons/notes/Tick.svg';

import GradientCard from './Cards/GradientCard';
import { useColors } from './colorGuide';
import { Spacing } from './spacingGuide';
import useSVG from './svgGuide';

const Notes = ({
  note,
  pairHash,
  getNote,
}: {
  note: string;
  pairHash: string;
  getNote: () => Promise<void>;
}) => {
  const Colors = useColors();
  const [changesSaved, setChangesSaved] = useState(false);
  const [newNote, setNewNote] = useState(note);
  const timeoutId = useRef(null);

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
    if (note) {
      setNewNote(note);
    }
  }, [note]);

  useEffect(() => {
    // clear timeout on unmount
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutId.current]);
  

  return (
    <GradientCard style={styles.main}>
      <View style={styles.container}>
        <NumberlessText
          textColor={Colors.text.title}
          fontWeight={FontWeight.md}
          fontSizeType={FontSizeType.l}>
          Notes
        </NumberlessText>

        {newNote !== note && (
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
                await updateContact(pairHash, {notes: newNote});
                setChangesSaved(true);
              
                if (timeoutId.current) {
                  clearTimeout(timeoutId.current);
                }
              
                timeoutId.current = setTimeout(async () => {
                  await getNote();
                  setChangesSaved(false);
                  timeoutId.current = null;
                }, 2000);
              }}
              
                />
                <Cross
                  onPress={async () => {
                    await getNote();
                    setNewNote(note);
                    setChangesSaved(false);
                  }}
                />
              </>
            )}
          </View>
        )}
      </View>
      <LargeTextInput
        showLimit
        maxLength={300}
        setText={onChangeText}
        text={newNote}
        bgColor="w"
        placeholderText="Add a note"
      />
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  main: {
    paddingVertical: Spacing.l,
    paddingHorizontal:  Spacing.l,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom:  Spacing.l,
    alignItems: 'center',
    height: 30,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.s
  },
});
export default Notes;
