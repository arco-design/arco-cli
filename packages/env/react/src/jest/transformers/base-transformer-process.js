const { transform } = require('@babel/core');

const generateProcessFunc = (presets, plugins) => {
  return (src, filename) => {
    const result = transform(src, {
      sourceMap: 'inline',
      filename,
      presets,
      plugins,
      babelrc: false,
      configFile: false,
    });

    return { code: result ? result.code : src };
  };
};

module.exports = {
  generateProcessFunc,
};
