import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {PortSpacing} from '@components/ComponentUtils';
import DynamicColors from '@components/DynamicColors';
import {
  FontSizeType,
  FontType,
  NumberlessText,
} from '@components/NumberlessText';
import AddTemplateBottomsheet from '@components/Reusable/BottomSheets/AddTemplateBottomsheet';
import ConfirmationBottomSheet from '@components/Reusable/BottomSheets/ConfirmationBottomSheet';
import SimpleCard from '@components/Reusable/Cards/SimpleCard';
import SecondaryButton from '@components/Reusable/LongButtons/SecondaryButton';

import {TemplateParams} from '@utils/Storage/DBCalls/templates';
import {deletetemplate} from '@utils/Storage/templates';
import useDynamicSVG from '@utils/Themes/createDynamicSVG';

import Delete from '@assets/icons/DeleteIcon.svg';

const TemplateCard = ({
  template,
  onSendMessage,
  loadTemplates,
}: {
  template: TemplateParams;
  onSendMessage: (template: TemplateParams) => void;
  loadTemplates: () => Promise<void>;
}) => {
  const [openEditBottomsheet, setEditOpenBottomsheet] =
    useState<boolean>(false);
  const [openDeleteBottomsheet, setOpenDeleteBottomsheet] =
    useState<boolean>(false);

  const Colors = DynamicColors();
  const svgArray = [
    {
      assetName: 'Edit',
      light: require('@assets/light/icons/Edit.svg').default,
      dark: require('@assets/light/icons/Edit.svg').default,
    },
  ];

  const results = useDynamicSVG(svgArray);
  const Edit = results.Edit;
  const onEdit = () => {
    setEditOpenBottomsheet(p => !p);
  };
  const onDelete = async () => {
    setOpenDeleteBottomsheet(p => !p);
  };
  return (
    <>
      <SimpleCard style={styles.container}>
        <Pressable onPress={() => onSendMessage(template)}>
          <NumberlessText
            textColor={Colors.text.primary}
            fontType={FontType.sb}
            fontSizeType={FontSizeType.l}>
            {template.title}
          </NumberlessText>
          <NumberlessText
            numberOfLines={3}
            style={{marginTop: PortSpacing.tertiary.top}}
            textColor={Colors.text.subtitle}
            fontType={FontType.rg}
            fontSizeType={FontSizeType.m}>
            {template.template}
          </NumberlessText>
        </Pressable>

        <View style={styles.row}>
          <View style={{width: '49%'}}>
            <SecondaryButton
              buttonHeight={40}
              Icon={Edit}
              secondaryButtonColor="grey"
              onClick={onEdit}
              buttonText="Edit"
            />
          </View>
          <View style={{width: '49%'}}>
            <SecondaryButton
              buttonHeight={40}
              Icon={Delete}
              secondaryButtonColor="r"
              onClick={onDelete}
              buttonText="Delete"
            />
          </View>
        </View>
      </SimpleCard>
      <AddTemplateBottomsheet
        loadTemplates={loadTemplates}
        visible={openEditBottomsheet}
        scope="edit"
        templatetitle={template.title}
        id={template.templateId}
        templatetext={template.template}
        onSendMessage={onSendMessage}
        onClose={() => setEditOpenBottomsheet(p => !p)}
      />
      <ConfirmationBottomSheet
        visible={openDeleteBottomsheet}
        onClose={() => setOpenDeleteBottomsheet(false)}
        onConfirm={async () => {
          await deletetemplate(template.templateId);
          await loadTemplates();
        }}
        title={'Are you sure you want to delete this template?'}
        description={'Deleting a template will mean it is lost permanantly.'}
        buttonText={'Delete'}
        buttonColor="r"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: PortSpacing.secondary.uniform,
    marginBottom: PortSpacing.secondary.bottom,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: PortSpacing.tertiary.top,
    width: '60%',
    alignSelf: 'flex-end',
  },
});

export default TemplateCard;
