import locale from './locale';

export default {
  block: {
    desc: locale.CMD_DES_BLOCK,
    executableFile: require.resolve('arco-cli-block'),
  },
};
