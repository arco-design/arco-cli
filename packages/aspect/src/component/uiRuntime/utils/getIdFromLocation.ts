/**
 * this can match component is like package-name/component-name
 * or @scope/package-name/component-name
 */
const componentRegex = /^(@([^/]+)\/)?([^/]+)\/([^/]+)/;

export function getIdFromLocation(): string | undefined {
  const splat = window.location.pathname.replace(/^\//, '');
  const match = componentRegex.exec(splat);
  return match?.[0];
}
