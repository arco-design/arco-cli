/**
 * Domain info
 */
export const BASE_WEB_DOMAIN = 'arco.design';

export const BASE_DOCS_DOMAIN = `${BASE_WEB_DOMAIN}/material`;

/**
 * HTML element classnames
 */
export const CLASSNAME_MARKDOWN_CONTENT = 'a-md-content';

/**
 * LocalStorage keys
 */
export const LOCAL_STORAGE_KEY_WORKSPACE_DARK_MODE = 'arco_workspace_dark_mode';

/**
 * Valid message type received from parent window
 */
export enum VALID_MESSAGE_TYPE_FROM_PARENT_WINDOW {
  updateAnchorOffset = 'updateAnchorOffset',
  appendExtraStyle = 'appendExtraStyle',
  switchDarkMode = 'switchDarkMode',
  scrollIntoView = 'scrollIntoView',
  switchActiveTab = 'switchActiveTab',
}
