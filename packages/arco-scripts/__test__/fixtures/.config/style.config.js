const { style } = require('../arco.scripts.config');
module.exports = (config) => {
  config = style(config) || config;
  config.css.additionalData = ({ path, contents }) => {
    console.log(path, contents);
    return {
      data: 'body { color: #000 }',
      append: true,
      overwrite: false,
    };
  };
};
