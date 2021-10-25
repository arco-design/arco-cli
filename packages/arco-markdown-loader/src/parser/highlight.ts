import fs from 'fs';
import path from 'path';
import Prism from 'prismjs';

// 移除 spellcheck warning
Prism.hooks.add('wrap', function (env) {
  if (env.type === 'comment') {
    delete env.attributes.spellcheck;
  }
});

const prismjsDir = 'prismjs/components/';

const loadLanguages = require(prismjsDir);

const prismComponents = path.dirname(require.resolve(prismjsDir));
const components = fs
  .readdirSync(prismComponents)
  .map((component) => component.replace(/(\.min)?\.js$/, ''));

const uniqComponents = new Set(components);
uniqComponents.delete('index');
uniqComponents.delete('prism-core');

loadLanguages([...uniqComponents].map((c) => c.replace('prism-', '')));

export default function highlight(code, lang) {
  const language = Prism.languages[lang] || Prism.languages.autoit;

  return Prism.highlight(code, language);
}
