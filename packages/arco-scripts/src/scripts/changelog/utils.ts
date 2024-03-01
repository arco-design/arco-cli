const componentList = [
  'common',
  'Common',
  'Alert',
  'Anchor',
  'Affix',
  'AutoComplete',
  'Avatar',
  'BackTop',
  'Badge',
  'Breadcrumb',
  'Button',
  'Calendar',
  'Card',
  'Carousel',
  'Cascader',
  'Checkbox',
  'Collapse',
  'Comment',
  'ConfigProvider',
  'DatePicker',
  'Descriptions',
  'Divider',
  'Drawer',
  'Dropdown',
  'Empty',
  'Form',
  'Grid',
  'Icon',
  'Input',
  'InputTag',
  'InputNumber',
  'Layout',
  'Link',
  'List',
  'Message',
  'Menu',
  'Modal',
  'Notification',
  'PageHeader',
  'Pagination',
  'Popconfirm',
  'Popover',
  'Portal',
  'Progress',
  'Radio',
  'Rate',
  'ResizeBox',
  'Result',
  'Select',
  'Skeleton',
  'Slider',
  'Space',
  'Spin',
  'Statistic',
  'Steps',
  'Switch',
  'Table',
  'Tabs',
  'Tag',
  'Timeline',
  'TimePicker',
  'Tooltip',
  'Transfer',
  'Tree',
  'TreeSelect',
  'Trigger',
  'Typography',
  'Upload',
  'Mentions',
  'Image',
  'Watermark',
  'ColorPicker',
  'VerificationCode',
];

export const isValidComponent = (component: string) => {
  return componentList.includes(component);
};

const getVersionNumber = (version: string): number => {
  if (!version) {
    return 0;
  }
  switch (version) {
    case 'alpha':
      return -3;
    case 'beta':
      return -2;
    case 'rc':
      return -1;
    default:
      return parseInt(version);
  }
};

export const compareVersion = (v1: string, v2: string) => {
  const mainArray1 = v1.split('-');
  const mainArray2 = v2.split('-');
  // Major version
  const array1 = mainArray1[0].split('.');
  const array2 = mainArray2[0].split('.');
  const maxL = Math.max(array1.length, array2.length);
  for (let i = 0; i < maxL; i++) {
    const v1 = getVersionNumber(array1[i]);
    const v2 = getVersionNumber(array2[i]);
    if (v1 !== v2) {
      return v1 > v2 ? 1 : -1;
    }
  }

  // Beta part
  const subArray1 = (mainArray1[1] ?? '').split('.');
  const subArray2 = (mainArray2[1] ?? '').split('.');
  const maxSL = Math.max(subArray1.length, subArray2.length);
  for (let i = 0; i < maxSL; i++) {
    const v1 = getVersionNumber(subArray1[i]);
    const v2 = getVersionNumber(subArray2[i]);
    if (v1 !== v2) {
      return v1 > v2 ? 1 : -1;
    }
  }

  return 0;
};
