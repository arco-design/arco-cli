const { style } = require('../arco.scripts.config');
module.exports = (config) => {
  config = style(config) || config;
  config.css.additionalData = ({ path, contents }) => {
    return {
      data: `@import './token.less';`,
    };
  };
};
