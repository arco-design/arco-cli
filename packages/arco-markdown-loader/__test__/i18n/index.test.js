const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const loader = require('../../lib/index').default;

const enMd = fs.readFileSync(path.resolve(__dirname, 'demo.en-US.md'), 'utf8');
const zhMd = fs.readFileSync(path.resolve(__dirname, 'demo.zh-CN.md'), 'utf8');

it('markdown i18n', () => {
  const enCode = prettier.format(
    loader.bind({
      context: '__test__/i18n',
      resourcePath: 'demo.en-US.md',
      addDependency: () => {},
    })(enMd),
    { parser: 'babel' }
  );

  const zhCode = prettier.format(
    loader.bind({
      context: '__test__/i18n',
      resourcePath: 'demo.zh-CN.md',
      addDependency: () => {},
    })(zhMd),
    { parser: 'babel' }
  );

  expect(enCode).toMatchSnapshot();
  expect(zhCode).toMatchSnapshot();
});
