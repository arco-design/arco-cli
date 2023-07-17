const NOOP = () => {};

export const isServerRendering = (function () {
  try {
    return !(typeof window !== 'undefined' && document !== undefined);
  } catch (e) {
    return true;
  }
})();

export const on = (function () {
  if (isServerRendering) {
    return NOOP;
  }
  return function (
    element: EventTarget | null,
    event: string,
    // eslint-disable-next-line no-undef
    handler: EventListenerOrEventListenerObject,
    // eslint-disable-next-line no-undef
    options?: boolean | AddEventListenerOptions
  ) {
    element && element.addEventListener(event, handler, options || false);
  };
})();

export const off = (function () {
  if (isServerRendering) {
    return NOOP;
  }
  return function (
    element: EventTarget | null,
    event: string,
    // eslint-disable-next-line no-undef
    handler: EventListenerOrEventListenerObject,
    // eslint-disable-next-line no-undef
    options?: boolean | AddEventListenerOptions
  ) {
    element && element.removeEventListener(event, handler, options || false);
  };
})();

export const contains = function (root: HTMLElement, ele) {
  if (!root) {
    return false;
  }
  if (root.contains) {
    return root.contains(ele);
  }
  let node = ele;
  while (node) {
    if (node === root) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};

export const isScrollElement = (element: HTMLElement) => {
  const clientHeight =
    element === document.documentElement ? element.clientHeight : element.offsetHeight;
  const clientWidth =
    element === document.documentElement ? element.clientWidth : element.offsetWidth;

  return element.scrollHeight > clientHeight || element.scrollWidth > clientWidth;
};

export const getScrollElements = (
  container: HTMLElement,
  top: HTMLElement = document.documentElement
): HTMLElement[] => {
  const scrollElements: HTMLElement[] = [];
  let element: HTMLElement | null = container;
  while (element && element !== top) {
    if (isScrollElement(element)) {
      scrollElements.push(element);
    }
    element = element.parentElement;
  }
  return scrollElements;
};
