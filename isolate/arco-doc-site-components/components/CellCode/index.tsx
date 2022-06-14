import React, { PropsWithChildren, ReactNode } from 'react';
import { findDOMNode } from 'react-dom';
import { Button, Message, Tabs, Tooltip } from '@arco-design/web-react';
import { IconCopy, IconCodepen, IconCodeSandbox, IconCode } from '@arco-design/web-react/icon';
import ClipboardJS from 'clipboard';
import { getParameters } from 'codesandbox/lib/api/define';
import Css from './css';
import Short from './short';

// CodePen
const CODEPEN_ENABLE = (window as any).CODEPEN_ENABLE;
const HTML =
  (window as any).CODEPEN_HTML ||
  '<div id="root" style="padding: 20px;"></div>\n<script>\nconst CONTAINER = document.getElementById("root")\n</script>';
const CSS_EXTERNAL = (window as any).CODEPEN_CSS_EXTERNAL || [
  'https://unpkg.com/@arco-design/web-react/dist/css/arco.css',
];
const JS_EXTERNAL = (window as any).CODEPEN_JS_EXTERNAL || [
  'https://unpkg.com/react@16.x/umd/react.development.js',
  'https://unpkg.com/react-dom@16.x/umd/react-dom.development.js',
  'https://unpkg.com/dayjs@1.x/dayjs.min.js',
  'https://unpkg.com@arco-design/web-react/dist/arco.min.js',
  'https://unpkg.com@arco-design/web-react/dist/arco-icon.min.js',
];

// CodeSandBox
const html = '<div id="root" style="padding: 20px;"></div>';

interface CellCodeProps {
  tsx?: ReactNode;
  cssCode?: string;
}

interface CellCodeState {
  showAll: boolean;
  codeType: 'jsx' | 'tsx';
}

const CODE_JSX = 'jsx';
const CODE_TSX = 'tsx';

const locales = {
  'zh-CN': {
    copy: '复制',
    copied: '复制成功',
    expand: '展开代码',
    collapse: '收起代码',
    codePen: '在 CodePen 打开',
    codeSandbox: '在 CodeSandBox 打开',
  },
  'en-US': {
    copy: 'Copy',
    copied: 'Copied Success!',
    expand: 'Expand Code',
    collapse: 'Collapse Code',
    codePen: 'Open in CodePen',
    codeSandbox: 'Open in CodeSandBox',
  },
};

class CellCode extends React.Component<PropsWithChildren<CellCodeProps>, CellCodeState> {
  private btnCopy = null;

  private codeEle = null;

  private lang = localStorage.getItem('arco-lang') || 'zh-CN';

  constructor(props) {
    super(props);
    this.state = {
      showAll: false,
      codeType: props.tsx ? CODE_TSX : CODE_JSX,
    };
  }

  componentDidMount() {
    const t = locales[this.lang];
    const clipboard = new ClipboardJS(findDOMNode(this.btnCopy) as Element, {
      text: () => {
        return (this.codeEle.querySelector('.language-js') as HTMLElement).innerText;
      },
    });
    clipboard.on('success', (e) => {
      e.clearSelection();
      Message.success(t.copied);
    });
  }

  gotoCodepen = () => {
    const codeEle: HTMLElement = (findDOMNode(this) as HTMLElement).querySelector('.language-js');
    const code = codeEle.innerText;
    // codepen
    const postCode = code
      .replace(/import ([.\s\S]*?) from '([.\s\S]*?)'/g, 'const $1 = window.$2')
      .replace(/@arco-design\/web-react/g, 'arco')
      .replace('arco/icon', 'arcoicon')
      .replace(/react-dom/, 'ReactDOM')
      .replace(/react/, 'React')
      .replace(/export default ([.\s\S]*?)(;|$)/, 'ReactDOM.render(<$1 />, CONTAINER)');
    this.post(postCode);
  };

  getData = (code) => {
    return {
      title: 'Cool Pen',
      html: HTML,
      js: code,
      css: this.props.cssCode || '',
      js_pre_processor: 'typescript',
      css_external: CSS_EXTERNAL.join(';'),
      js_external: JS_EXTERNAL.join(';'),
      editors: '001',
    };
  };

  post = (code, codesandbox?: { url?: string; parameters; name?: string }) => {
    const form = document.createElement('form');
    form.action = (codesandbox && codesandbox.url) || 'https://codepen.io/pen/define';
    form.target = '_blank';
    form.method = 'POST';
    form.style.display = 'none';
    const field = document.createElement('input');
    field.name = (codesandbox && codesandbox.name) || 'data';
    field.type = 'hidden';
    field.setAttribute(
      'value',
      (codesandbox && codesandbox.parameters) ||
        JSON.stringify(this.getData(code)).replace(/"/g, '&quot;').replace(/'/g, '&apos;')
    );
    form.appendChild(field);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  toggleCodeType = () => {
    this.setState((prevState) => {
      return {
        codeType: prevState.codeType === CODE_TSX ? CODE_JSX : CODE_TSX,
      };
    });
  };

  toggleCode = (e) => {
    // 修正点击展开按钮时，页面向上滚动而不是向下滚动的问题
    if (!this.state.showAll) {
      e.target.blur();
    }
    this.setState({
      showAll: !this.state.showAll,
    });
  };

  gotoCodeSandBox = () => {
    const codeEle: HTMLElement = (findDOMNode(this) as HTMLElement).querySelector('.language-js');
    const codePrefix = `import '@arco-design/web-react/dist/css/arco.css';
${this.props.cssCode ? `import './index.css';\n` : ''}`;

    const code = `${codePrefix}\n${codeEle.innerText}`;
    const scriptType = this.state.codeType === CODE_TSX ? 'tsx' : 'js';

    const sandBoxConfig = {
      files: {
        'package.json': {
          isBinary: false,
          content: JSON.stringify({
            dependencies: {
              react: '17',
              'react-dom': '17',
              '@arco-design/web-react': 'latest',
            },
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
          content: html,
        },
      },
    };

    if (this.props.cssCode) {
      sandBoxConfig.files['index.css'] = {
        isBinary: false,
        content: this.props.cssCode,
      };
    }
    // to specific demo file
    const query = `file=/demo.${scriptType}`;
    this.post(undefined, {
      url: `https://codesandbox.io/api/v1/sandboxes/define?query=${encodeURIComponent(query)}`,
      parameters: getParameters(sandBoxConfig),
      name: 'parameters',
    });
  };

  renderOperations = () => {
    const { showAll, codeType } = this.state;
    const t = locales[this.lang];

    return (
      <div className="arco-code-operations">
        {this.props.tsx && (
          <Tabs
            size="small"
            justify
            type="capsule"
            activeTab={codeType}
            onChange={this.toggleCodeType}
            className={`code-type-switch ${showAll ? 'show-all' : ''}`}
          >
            <Tabs.TabPane key={CODE_JSX} title="JS" />
            <Tabs.TabPane key={CODE_TSX} title="TS" />
          </Tabs>
        )}
        <Tooltip content={showAll ? t.collapse : t.expand}>
          <Button
            size="small"
            shape="circle"
            onClick={this.toggleCode}
            type="secondary"
            aria-label={t.collapse}
            className={showAll ? 'ac-btn-expanded' : ''}
          >
            <IconCode />
          </Button>
        </Tooltip>
        <Tooltip content={t.copy}>
          <Button
            size="small"
            shape="circle"
            ref={(ref) => (this.btnCopy = ref)}
            type="secondary"
            aria-label={t.copy}
          >
            <IconCopy className="copy-icon" />
          </Button>
        </Tooltip>
        {CODEPEN_ENABLE ? (
          <Tooltip content={t.codePen}>
            <Button
              size="small"
              shape="circle"
              onClick={this.gotoCodepen}
              type="secondary"
              aria-label={t.codePen}
            >
              <IconCodepen />
            </Button>
          </Tooltip>
        ) : null}
        <Tooltip content={t.codeSandbox}>
          <Button
            size="small"
            shape="circle"
            onClick={this.gotoCodeSandBox}
            type="secondary"
            aria-label={t.codeSandbox}
          >
            <IconCodeSandbox />
          </Button>
        </Tooltip>
      </div>
    );
  };

  render() {
    const props = this.props;
    const { showAll, codeType } = this.state;
    return (
      <div className="arco-code-wrapper">
        {this.renderOperations()}
        <div className={`content-code-design ${showAll ? 'show-all' : ''}`}>
          <div className="code" ref={(ref) => (this.codeEle = ref)}>
            {codeType === CODE_TSX ? props.tsx : props.children}
          </div>
        </div>
      </div>
    );
  }
}

type CellCodeType = typeof CellCode & { Css: any; Short: any };

(CellCode as CellCodeType).Css = Css;
(CellCode as CellCodeType).Short = Short;

export default CellCode as CellCodeType;
