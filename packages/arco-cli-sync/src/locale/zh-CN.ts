export default {
  TIP_CMD_EXEC_RESULT: '物料信息的同步结果：',
  TIP_META_GENERATE_ING: '尝试自动生成物料信息',
  TIP_META_GENERATE_DONE: '生成物料信息成功',
  TIP_META_FETCH_SUCCESS: '更新本地物料信息成功',
  TIP_META_SYNC_ING: '正在同步物料信息...',
  TIP_META_SYNC_DONE: '物料信息同步成功',

  ERROR_META_SYNC_FAILED: '物料信息同步失败',
  ERROR_NEED_PUBLISH_TO_NPM: '该项目还未发布至 NPM，请发布后操作',
  ERROR_META_FETCH_FAILED: '更新本地物料信息失败，无可用的远端物料信息',
  ERROR_META_GENERATE_FAILED: '生成物料信息失败，请尝试使用 arco generate 命令生成物料信息后重试',
  ERROR_META_SHOULD_FETCH_FIRST:
    '本地的物料信息已经落后于远端，请执行 arco sync --fetch 以更新至最新',
  ERROR_GET_PACKAGE_INFO_FAILED: '获取 NPM 包信息失败',
  ERROR_NEED_PUPPETEER:
    '自动截图需要依赖 puppeteer (https://www.npmjs.com/package/puppeteer) 模块，请全局安装此模块之后再次尝试',
  ERROR_AUTO_SCREENSHOT_FAILED: '自动生成物料截图失败',
  ERROR_NONE_PACKAGE_FOUNDED: '此目录下没有发现任何物料包，请在有效的物料项目中执行此命令',
};
