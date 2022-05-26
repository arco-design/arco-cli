import React, { useState } from 'react';
import { Tooltip } from '@arco-design/web-react';

function IconCodeFill() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.2751 17.5H3.77507C3.66456 17.5 3.55858 17.4561 3.48044 17.378C3.4023 17.2998 3.3584 17.1938 3.3584 17.0833V2.91667C3.3584 2.80616 3.4023 2.70018 3.48044 2.62204C3.55858 2.5439 3.66456 2.5 3.77507 2.5H16.2751C16.3856 2.5 16.4916 2.5439 16.5697 2.62204C16.6478 2.70018 16.6917 2.80616 16.6917 2.91667V17.0833C16.6917 17.1938 16.6478 17.2998 16.5697 17.378C16.4916 17.4561 16.3856 17.5 16.2751 17.5Z"
        fill="var(--color-text-1)"
        stroke="var(--color-text-1)"
        strokeWidth="1.5"
      />
      <path
        d="M9.6379 7.0834L6.69165 10.0297L9.6379 12.9759M13.3883 6.88257L11.6633 13.3217"
        stroke="var(--color-bg-1)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconCode() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.63798 7.08333L6.69173 10.0296L9.63798 12.9758M13.3884 6.8825L11.6634 13.3217M3.77507 17.5H16.2751C16.3856 17.5 16.4916 17.4561 16.5697 17.378C16.6478 17.2998 16.6917 17.1938 16.6917 17.0833V2.91667C16.6917 2.80616 16.6478 2.70018 16.5697 2.62204C16.4916 2.5439 16.3856 2.5 16.2751 2.5H3.77507C3.66456 2.5 3.55858 2.5439 3.48044 2.62204C3.4023 2.70018 3.3584 2.80616 3.3584 2.91667V17.0833C3.3584 17.1938 3.4023 17.2998 3.48044 17.378C3.55858 17.4561 3.66456 17.5 3.77507 17.5Z"
        stroke="var(--color-text-1)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const locales = {
  'zh-CN': {
    expand: '展开所有代码',
    collapse: '收起所有代码',
  },
  'en-US': {
    expand: 'Expand all code',
    collapse: 'Collapse all code',
  },
};

export default function CellDescription(props) {
  const { isFirst } = props;
  const [expand, setExpand] = useState(false);
  const lang = localStorage.getItem('arco-lang') || 'zh-CN';
  const t = locales[lang];

  function onHandleExpand() {
    const newExpand = !expand;
    const codeEle = document.querySelectorAll('.content-code-design');
    const codeTypeSwitchEle = document.querySelectorAll('.code-type-switch') || [];
    [...Array.from(codeEle), ...Array.from(codeTypeSwitchEle)].forEach((ele) => {
      if (newExpand) {
        ele.classList.add('show-all');
      } else {
        ele.classList.remove('show-all');
      }
    });
    setExpand(newExpand);
  }

  return (
    <div className="ac-description">
      <div className="ac-description-children">{props.children}</div>
      {isFirst && (
        <Tooltip position="left" content={expand ? t.collapse : t.expand}>
          <div
            className="ac-description-expand-icon"
            onClick={onHandleExpand}
            role="button"
            tabIndex={0}
            aria-label={expand ? t.collapse : t.expand}
          >
            {expand ? <IconCodeFill /> : <IconCode />}
          </div>
        </Tooltip>
      )}
    </div>
  );
}
