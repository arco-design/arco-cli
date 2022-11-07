import { ComponentModel } from '@arco-cli/component/dist/ui';

/**
 * Optionally append prefix/postfix to a string.
 */
function affix(prefix = '', str = '', suffix = '') {
  if (!str) return '';
  return `${prefix}${str}${suffix}`;
}

/**
 * creates component preview arguments
 */
function toPreviewHash(
  /**
   * component to preview
   */
  component: ComponentModel,
  /**
   * current preview (docs, compositions, etc)
   */
  previewName?: string,
  /**
   * extra data to append to query
   */
  queryParams: string | string[] = ''
) {
  const previewParam = affix(`preview=`, previewName);
  const hashQuery = [previewParam]
    .concat(queryParams)
    .filter((x) => !!x) // also removes empty strings
    .join('&');
  return `${component.id}${affix('?', hashQuery)}`;
}

/**
 * generates a full url to a preview (overview / docs etc)
 */
export function toPreviewUrl(
  component: ComponentModel,
  previewName?: string,
  additionalParams?: string | string[]
) {
  const serverPath = component.server.url;
  const hash = toPreviewHash(component, previewName, additionalParams);
  return `${serverPath}#${hash}`;
}
