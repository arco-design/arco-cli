import path from 'path';
import fs from 'fs-extra';
import fm from 'front-matter';
import prettier from 'prettier';

import marked from './parser/marked';
import { isObject } from './utils/is';
import getDescriptionFromMdLexer from './utils/getDescriptionFromMdLexer';

type DemoMeta = {
  attributes: { [key: string]: any };
  jsCode: string;
  tsCode?: string;
  cssCode?: string;
  cssSilent?: boolean;
};

const codeRegex = /^(([ \t]*`{3,4})([^\n]*)([\s\S]+?)(^[ \t]*\2))/gm;

const transformTs2Js = (code) => {
  if (!code) return '';
  const body = require('@babel/core').transform(code, {
    plugins: [['@babel/plugin-transform-typescript', { isTSX: true }]],
  }).code;

  return prettier.format(body, { parser: 'babel' });
};

const getMetaFromComment: (string, boolean) => DemoMeta = (source, isTsx) => {
  const comments = source.match(/\/\*\*[\s\S]+?\*\//g);

  const tags = {};
  let body = source;

  if (comments && comments[0]) {
    body = body.replace(comments[0], '').trim();
    comments[0]
      .split('\n')
      .map((x) => (/^\s?\*\s*(\S)/.test(x) ? x.replace(/^\s?\*\s*(\S)/, '$1') : ''))
      .slice(1, -1)
      .join('\n')
      .split('@')
      .forEach(($) => {
        if ($) {
          const parsedTag = $.match(/^(\S+)(?:\s+(\S[\s\S]*))?/);

          if (parsedTag) {
            const tagTitle = parsedTag[1].replace(/:$/, '');
            const tagText = parsedTag[2];

            if (tagTitle) {
              tags[tagTitle] = tagText && tagText.trim();
            }
          }
        }
      });
  }

  return {
    attributes: tags,
    jsCode: !isTsx ? body : transformTs2Js(body),
    tsCode: isTsx ? body : null,
  };
};

const availableJs = ['js', 'jsx', 'javascript', 'ts', 'tsx', 'typescript'];
const availableCss = ['css', 'css:silent', 'less'];
const availableLangs = availableJs.concat(availableCss);

function getMatches(input: string): {
  js?: { lang: string; code: string; origin: string };
  css?: { lang: string; code: string; origin: string };
} {
  let matches;
  const output = {};
  while ((matches = codeRegex.exec(input))) {
    const lang = matches[3];
    const code = matches[4];
    if (availableLangs.indexOf(lang) > -1) {
      const l = availableJs.indexOf(lang) > -1 ? 'js' : 'css';
      output[l] = {
        lang,
        code,
        origin: matches[0],
      };
    }
  }
  return output;
}

const getMetaFromMd: (string, boolean) => DemoMeta = (source, lang) => {
  const fmSource = fm<any>(source);
  const { attributes, body } = fmSource;
  // const str = codeRegex.exec(body);
  const matches = getMatches(body);
  const metaTitle = attributes.title;
  // i18n
  attributes.title = isObject(metaTitle) ? metaTitle[lang] : metaTitle;
  let originDescription;
  if (matches.js) {
    originDescription = body.replace(matches.js.origin, '');
    if (matches.css) {
      originDescription = originDescription.replace(matches.css.origin, '');
    }
  } else {
    originDescription = body;
  }

  // i18n
  const lexerDescription = marked.lexer(originDescription);
  attributes.description = getDescriptionFromMdLexer(lexerDescription, lang) || originDescription;

  const isTsx = ['ts', 'tsx', 'typescript'].indexOf(matches.js.lang) > -1;

  const ret: DemoMeta = {
    attributes,
    jsCode: isTsx ? transformTs2Js(matches.js.code) : matches.js.code,
    tsCode: isTsx ? matches.js.code && matches.js.code.trim() : null,
  };
  if (matches.css) {
    ret.cssCode = matches.css.code;
    if (matches.css.lang === 'css:silent') {
      ret.cssSilent = true;
    }
  }

  return ret;
};

export default function (context, options, lang) {
  const demoDir = options.demoDir || 'demo';
  const files = fs.readdirSync(path.resolve(context || '', demoDir));

  const metadata = files.map((file) => {
    const source = fs.readFileSync(path.resolve(context, demoDir, file), 'utf8');
    if (/\.md$/.test(file)) {
      return getMetaFromMd(source, lang);
    }
    return getMetaFromComment(source, /\.(tsx|ts)$/.test(file));
  });
  metadata.sort((a, b) => a.attributes.order - b.attributes.order);

  return metadata;
}
