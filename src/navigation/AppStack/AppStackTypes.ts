import {LineDataCombined} from '@utils/DirectChats/DirectChat';
import AcceptedContactPortGenerator from '@utils/Ports/ContactPorts/AcceptedContactPortGenerator/AcceptedContactPortGenerator';
import { DirectContactPortBundle, DirectSuperportBundle, GroupSuperportBundle, PortBundle } from '@utils/Ports/interfaces';
import {ConnectionInfo} from '@utils/Storage/DBCalls/connections';
import {ContactEntry} from '@utils/Storage/DBCalls/contacts';
import {FolderInfo} from '@utils/Storage/DBCalls/folders';
import {GroupData} from '@utils/Storage/DBCalls/group';
import {GroupMemberLoadedData} from '@utils/Storage/DBCalls/groupMembers';
import {GroupMessageData} from '@utils/Storage/DBCalls/groupMessage';
import {LineMessageData} from '@utils/Storage/DBCalls/lineMessage';
import {PermissionsStrict} from '@utils/Storage/DBCalls/permissions/interfaces';
import {TemplateParams} from '@utils/Storage/DBCalls/templates';
import {FileAttributes} from '@utils/Storage/StorageRNFS/interfaces';

export type AppStackParamList = {
  OngoingCall: {chatId: string; callId: string; isVideoCall: boolean};
  IncomingCall: {chatId: string; callId: string; isVideoCall: boolean};
  DeleteAccount: undefined;
  AccountSettings: undefined;
  HomeTab: undefined;
  PhoneContactList: undefined;
  SuperportQRScreen: {
    superportId: string;
    selectedFolder: FolderInfo;
  };
  SuperportSetupScreen: {
    portId?: string;
    selectedFolder?: FolderInfo;
  };
  CreateFolder: {
    setSelectedFolder: any;
    portId?: string;
    chatId?: string;
    superportLabel?: string;
    saveDetails?: boolean;
    onSaveDetails?: (
      folderPermissions: PermissionsStrict,
      folderName: string,
    ) => void;
    savedFolderPermissions?: PermissionsStrict;
  };
  EditFolder: {selectedFolder: FolderInfo};
  MoveToFolder: {selectedFolder: FolderInfo};
  Scan: undefined;
  ConnectionCentre: undefined;
  Scanner: undefined;
  MediaCapture: {
    chatId: string;
  };
  // MediaCapture: undefined;
  DirectChat: {
    chatId: string;
    isConnected: boolean;
    profileUri: string | undefined | null;
    name?: string | null;
    isAuthenticated: boolean;
    ifTemplateExists?: TemplateParams;
  };
  GroupChat: {
    chatId: string;
    isConnected: boolean;
    profileUri: string | undefined | null;
    name?: string;
    ifTemplateExists?: TemplateParams;
  };
  ChatProfile: {
    chatId: string;
    chatData: LineDataCombined;
  };
  GroupProfile: {
    chatId: string;
    chatData: GroupData;
    members: GroupMemberLoadedData[];
  };
  ContactProfile: {
    contactInfo: ContactEntry;
    chatId: string | null;
    chatData: LineDataCombined | null;
  };
  Placeholder: undefined;
  NewContact: {groupId: string};
  ViewPhotosVideos: {chatId: string};
  SharedMedia: {chatId: string};
  ViewFiles: {chatId: string};
  ForwardToContact: {
    messages: string[];
    chatId: string;
  };
  ShareContact: {chatId: string};
  InviteGroupMembers: {chatId: string, groupData: GroupData, fromNewGroup?: boolean};
  AllMembers: {
    chatId: string;
    members: GroupMemberLoadedData[];
    chatData: GroupData;
  };
  AddCategoryScreen: undefined;
  ReportIssueScreen: {
    category: string;
    sections: any[];
    Img: any;
  };
  SuggestAFeature: undefined;
  SelectShareContacts: {
    shareMessages: any[];
    isText?: boolean;
  };
  GalleryConfirmation: {
    selectedMembers: ConnectionInfo[];
    shareMessages: any[];
    isChat?: boolean;
    fromShare?: boolean;
    fromCapture?: boolean;
    onRemove?: (item: any) => void;
  };
  CaptureMedia: {chatId: string; isGroupChat?: boolean};
  PreviewShareablePort: {
    qrData: string | null;
    linkData: string | null;
    title: string;
    profilePicAttr: FileAttributes;
  };
  CreateNewGroup: undefined;
  GiveUsFeedbackScreen: undefined;
  MediaViewer: {isGroup?: boolean; message: GroupMessageData | LineMessageData};
  BlockedContacts: undefined;
  HelpScreen: undefined;
  Templates: undefined;
  GroupTemplates: undefined;
  NewPortScreen: undefined;
  NewSuperPortQRScreen: {
    folder?: FolderInfo;
    portName?: string;
    limit?: number;
  };
  AllPortsScreen: any;
  // change soon ^
  DefaultPermissionsScreen: {isFromOnboarding?: boolean};
  ContactsScreen: undefined;
  CreateBackupScreen: undefined;
  // Isolation: undefined;

  //child stacks
  NewPortStack: any;
  NewSuperPortStack: any;
  ContactPortQRScreen: {contactName: string; profileUri?: string | null; contactPortClass: AcceptedContactPortGenerator; bundle: DirectContactPortBundle; link: string};
  GroupSuperPortQRScreen: {chatId: string; groupData: GroupData; memberCount: number; bundle: GroupSuperportBundle; link: string};
  AcceptDirectChat: {bundle: PortBundle | DirectContactPortBundle | DirectSuperportBundle};
};
