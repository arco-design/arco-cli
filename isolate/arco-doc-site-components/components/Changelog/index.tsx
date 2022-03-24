import React, { useState } from 'react';
import { Space, Select, DatePicker, Empty, Tag } from '@arco-design/web-react';
import './style/index.less';

const { RangePicker } = DatePicker;

const compareVersion = (v1: string, v2: string) => {
  const mainArray1 = v1.split('-');
  const mainArray2 = v2.split('-');

  const array1 = mainArray1[0].split('.');
  const array2 = mainArray2[0].split('.');
  for (let i = 0; i < 3; i++) {
    if (array1[i] !== array2[i]) {
      return parseInt(array1[i] ?? '0') > parseInt(array2[i] ?? '0') ? 1 : -1;
    }
  }
  return 0;
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'attention':
      return '⚠️';
    case 'optimization':
      return '💎';
    case 'feature':
      return '🆕';
    case 'bugfix':
      return '🐛';
    case 'style':
      return '💅';
    case 'typescript':
      return '🆎';
    case 'chore':
      return '🛠';
    default:
      return '';
  }
};

const locales = {
  'zh-CN': {
    version: '按版本',
    date: '按日期',
    attention: '重点注意',
    optimization: '功能优化',
    feature: '功能升级',
    bugfix: '问题修复',
    style: '样式更新',
    typescript: '类型修正',
    chore: '架构改动',
  },
  'en-US': {
    version: 'By version',
    date: 'By Date',
    attention: 'Attention',
    optimization: 'Enhancement',
    feature: 'Feature',
    bugfix: 'Bugfix',
    style: 'Style',
    typescript: 'Typescript',
    chore: 'Chore',
  },
};

export default function Changelog({ changelog }) {
  // @ts-ignore
  const [rangeType, setRangeType] = useState('version');
  // @ts-ignore
  const [start, setStart] = useState('');
  // @ts-ignore
  const [end, setEnd] = useState('');
  // @ts-ignore
  const [types, setTypes] = useState([
    'feature',
    'bugfix',
    'style',
    'typescript',
    'optimization',
    'attention',
    'chore',
  ]);
  const lang = localStorage.getItem('arco-lang') || 'zh-CN';
  const t = locales[lang];

  const versions = changelog.map((item) => item.version);

  const displayChangelog = changelog.reduce((pre, value) => {
    if (rangeType === 'version') {
      if (
        (start && compareVersion(start, value.version) === 1) ||
        (end && compareVersion(value.version, end) === 1)
      ) {
        return pre;
      }
    } else if ((start && value.date < start) || (end && value.date > end)) {
      return pre;
    }

    const data = {
      version: value.version,
      date: value.date,
      changelog: [],
    };
    for (const type of types) {
      if (value[type]) {
        data.changelog.push({
          type,
          content: value[type],
        });
      }
    }
    if (data.changelog.length > 0) {
      pre.push(data);
    }
    return pre;
  }, []);

  return (
    <div className="changelog-wrapper">
      <div className="changelog-header">
        <Space size="large">
          <Select
            value={rangeType}
            style={{ width: 100 }}
            options={[
              { value: 'version', label: t.version },
              { value: 'time', label: t.date },
            ]}
            onChange={(value) => {
              setRangeType(value);
              setStart('');
              setEnd('');
            }}
          />
          {rangeType === 'version' ? (
            <Space>
              <Select
                value={start}
                style={{ width: 100 }}
                options={[...versions].reverse()}
                onChange={(value) => {
                  setStart(value);
                }}
              />
              {lang === 'en-US' ? 'To' : '至'}
              <Select
                value={end}
                style={{ width: 100 }}
                options={versions}
                onChange={(value) => {
                  setEnd(value);
                }}
              />
            </Space>
          ) : (
            <RangePicker
              value={[start, end]}
              style={{ width: 230 }}
              onChange={(date) => {
                setStart(date[0]);
                setEnd(date[1]);
              }}
              getPopupContainer={() => document.body}
            />
          )}
          <Select
            mode="multiple"
            style={{ width: 320 }}
            options={[
              { label: t.feature, value: 'feature' },
              { label: t.bugfix, value: 'bugfix' },
              { label: t.style, value: 'style' },
              { label: t.typescript, value: 'typescript' },
              { label: t.optimization, value: 'optimization' },
              { label: t.attention, value: 'attention' },
              { label: t.chore, value: 'chore' },
            ]}
            maxTagCount={2}
            value={types}
            onChange={(value) => {
              setTypes(value);
            }}
            renderTag={(props) => {
              let color;
              switch (props.value) {
                case 'feature':
                  color = 'orangered';
                  break;
                case 'bugfix':
                  color = 'magenta';
                  break;
                case 'style':
                  color = 'purple';
                  break;
                case 'typescript':
                  color = 'arcoblue';
                  break;
                case 'optimization':
                  color = 'green';
                  break;
                case 'attention':
                  color = 'red';
                  break;
                case 'chore':
                  color = 'cyan';
                  break;
                default:
                  color = 'gray';
              }
              return (
                <Tag color={color} style={{ margin: '2px 6px 2px 0' }}>
                  {props.label}
                </Tag>
              );
            }}
          />
        </Space>
      </div>
      <div className="changelog-content">
        {displayChangelog.map((item) => (
          <div className="changelog-item" key={item.version}>
            <h2 className="changelog-version">{item.version}</h2>
            <p>{item.date}</p>
            {item.changelog.map((cl) => (
              <React.Fragment key={cl.type}>
                <div className="changelog-type">
                  <span className="changelog-type-icon">{getTypeIcon(cl.type)}</span>
                  {cl.type.slice(0, 1).toUpperCase() + cl.type.slice(1)}
                </div>
                <ul className="changelog-list">
                  {cl.content.map((text, index) => (
                    <li
                      key={index}
                      className="changelog-text"
                      dangerouslySetInnerHTML={{ __html: text }}
                    />
                  ))}
                </ul>
              </React.Fragment>
            ))}
          </div>
        ))}
        {displayChangelog.length === 0 && <Empty />}
      </div>
    </div>
  );
}
