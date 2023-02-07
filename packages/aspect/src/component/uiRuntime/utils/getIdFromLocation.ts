/**
 * component url comprises letters, numbers, "_", "-", "/"
 * but should not include trailing "/", and should not include "~"
 */
const componentRegex = /^@?[\w/-]*[\w-]/;

export function getIdFromLocation(): string | undefined {
  const splat = window.location.pathname.replace(/^\//, '');
  const match = componentRegex.exec(splat);
  return match?.[0];
}
