import { getParameters } from 'codesandbox/lib/api/define';

const post = (options: { url: string; data: string; fieldName: string }) => {
  const { url, data, fieldName } = options;
  const form = document.createElement('form');
  form.action = url;
  form.target = '_blank';
  form.method = 'POST';
  form.style.display = 'none';
  const field = document.createElement('input');
  field.name = fieldName;
  field.type = 'hidden';
  field.setAttribute('value', data);
  form.appendChild(field);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

const parseDemoDependencies = (code: string): string[] => {
  const dependencies: string[] = [];
  const fn = (_, $1) => {
    const importFrom = $1.replace(/['"]/g, '');
    if (!/^\.+\//.test(importFrom)) {
      const importFromArr = importFrom.split('/');
      dependencies.push(importFromArr.slice(0, importFromArr[0].startsWith('@') ? 2 : 1).join('/'));
    }
    return '';
  };
  code.replace(/import\s+.+\s+from\s+([^\s;]+);*/g, fn).replace(/import\s+([^\s;]+);*/gs, fn);
  // @ts-ignore
  return [...new Set(dependencies)];
};

const gotoCodeSandbox = ({ code, language }) => {
  const scriptType = language;
  const dependencies = {
    react: '17',
    'react-dom': '17',
    '@arco-design/web-react': 'latest',
  }

  parseDemoDependencies(code).forEach((dep) => {
    dependencies[dep] ||= '*';
  });

  const sandBoxConfig = {
    files: {
      'package.json': {
        isBinary: false,
        content: JSON.stringify({
          dependencies,
        }),
      },
      [`demo.${scriptType}`]: {
        isBinary: false,
        content: code,
      },
      [`index.${scriptType}`]: {
        isBinary: false,
        content: [
          `import React from 'react'`,
          `import ReactDOM from 'react-dom'`,
          `import Demo from './demo'`,
          `ReactDOM.render(<Demo />, document.getElementById('root'))`,
        ].join('\n'),
      },
      'index.html': {
        isBinary: false,
        content: '<div id="root" style="padding: 20px;"></div>',
      },
    },
  };

  // to specific demo file
  const query = `file=/demo.${scriptType}`;
  post({
    url: `https://codesandbox.io/api/v1/sandboxes/define?query=${encodeURIComponent(query)}`,
    data: getParameters(sandBoxConfig),
    fieldName: 'parameters',
  });
};

(window as any).arcoDemoContext = {
  gotoCodeSandbox,
};
