export default {
  TIP_SELECT_RELEASE_TYPE: '请选择你要发布的版本类型',
  TIP_INPUT_RELEASE_TAG: '请输入 dist-tag',
  TIP_INPUT_REMOTE_BRANCH: '指定远程和分支 (e.g. upstream/my-branch)，无需指定请直接回车',
  TIP_PUBLISH_SUCCESS: '发布至 NPM 成功！',

  ERROR_EXECUTED_FAILED: '命令执行失败。',
  ERROR_NO_GIT_INIT: '没有检测到 Git 仓库。',
  ERROR_NO_GIT_ORIGIN: '在指定 git remote 前，您无法发布代码，请手动添加 git remote。',
  ERROR_IN_MONOREPO:
    '项目中存在多个子包，arco publish 命令暂不支持此种项目，请将它们手动发布至 NPM。',
};
