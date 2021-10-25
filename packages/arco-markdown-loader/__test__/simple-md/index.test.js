const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const loader = require('../../lib/index').default;

const md = fs.readFileSync(path.resolve(__dirname, 'demo.md'), 'utf8');

it('simple markdown', () => {
  const code = prettier.format(loader.bind({})(md), { parser: 'babel' });
  expect(code).toMatchSnapshot();
});
