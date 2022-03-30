const {
  default: { buildCSS },
} = require('../../lib/scripts/build/component');

buildCSS().then(() => console.log('build css done'));
