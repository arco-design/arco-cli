module.exports = function StyleConfig(config) {
  delete config.less.output.cjs;
  config.less.output.dist.path = 'dist';
  config.less.output.dist.cssFileName = 'arco-components.css';
};
