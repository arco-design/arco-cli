export default {
  TIP_SELECT_RELEASE_TYPE: 'Please select the version type you want to publish',
  TIP_INPUT_RELEASE_TAG: 'Please enter dist-tag',
  TIP_INPUT_REMOTE_BRANCH:
    'Specify the remote and branch (e.g. upstream/my-branch), press Enter without specifying it',
  TIP_PUBLISH_SUCCESS: 'Publish to NPM successfully!',

  ERROR_EXECUTED_FAILED: 'Command executed failed.',
  ERROR_NO_GIT_INIT: 'No Git repository was detected.',
  ERROR_NO_GIT_ORIGIN:
    'You cannot publish code before specifying git remote. Please add git remote manually.',
  ERROR_IN_MONOREPO:
    'There are multiple sub-packages in the project. Command [arco publish] does not support this kind of project. Please publish them manually.',
};
