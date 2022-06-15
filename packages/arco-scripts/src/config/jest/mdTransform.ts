// markdown processor
import nodePath from 'path';
import crypto from 'crypto';
import template from '@babel/template';
import { transform } from '@babel/core';
import babelConfig from '../babel.config';

babelConfig.plugins = [...babelConfig.plugins];

babelConfig.plugins.push(createDemoPlugin);

// Create Demo export
function createDemoPlugin({ types }) {
  return {
    visitor: {
      Program(path) {
        const importReact = template('import React from "react";import ReactDOM from "react-dom";');
        path.unshiftContainer('body', importReact());
      },
      CallExpression(path) {
        if (
          path.node.callee.object &&
          path.node.callee.object.name === 'ReactDOM' &&
          path.node.callee.property.name === 'render'
        ) {
          const app = types.VariableDeclaration('const', [
            types.VariableDeclarator(types.Identifier('__export'), path.node.arguments[0]),
          ]);
          const exportDefault = types.ExportDefaultDeclaration(types.Identifier('__export'));
          path.insertAfter(exportDefault);
          path.insertAfter(app);
          path.remove();
        }
      },
    },
  };
}

// get code block
const codeRegex = /^(([ \t]*`{3,4})([^\n]*)([\s\S]+?)(^[ \t]*\2))/m;

module.exports = {
  process(src) {
    const str = codeRegex.exec(src);
    if (str !== null && (str[3] === 'js' || str[3] === 'javascript' || str[3] === 'tsx')) {
      return transform(str[4], babelConfig).code;
    }
  },
  getCacheKey(fileData, filename, configString, { instrument, rootDir }) {
    return crypto
      .createHash('md5')
      .update('\0', 'utf8')
      .update(fileData)
      .update('\0', 'utf8')
      .update(nodePath.relative(rootDir, filename))
      .update('\0', 'utf8')
      .update(configString)
      .update('\0', 'utf8')
      .update(instrument ? 'instrument' : '')
      .update('\0', 'utf8')
      .update(process.env.NODE_ENV || '')
      .update('\0', 'utf8')
      .update(process.env.BABEL_ENV || '')
      .digest('hex');
  },
};
