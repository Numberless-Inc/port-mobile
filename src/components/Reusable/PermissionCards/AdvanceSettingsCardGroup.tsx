import React from 'react';
import { View } from 'react-native';

import { useColors } from '@components/colorGuide';
import { permissionConfigMap } from '@components/getPermissionIcon';
import {
  FontSizeType,
  FontType,
  NumberlessText,
} from '@components/NumberlessText';
import BooleanPermissionOption from '@components/PermissionsCards/Options/BooleanPermissionOption';
import SimpleCard from '@components/Reusable/Cards/SimpleCard';
import { Spacing } from '@components/spacingGuide';

import {
  BooleanPermissions,
  GroupPermissions,
} from '@utils/Storage/DBCalls/permissions/interfaces';
import { updatePermissions } from '@utils/Storage/permissions';


const AdvanceSettingsCardGroup = ({
  permissionsId,
  permissions,
  setPermissions,
  chatId,
  heading = 'Access permissions',
}: {
  permissionsId?: string;
  permissions: GroupPermissions;
  setPermissions: (permissions: GroupPermissions) => void;
  chatId?: string;
  heading?: string;
}) => {
  const Colors = useColors();

  const onUpdateBooleanPermission = async (
    permissionKey: keyof BooleanPermissions,
  ) => {
    const updatedPermissions: GroupPermissions = {
      ...permissions,
      [permissionKey]: !permissions[permissionKey],
    };
    if (permissionsId) {
      await updatePermissions(permissionsId, updatedPermissions);
    }
    setPermissions(updatedPermissions);
  };

  return (
    <SimpleCard style={{ backgroundColor: 'transparent', paddingVertical: 0 }}>
      <View
        style={{
          width: '100%',
          height: 56,
          paddingHorizontal: Spacing.xl,
          justifyContent: 'center',
        }}>
        <NumberlessText
          textColor={Colors.text.subtitle}
          fontType={FontType.md}
          fontSizeType={FontSizeType.l}>
          {heading}
        </NumberlessText>
      </View>
      <View style={{
        width: '100%',
        paddingHorizontal: Spacing.xl,
      }}>
        <BooleanPermissionOption
          onToggle={async () => await
            onUpdateBooleanPermission('displayPicture')
          }
          permissionState={permissions.displayPicture}
          title="See your display picture"
          PermissionConfigMap={permissionConfigMap.displayPicture}
          theme={Colors.theme}
        />
      </View>
    </SimpleCard>
  );
};

export default AdvanceSettingsCardGroup;
