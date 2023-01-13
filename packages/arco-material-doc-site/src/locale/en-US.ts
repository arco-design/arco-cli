export default {
  TIP_DEV_OPTION_LANGUAGE: 'Specify the language of site that need to dev',
  TIP_WEBPACK_ALIAS_COLLECT_RESULT:
    'The following Webpack Resolve Alias information will be applied automatically (extend the webpack config to unapply Alias automatically): ',

  TIP_REGENERATE_ENTRY_BY_GLOB:
    'The dependency file has been detected and the entry file is being regenerated',
  TIP_REGENERATE_ENTRY_BY_CONFIG:
    'The site configuration has been detected, and the entry file is being regenerated',

  TIP_USE_THEME_FROM_REMOTE_GROUP_CONFIG_ING: 'Try to get group theme config from remote...',
  TIP_USE_THEME_FROM_REMOTE_GROUP_CONFIG_DONE: (groupName: string, themeName: string) =>
    `Found theme config matches 「${groupName}」. Theme 「${themeName}」 will be automatically applied`,
  TIP_USE_THEME_FROM_REMOTE_GROUP_CONFIG_FAIL: `Arco Design Lab themes setting not found in the group configuration, will use Arco's default theme`,

  TIP_AUTO_GENERATE_ENTRY_FILE_ING: 'Auto-generating site entry file...',
  TIP_AUTO_GENERATE_ENTRY_FILE_DONE: 'The site entry file has been successfully generated',

  TIP_PREVIEW_PORT: 'Specify the port number on which the file server runs',
  TIP_PREVIEW_PATH: 'Specify the value of localPreviewUrl',
};
