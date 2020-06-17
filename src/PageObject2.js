import {
  render as libRender,
  prettyDOM,
} from '@testing-library/react';

function getContainer(root) {
  return typeof(root) === 'string'
    // TODO Use the render root rather than body.
    ? document.body.querySelector(root)
    : typeof(root) === 'function'
    ? root()
    : root;
}

function notFoundMessage(selector, index, container) {
  return `Could not find a element matching ${selector} and index ${index} within: \n${prettyDOM(container)}`;
}

function selectAsFunction(root, selector, index = 0) {
  const c = getContainer(root);
  if (!c) {
    throw new Error(`Unable to find container to select within. Received: \n${root}`);
  }

  const list = selector(c, index);
  if (!list || list.length === 0 || index > list.length - 1 || index < 0) {
    throw new Error(notFoundMessage(selector, index, c));
  } else if (list.length > 0) {
    return list[index];
  } else {
    return list;
  }
}

export function selectAsString(root, selector, index = 0) {
  const c = getContainer(root);
  if (!c) {
    throw new Error(`Unable to find container to select within. Received ${root}`);
  }

  const list = c.querySelectorAll(selector);
  if (!list || list.length === 0) {
    // If root matches what we are searching for, return root.
    const fromParent = c.parentElement.querySelector(selector);
    if (fromParent === c) {
      return c;
    } else {
      throw new Error(notFoundMessage(selector, index, c));
    }
  } else if (index > list.length - 1 || index < 0) {
    throw new Error(notFoundMessage(selector, index, c));
  } else if (list.length > 0) {
    return list[index];
  } else {
    return list;
  }
  // const s = makeSelector(['.title', '.body'])
  // s.title.text
  // If selector = array, return selector
}

export function makeSelector(selector, root = document.body, index = 0) {
  const s = (i) => {
    return makeSelector(selector, root, i);
  }

  Object.defineProperty(s, 'element', {
    get: function() {
      if (typeof(selector) === 'function') {
        return selectAsFunction(root, selector, index);
      } else if (typeof(selector) === 'string') {
        return selectAsString(root, selector, index);
      } else {
        return selector;
      }
    }
  });

  Object.defineProperty(s, 'text', {
    get: function() {
      return s.element.textContent.trim();
    }
  });

  s.click = () => {
    s.element.click();
  }

  s.forEach = (cb) => {
    // Select all matching elements
    // Call the callback for each one with
    // 1. a selector wrapping the element
    // 2. the index
    // 3. the parent selector?
  }

  // TODO Find a way to deal with nested selectors.
  // For Example, given:
  // class Card extends PageObject {}
  // class CardList extends PageObject {}
  // class PageWithCards extends PageObject {}
  //
  // How do I select:
  // PageWithCards.CardList.Card(2).title
  //
  // It would also be awesome if we could check for the
  // existance of the root level page selector:
  // PageWithCards.await --> waits for the root selector to be added to the DOM
  // PageWithCards.exists --> checks that root is defined
  // PageWithCards.CardList.exists --> checks that the root element that CardList wraps exists

  // return s;
  return new Proxy(s, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      } else {
        // Foward to the underlying element
        const element = target.element;
        const attr = element[prop];
        if (!attr) {
          return;
        } else if (typeof(attr) === 'function') {
          return attr.bind(element);
        } else {
          return attr;
        }
      }
    }
  });
}

export class PageO {
  constructor(selectors, container = document.body) {
    this.container = container;
    this.selectors = {};
    this.additionalSelectors = selectors;

    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target) {
          if (target.allSelectors[prop]) {
            console.warn(
              `Selector name "${prop}" conflicts with an existing PageObject property.
               Consider renaming "selectors.${prop}".`
            )
          }
          return Reflect.get(target, prop, receiver);
        } else {
          if (prop in target.allSelectors) {
            const value = target.allSelectors[prop];
            if (value instanceof PageO) {
              return value;
            } else {
              return makeSelector(target.allSelectors[prop], container);
            }
          } else {
            return makeSelector(`[data-testid=${prop}]`, container);
          }
        }
      }
    });
  }

  get allSelectors() {
    return {
      ...this.selectors,
      ...this.additionalSelectors,
    }
  }

  get element() {
    return getContainer(this.container);
  }

  // render(component) {
  //   this.lib = render(component);
  // }
  //
  // getByText(text) {
  //   return makeSelector(() => this.lib.getByText(text));
  // }
}

