export default {
  TIP_DEV_OPTION_LANGUAGE: '指定需要 Dev 的语言类型',
  TIP_WEBPACK_ALIAS_COLLECT_RESULT:
    '将自动应用以下 Webpack Resolve Alias 信息（扩展 Webpack 配置以取消自动应用 Alias）：',

  TIP_REGENERATE_ENTRY_BY_GLOB: '检测到依赖文件改变，正在重新生成入口文件',
  TIP_REGENERATE_ENTRY_BY_CONFIG: '检测到站点配置发生改变，正在重新生成入口文件',

  TIP_USE_THEME_FROM_REMOTE_GROUP_CONFIG_ING:
    '正在尝试从远端获取团队配置的 Arco Design Lab 主题...',
  TIP_USE_THEME_FROM_REMOTE_GROUP_CONFIG_DONE: (groupName: string, themeName: string) =>
    `已匹配 「${groupName}」 的主题配置，将自动应用主题包 「${themeName}」`,
  TIP_USE_THEME_FROM_REMOTE_GROUP_CONFIG_FAIL:
    '未从团队配置中发现设置的 Arco Design Lab 主题，将采用 Arco 默认主题样式',

  TIP_AUTO_GENERATE_ENTRY_FILE_ING: '正在自动生成站点入口文件...',
  TIP_AUTO_GENERATE_ENTRY_FILE_DONE: '已成功生成站点入口文件',

  TIP_PREVIEW_PORT: '指定文件服务器运行的端口号',
  TIP_PREVIEW_PATH: '指定 localPreviewUrl 的路径',
};
