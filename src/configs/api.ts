import {DOMAIN, USE_SSL} from '@env';

const useSSL = USE_SSL ? USE_SSL === 'true' : true;
const URL = DOMAIN ? DOMAIN : 'staging.numberless.tech';

/**
 * Base Endpoints
 */
const BASE_URL = `${useSSL ? 'https' : 'http'}://${URL}`;
const WS_BASE = `${useSSL ? 'wss' : 'ws'}://${URL}`;

/**
 * WebSocket and Call Endpoints
 */
export const WEBSOCKET_URL = `${WS_BASE}/ws`;
export const CALL_URL = `${WS_BASE}/call`;
export const TURN_SERVER_URL = `${BASE_URL}/call/turns`;

/**
 * Reporting Endpoints
 */
const REPORT_BASE = `${BASE_URL}/report`;
export const MESSAGE_REPORTING_RESOURCE = `${REPORT_BASE}/illegal`;
export const LINE_MESSAGE_REPORTING_RESOURCE = `${REPORT_BASE}/line`;
export const GROUP_MESSAGE_REPORTING_RESOURCE = `${REPORT_BASE}/group`;
export const BUG_REPORTING_ENDPOINT = `${BASE_URL}/report/feedback`;

/**
 * Management Endpoints
 */
const MGMT_BASE = `${BASE_URL}/management`;
export const POLICY_ACCEPTANCE = `${MGMT_BASE}/policy-acceptance`;
export const INITIAL_POST_MANAGEMENT_RESOURCE = `${MGMT_BASE}/user`;
export const PERMISSION_MANAGEMENT_URL = `${MGMT_BASE}/permissions`;

/**
 * Line Management Endpoints
 */
export const LINE_LINKS_MANAGEMENT_RESOURCE = `${MGMT_BASE}/line-links`;
export const LINE_MANAGEMENT_RESOURCE = `${MGMT_BASE}/line`;
export const LINE_RETRY_URL = `${LINE_MANAGEMENT_RESOURCE}/retry`;

/**
 * Bundle Management Endpoints
 */
export const BUNDLE_MANAGEMENT_RESOURCE = `${MGMT_BASE}/bundle`;
export const BUNDLE_ID_PREPEND_LINK = 'https://porting.me/?bundleId=';

/**
 * Group Management Endpoints
 */
export const GROUP_BASE = `${MGMT_BASE}/group`;
export const GROUP_ADMIN_MANAGEMENT_RESOURCE = `${GROUP_BASE}/admins`;
export const GROUP_MEMBER_REMOVE_RESOURCE = `${GROUP_BASE}/remove`;
export const GROUP_EXIT_RESOURCE = `${GROUP_BASE}/leave`;
export const GROUP_LINKS_MANAGEMENT_RESOURCE = `${MGMT_BASE}/group-links`;
export const GROUP_MEMBER_RESOURCE = `${GROUP_BASE}/member`;
export const GROUP_PICTURE_RESOURCE = `${GROUP_BASE}/data`;

/**
 * Messaging Endpoints
 */
const MSG_BASE = `${BASE_URL}/messaging`;
export const MESSAGING_RESOURCE = `${MSG_BASE}/message`;
export const QUEUE_GET_URL = `${MSG_BASE}/queue`;
export const LARGE_FILE_PRESIGNED_URL_RESOURCE = `${BASE_URL}/multimedia`;
export const MULTIPART_BASE = `${LARGE_FILE_PRESIGNED_URL_RESOURCE}/v2`;
export const MULTIPART_BEGIN = `${MULTIPART_BASE}/begin-multipart`;
export const MULTIPART_COMPLETE = `${MULTIPART_BASE}/complete-multipart`;
export const MULTIPART_ABORT = `${MULTIPART_BASE}/abort-multipart`;

/**
 * Superport Endpoints
 */
const SUPERPORT_BASE = `${MGMT_BASE}/superport`;
export const LINE_SUPERPORT_CREATION_DELETION = `${SUPERPORT_BASE}/line`;
export const LINE_SUPERPORT_LIMIT_MODIFICATION = `${SUPERPORT_BASE}/limit`;
export const LINE_SUPERPORT_PAUSE = `${SUPERPORT_BASE}/pause`;
export const LINE_SUPERPORT_RESUME = `${SUPERPORT_BASE}/resume`;
export const LINE_SUPERPORT_BULK_UPDATE = `${SUPERPORT_BASE}/bulk-update`;

/**
 * Contact Sharing Endpoints
 */
export const CONTACT_BASE = `${MGMT_BASE}/contact-sharing`;
export const CONTACT_SHARING_TICKET_MANAGEMENT = `${CONTACT_BASE}/ticket`;
export const CONTACT_SHARING_PAUSE = `${CONTACT_BASE}/pause`;
export const CONTACT_SHARING_RESUME = `${CONTACT_BASE}/resume`;

/**
 * Call PermissionsEndpoints
 */
export const CALL_PERMISSIONS_MANAGEMENT = `${MGMT_BASE}/call-permissions`;

/**
 * Auth Endpoints
 */
// export const AUTH_SERVER_CHALLENGE_RESOURCE = `${BASE_URL}/auth/user`;
export const AUTH_SERVER_CHALLENGE_V2_RESOURCE = `${BASE_URL}/auth/v2/user`;
export const AUTH_SERVER_SUBMIT_KEY_RESOURCE = `${BASE_URL}/auth/user/submit_key`;

/*
 * Group Superport Endpoints
 */
export const GROUP_SUPERPORT_CREATION_DELETION = `${SUPERPORT_BASE}/group`;
export const GROUP_SUPERPORT_LIMIT_MODIFICATION = `${SUPERPORT_BASE}/group/limit`;
export const GROUP_SUPERPORT_PAUSE = `${SUPERPORT_BASE}/group/pause`;
export const GROUP_SUPERPORT_RESUME = `${SUPERPORT_BASE}/group/resume`;
export const GROUP_SUPERPORT_JOIN = `${GROUP_BASE}/member/from-superport`;

/**
 * Manage sentry.
 * The DSN is not a secret, hence it is commited here, but we only turn it on for production builds
 */
export const SENTRY_DSN: undefined | string = undefined;
// 'https://b06689ca28703b50361e8b27e567de03@o4508929164509184.ingest.de.sentry.io/4508993909948496';
