const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const loader = require('../../lib/index').default;

const md = fs.readFileSync(path.resolve(__dirname, 'demo.md'), 'utf8');

it('markdown components demo', () => {
  const code = prettier.format(
    loader.bind({ context: '__test__/demo', addDependency: () => {} })(md),
    { parser: 'babel' }
  );

  expect(code).toMatchSnapshot();
});
