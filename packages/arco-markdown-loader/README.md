# arco-markdown-loader

This is a Webpack loader, will translate markdown to react component.

And if you specify demo folder, it will generate demo effect and code preview.

## Install

```bash
npm i arco-markdown-loader -D
```

## Usage

webpack documentation: [Loaders](https://webpack.js.org/loaders/)

Within your webpack configuration object, you'll need to add the md2react-doc-loader to the list of modules, like so:

You should put `babel-loader` before md2react-doc-loader, because md2react-doc-loader's output is ES6 format and contains jsx.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import MD from './README.md';

ReactDOM.render(<MD />, document.getElementById('container'));
```

```js
module: {
  rules: [
    {
      test: /\.md$/,
      exclude: /(node_modules)/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            ...
          }
        },
        {
          loader: 'arco-markdown-loader',
          options: {
            demoDir: 'demo',
            templateDir: 'src/templates',
            babelConfig: {
              ...
            }
          }
        }
      ]
    }
  ]
}
```

## Options

### demoDir [string]

`default: demo`

Specify demo dir, relative to your entry md file.

### autoHelmet [object]

Add helmet to each page.

then:

```js
{
  test: /\.md$/,
  use: [
    {
      loader: 'babel-loader',
      options: babelConfig,
    },
    {
      loader: 'arco-markdown-loader',
      options: {
        babelConfig,
      },
    },
  ],
},
```

### preprocess [function]

Preprocess the file content, you should return new file content string in this function.

### babelConfig [object]

See [Babel config](https://babeljs.io/docs/en/next/options).

For compile markdown jsx.

## LICENSE

[MIT](./LICENSE) @[PengJiyuan](https://github.com/PengJiyuan)
