import React from 'react';
import { StyleSheet, View } from 'react-native';

import GradientCard from '@components/Cards/GradientCard';
import { useColors } from '@components/colorGuide';
import PasswordInput from '@components/Inputs/PasswordInput';
import {
  FontSizeType,
  FontWeight,
  NumberlessText,
} from '@components/NumberlessText';
import { Spacing } from '@components/spacingGuide';

const AddPasswordCard = ({
  password,
  setPassword,
  reenterPassword,
  setReenterPassword,
  error,
}: {
  password: string;
  setPassword: (value: string) => void;
  reenterPassword: string;
  setReenterPassword: (value: string) => void;
  error: string | undefined;
}) => {
  const color = useColors();

  return (
    <GradientCard style={styles.card}>
      <View>
        <NumberlessText
          style={styles.title}
          textColor={color.text.title}
          fontSizeType={FontSizeType.l}
          fontWeight={FontWeight.md}>
          Add a password
        </NumberlessText>

        <NumberlessText
          style={{ margin: Spacing.xs }}
          textColor={color.text.subtitle}
          fontSizeType={FontSizeType.s}
          fontWeight={FontWeight.rg}>
          This will be used to encrypt your backup. You'll have to reenter it when restoring your account.
        </NumberlessText>

        <View style={styles.inputRow}>
          <PasswordInput
            setText={setPassword}
            text={password}
            placeholderText="Enter your password"
            showError={!!error}
          />
        </View>

        <View style={styles.inputRow}>
          <PasswordInput
            setText={setReenterPassword}
            text={reenterPassword}
            placeholderText="Re-enter your password"
            showError={!!error}
          />
        </View>

        {error && (
          <NumberlessText
            style={styles.errorText}
            textColor={'red'}
            fontSizeType={FontSizeType.s}
            fontWeight={FontWeight.rg}>
            {error}
          </NumberlessText>
        )}
      </View>
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.l,
  },
  title: {
    marginBottom: Spacing.s,
    marginTop: Spacing.s,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.m,
  },
  errorText: {
    marginBottom: Spacing.s,
  },
  visIcon: {
    padding: Spacing.m,
  },
});

export default AddPasswordCard;
