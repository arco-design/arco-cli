export function findNode(dom: HTMLElement | Document, selector: string): HTMLElement {
  // handle id start with number
  // e.g. id #123
  const s =
    typeof selector === 'string' && selector[0] === '#'
      ? `[id='${selector.replace('#', '')}']`
      : selector;
  try {
    return dom.querySelector(s);
  } catch (e) {
    console.error(e);
    return null;
  }
}
