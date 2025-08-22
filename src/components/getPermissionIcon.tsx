import React, {FC} from 'react';
import {StyleSheet, View} from 'react-native';

import {SvgProps} from 'react-native-svg';

import DynamicColors from '@components/DynamicColors';

import {PermissionsStrict} from '@utils/Storage/DBCalls/permissions/interfaces';

import BellDisabledDark from '@assets/dark/icons/BellDisabled.svg';
import CallDisabledDark from '@assets/dark/icons/CallDisabled.svg';
import CheckCircleDisabledDark from '@assets/dark/icons/CheckCircleDisabled.svg';
import DisappearingMessageDisabledDark from '@assets/dark/icons/DisappearingMessageDisabled.svg';
import DownloadDisabledDark from '@assets/dark/icons/DownloadDisabled.svg';
import FavouriteFolderDisabledDark from '@assets/dark/icons/FavouriteFolderDisabled.svg';
import HomeDisabledDark from '@assets/dark/icons/HomeDisabled.svg';
import ProfileDisabledDark from '@assets/dark/icons/ProfileDisabled.svg';
import ShareContactDisabledDark from '@assets/dark/icons/ShareContactDisabled.svg';
import BellRed from '@assets/icons/BellRed.svg';
import CallEnabled from '@assets/icons/CallEnabled.svg';
import CheckCircleOrange from '@assets/icons/CheckCircleOrange.svg';
import DisappearingMessageBlue from '@assets/icons/DisappearingMessageBlue.svg';
import DownloadTeal from '@assets/icons/DownloadTeal.svg';
import FavouriteFolderOrange from '@assets/icons/FavouriteFolderOrange.svg';
import HomeSafron from '@assets/icons/HomeSafron.svg';
import ProfileTeal from '@assets/icons/ProfileTeal.svg';
import ShareContactGreen from '@assets/icons/ShareContactGreen.svg';
import BellDisabled from '@assets/light/icons/BellDisabled.svg';
import CallDisabled from '@assets/light/icons/CallDisabled.svg';
import CheckCircleDisabled from '@assets/light/icons/CheckCircleDisabled.svg';
import DisappearingMessageDisabled from '@assets/light/icons/DisappearingMessageDisabled.svg';
import DownloadDisabled from '@assets/light/icons/DownloadDisabled.svg';
import FavouriteFolderDisabled from '@assets/light/icons/FavouriteFolderDisabled.svg';
import HomeDisabled from '@assets/light/icons/HomeDisabled.svg';
import ProfileDisabled from '@assets/light/icons/ProfileDisabled.svg';
import ShareContactDisabled from '@assets/light/icons/ShareContactDisabled.svg';

import {Colors} from './colorGuide';
import {Spacing} from './spacingGuide';

export interface PermissionConfig {
  bgColor: string; //same for dark and light mode
  enabledIcon: FC<SvgProps>; //same for dark and light mode
  disabledIconLight: FC<SvgProps>;
  disabledIconDark: FC<SvgProps>;
}

/**
 * Configuration map for permission icons and colors.
 * Each permission has:
 * - bgColor: Background color for the icon container (same in light/dark mode)
 * - enabledIcon: Icon component to show when permission is enabled
 * - disabledIconLight: Icon component for disabled state in light mode
 * - disabledIconDark: Icon component for disabled state in dark mode
 */
export const permissionConfigMap: {
  [key in keyof PermissionsStrict]: PermissionConfig;
} = {
  notifications: {
    bgColor: Colors.common.lowAccentColors.brightRed,
    enabledIcon: BellRed,
    disabledIconLight: BellDisabled,
    disabledIconDark: BellDisabledDark,
  },
  autoDownload: {
    bgColor: Colors.common.lowAccentColors.tealBlue,
    enabledIcon: DownloadTeal,
    disabledIconLight: DownloadDisabled,
    disabledIconDark: DownloadDisabledDark,
  },
  focus: {
    bgColor: Colors.common.lowAccentColors.deepSafron,
    enabledIcon: HomeSafron,
    disabledIconLight: HomeDisabled,
    disabledIconDark: HomeDisabledDark,
  },
  contactSharing: {
    bgColor: Colors.common.lowAccentColors.darkGreen,
    enabledIcon: ShareContactGreen,
    disabledIconLight: ShareContactDisabled,
    disabledIconDark: ShareContactDisabledDark,
  },
  disappearingMessages: {
    bgColor: Colors.common.lowAccentColors.blue,
    enabledIcon: DisappearingMessageBlue,
    disabledIconLight: DisappearingMessageDisabled,
    disabledIconDark: DisappearingMessageDisabledDark,
  },
  readReceipts: {
    bgColor: Colors.common.lowAccentColors.orange,
    enabledIcon: CheckCircleOrange,
    disabledIconLight: CheckCircleDisabled,
    disabledIconDark: CheckCircleDisabledDark,
  },
  displayPicture: {
    bgColor: Colors.common.lowAccentColors.blue,
    enabledIcon: ProfileTeal,
    disabledIconLight: ProfileDisabled,
    disabledIconDark: ProfileDisabledDark,
  },
  favourite: {
    bgColor: Colors.common.lowAccentColors.grey,
    enabledIcon: FavouriteFolderOrange,
    disabledIconLight: FavouriteFolderDisabled,
    disabledIconDark: FavouriteFolderDisabledDark,
  },
  calling: {
    bgColor: Colors.common.lowAccentColors.purple,
    enabledIcon: CallEnabled,
    disabledIconLight: CallDisabled,
    disabledIconDark: CallDisabledDark,
  },
};


