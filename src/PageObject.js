import { render, unmount, fireEvent, prettyDOM } from '@testing-library/react';
import PageSelector from './PageSelector';
import { waitForMe } from './util';


/*
 * Get the provided property on the target
 * PageObject's selector list. If it doesn't
 * exist, log an error.
 *
 * @param {PageObject} target - The PageObject that
 *   should have the given selector.
 * @param {string} prop - The selector we are looking for.
 */
function getSelector(target, prop) {
  if (!target.allSelectors) {
    throw new Error(
      `"${target.constructor.name}.selectors" and ` +
      `"${target.constructor.name}.additionalSelectors" do not exist. ` +
      'Make sure your PageObject defines a selectors property or ' +
      'passes additional selectors to the constructor.'
    );
  }
  const selector = target.allSelectors[prop] || `[data-test=${prop}]`;
  return selector;
};

/*
 * Get the root element from the target PageObject.
 * Log an error if the root element isn't set.
 *
 * @param {PageObject} target - The PageObject that
 *   should have the root element set.
 */
function getRoot(target) {
  if (!target.root) {
    throw new Error(
      `"${target.constructor.name}.root" is not set. ` +
      'Make sure your PageObject is properly configured.'
    );
  }
  return target.root;
};

/*
 * PageObjects allow you to encapsulate the query selector logic
 * for a component/page test into a reusable object. This has the
 * advantage that it:
 *   - Makes tests easier to read by moving selector logic out of tests.
 *   - Makes tests easier to read by providing an English like syntax
 *     for interacting with a component/page.
 *   - Makes test component/page interactions reusable across tests.
 *   - Makes refactoring easier by centralizing selectors in a single place.
 *   - Makes component/page setup/destruction easier by providing convenient
 *     setup/teardown methods.
 *
 *
 * Usage:
 * Generally, it's a good practice to create a custom PageObject specific to the
 * component/page you are testing.
 *
 * ```js
 * export const selectors = {
 *   // Match the element(s) with a `data-test` attribute equal to "myTitle".
 *   title: '[data-test=myTitle]',
 *   // Match the element(s) with the specified `name` attribute.
 *   form: '[name=myForm]',
 *   // Match the input element(s) on the page.
 *   input: 'input',
 *   button: 'button.submit',
 *   other: '.other',
 * };
 *
 * export class MyPageObject extends PageObject {
 *   selectors = selectors;
 * }
 * ```
 *
 * Sandbox setup:
 * For every test, you will want to setup and destroy a sandbox. This
 * is a DOM element in the test runner where components will be rendered
 * and tested.
 *
 * ```js
 * let page;
 *
 * beforeEach(() => {
 *   page = new MyPageObject();
 *
 *   // Render a component into the sandbox.
 *   page.render(<MyComponent />);
 * });
 *
 * afterEach(() => {
 *   page.destroySandbox();
 * });
 * ```
 *
 * Selection:
 * In your tests you can easily select elements.
 *
 * ```js
 * it('should have rendered the component.', () => {
 *   // Here we test an element reference in the DOM.
 *   expect(page.title.element).toEqual(page.root.querySelector(page.selectors.title));
 *
 *   // Your PageObject has getters for each of it's
 *   // selectors (properties on MyPageObject.selectors).
 *   // For example, here we access `page.title` which
 *   // returns a PageSelector instance referencing `MyPageObject.selectors.title`.
 *   // The `element` property on that object is
 *   // an HTMLElement found by querying for `MyPageObject.selectors.title`.
 *
 *   // The title element was found in the DOM.
 *   expect(page.title.exists).toBe(true);
 *
 *   // Count the number of title elements found in the DOM.
 *   expect(page.title.count).toEqual(1);
 *
 *   // Get a NodeList of all the matching title elements in the DOM.
 *   expect(page.title.allElements).toEqual([page.root.querySelector(page.selectors.title]);
 *
 *   // Get the text value of the title element.
 *   expect(page.title.value).toEqual('Foo');
 *   // `text` is an alias to `value`.
 *   expect(page.title.text).toEqual('Foo);
 * });
 * ```
 *
 * Setting Input Value:
 * For INPUT elements, you can also set their value which will
 * trigger an input change event. For non-INPUT elements,
 * setting the value will have no effect but will log an error.
 *
 * ```js
 * it('should be able to change the input value.', () => {
 *   // Set the input element's value property.
 *   page.input.value = 'Foo Bar';
 *
 *   // Here `onChange` is registered in the component using
 *   // something like `<input onChange={onChange} />`
 *   expect(onChange).toHaveBeenCalled();
 *
 *   expect(page.input.value).toEqual('Foo Bar');
 * });
 * ```
 *
 * Interaction:
 * You can interact with elements in a similar manner.
 *
 * ```js
 * it('should be able to interact with the form.', () => {
 *   // Find the `MyPageObject.selectors.button` element and click on it.
 *   page.click.button();
 *
 *   // Submit the myForm form element in the DOM.
 *   page.submit.myForm();
 * });
 * ```
 */
export default class PageObject {
  /*
   * @param {HTMLElement} [root] The DOM element to use as the root
   *   from which DOM selections are made. If you don't pass a root
   *   here, the sandbox element will be used.
   */
  constructor(root, selectors) {
    this._root = root;
    this.sandbox = null;
    this.additionalSelectors = selectors;

    this.sandboxIds = {
      root: 'sandbox-root',
      app: 'sandbox-app',
      styles: 'sandbox-styles',
    };

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
          return new PageSelector(
            getSelector(target, prop),
            getRoot(target),
          );
        }
      }
    });
  }

  // TODO Rename root -> element for consistency with PageSelector
  get root() {
    return this._root ? this._root : this.sandbox;
  }

  get allSelectors() {
    if (this.additionalSelectors) {
      return {
        ...this.selectors,
        ...this.additionalSelectors,
      };
    } else {
      return this.selectors || {};
    }
  }

  /*
   * Render your component into the sandbox. If the sandbox doesn't
   * exist, it will be created for you.
   *
   * @param {JSX} definition The component JSX to render.
   * @param {string} [styles] A CSS string to add test specific
   *   styles to the sandbox. These styles will be removed when
   *   the sandbox is destroyed.
   * @param {string} [additionalDOM] - An HTML string representing
   *   additional DOM elements that need to be rendered alongside
   *   (as opposed to wrapping) the component under test.
   */
  render(definition, styles=null, additionalDOM) {
    if (styles) {
      this.setStyles(styles);
    }

    // The root sandbox where all DOM elements for each test are created.
    this.sandbox = document.createElement('div');
    this.sandbox.setAttribute('id', this.sandboxIds.root);

    // The sandbox where the component under test is created.
    this.sandboxApp = document.createElement('div');
    this.sandboxApp.setAttribute('id', this.sandboxIds.app);

    // Make sure we do this first incase the component under test
    // requires it's existance at construction time.
    if (additionalDOM) {
      // Additional DOM to be rendered alongside the component under test.
      this.sandbox.innerHTML = additionalDOM;
    }

    this.sandbox.appendChild(this.sandboxApp);
    document.body.appendChild(this.sandbox);

    const result = render(definition, {
      container: this.sandboxApp,
    });

    Object.assign(this, result);
    // Remove the container property since that's often used
    // as a selector name.
    delete this.container;

    return this.sandboxApp;
  }

  /*
   * Remove the sandbox element and the custom style element from
   * the DOM and unmount the component under test.
   */
  destroySandbox() {
    this.removeStyles();

    // Remove all sandbox elements.
    document.querySelectorAll(`#${this.sandboxIds.root}`)
      .forEach((node) => node.remove());

    // TODO If render was not called, this will throw an error
    // trying to create a PageSelector for unmount.
    if (typeof(this.unmount) === 'function') this.unmount();

    if (this.sandbox) {
      this.sandbox = null;
      this.sandboxApp = null;
    }
  }

  makeStyleElement() {
    let node = document.createElement('style');
    node.setAttribute('id', this.sandboxIds.styles);
    document.body.appendChild(node);
    return node;
  }

  getStyleElement() {
    return document.body.querySelector(`#${this.sandboxIds.styles}`);
  }

  setStyles(str) {
    let node = this.getStyleElement();
    if (!node) {
      node = this.makeStyleElement();
    }

    node.innerHTML = str;
  }

  removeStyles() {
    document.body.querySelectorAll(`#${this.sandboxIds.styles}`)
      .forEach((node) => node.remove());
  }

  select(selector) {
    return this.root.querySelector(selector);
  }

  selectAll(selector) {
    return this.root.querySelectorAll(selector);
  }

  /*
   * Find the first form on the page and simulate a submit event.
   */
  submit() {
    const form = this.root.querySelector('form');
    fireEvent.submit(form);
  }

  /*
   * Find an element by its `data-test` attribute.
   */
  findByTestName(testName) {
    return this.root.querySelector(`[data-test=${testName}]`);
  }

  /**
   * Wait for the `test` callback to return true.
   */
  waitFor(test, timeout) {
    const selector = this;
    return waitForMe(() => {
      if (!test(selector)) {
        const message = test.toSource ? test.toSource() : test.toString();
        throw new Error(`waitFor timed out waiting for test: ${message} \n${prettyDOM(selector.root)}`);
      }
    }, timeout);
  }

  /*
   * Simulate changing the value of an input.
   * @param {string} value
   * @param {HTMLElement} input
   */
  setInputValue(value, input) {
    input.value = value;
    fireEvent.change(input);
  }

  /*
   * Simulate a click event on an elment.
   */
  clickElement(element) {
    fireEvent.click(element);
  }

  dispatchEvent(element, eventName, eventConstructor = CustomEvent, options = {}) {
    const eventOptions = {
      view: window,
      bubbles: true,
      cancelable: true,
      ...options,
    };
    element.dispatchEvent(new eventConstructor(eventName, eventOptions));
  }

  /**
   * Dispatch a clipboard paste event containing the provided
   * File/Blob objects.
   * @param {File[]|Blob[]} files - The files being pasted.
   * @param {HTMLElement} [element] - The element receiving the event.
   * @param {object} [options] - Any additional options to set on the event.
   * @param {string} [dropEffect] - The dropEffect of the clipboard DataTransfer object.
   * @param {string} [effectAllowed] - The effectAllowed of the clipboard DataTransfer object.
   */
  pasteFiles(files, element = document, options, dropEffect, effectAllowed) {
    element.dispatchEvent(
      createFilePasteEvent(files, options)
    );
  }

  /**
   * Dispatch a clipboard paste event containing the provided
   * urls.
   * @param {string|string[]} urls - The URLs being pasted.
   * @param {HTMLElement} [element] - The element receiving the event.
   * @param {object} [options] - Any additional options to set on the event.
   * @param {string} [dropEffect] - The dropEffect of the clipboard DataTransfer object.
   * @param {string} [effectAllowed] - The effectAllowed of the clipboard DataTransfer object.
   */
  pasteURLs(urls, element = document, options, dropEffect, effectAllowed) {
    element.dispatchEvent(
      createURLPasteEvent(urls, options)
    );
  }

  /**
   * Dispatch a clipboard paste event containing the provided
   * urls.
   * @param {string|string[]} urls - The URLs being pasted.
   * @param {HTMLElement} [element] - The element receiving the event.
   * @param {object} [options] - Any additional options to set on the event.
   * @param {string} [dropEffect] - The dropEffect of the clipboard DataTransfer object.
   * @param {string} [effectAllowed] - The effectAllowed of the clipboard DataTransfer object.
   */
  pasteText(text, element = document, options, dropEffect, effectAllowed) {
    element.dispatchEvent(
      createTextPasteEvent(text, options)
    );
  }

  dragURLs(element, urls, x=0, y=0, done, options) {
    element.dispatchEvent(
      createURLDropEvent('dragenter', urls, x, y, options)
    );

    element.dispatchEvent(
      createURLDropEvent('dragover', urls, x, y, options)
    );

    done();
  }

  /*
   * Simulate a file drop event by triggering
   * dragenter, dragover and drop DOM events.
   *
   * @param {HTMLElement} element - The element to drop onto.
   * @param {string|string[]} urls - The URL(s) to paste.
   * @param {number} x - The x location of the drop event.
   * @param {number} y - The y location of the drop event.
   * @param {function} done - A callback to call once the drop is completed.
   * @param {object} options - Any additional event properties you'd like to set.
   */
  dropURLs(element, urls, x=0, y=0, done, options) {
    this.dragURLs(element, urls, x, y, done, options);

    setTimeout(() => {
      element.dispatchEvent(
        createURLDropEvent('drop', urls, x, y, options)
      );

      setTimeout(done, 60);
    });
  }

  dragText(element, text, x=0, y=0, done, options) {
    element.dispatchEvent(
      createTextDropEvent('dragenter', text, x, y, options)
    );

    element.dispatchEvent(
      createTextDropEvent('dragover', text, x, y, options)
    );

    done();
  }

  /*
   * Simulate a text drop event by triggering
   * dragenter, dragover and drop DOM events.
   *
   * @param {HTMLElement} element - The element to drop onto.
   * @param {string} text - The text to drag and drop.
   * @param {number} x - The x location of the drop event.
   * @param {number} y - The y location of the drop event.
   * @param {function} done - A callback to call once the drop is completed.
   * @param {object} options - Any additional event properties you'd like to set.
   */
  dropText(element, text, x=0, y=0, done, options) {
    this.dragText(element, text, x, y, done, options);

    setTimeout(() => {
      element.dispatchEvent(
        createTextDropEvent('drop', text, x, y, options)
      );

      setTimeout(done, 60);
    });
  }

  dragFiles(element, files, x=0, y=0, done, options) {
    element.dispatchEvent(
      createFileDropEvent('dragenter', files, x, y, options)
    );

    element.dispatchEvent(
      createFileDropEvent('dragover', files, x, y, options)
    );

    done();
  }

  /*
   * Simulate a file drop event by triggering
   * dragenter, dragover and drop DOM events.
   *
   * @param {HTMLElement} element - The element to drop onto.
   * @param {File|File[]} files - The files to drag and drop.
   * @param {number} x - The x location of the drop event.
   * @param {number} y - The y location of the drop event.
   * @param {function} done - A callback to call once the drop is completed.
   * @param {object} options - Any additional event properties you'd like to set.
   */
  dropFiles(element, files, x=0, y=0, done, options) {
    this.dragFiles(element, files, x, y, done, options);

    setTimeout(() => {
      element.dispatchEvent(
        createFileDropEvent('drop', files, x, y, options)
      );

      setTimeout(done, 60);
    });
  }

  /*
   * Simulate a dragging files over an element by triggering
   * dragenter and dragover DOM events.
   */
  // dragFiles(element, files, x=0, y=0) {
  //   const defaultOptions = {
  //     view: window,
  //     bubbles: true,
  //     cancelable: true,
  //   };
  //
  //   const data = {
  //     dropEffect: 'none',
  //     effectsAllowed: 'all',
  //     types: [ 'Files' ],
  //     items: files.map((f) => ({kind: 'file', type: f.type})),
  //     files: files,
  //   };
  //
  //   // Use CustomEvent instances so we can configure the dataTransfer object.
  //   let enterEvent = new CustomEvent('dragenter', defaultOptions);
  //   enterEvent.clientX = x;
  //   enterEvent.clientY = y;
  //   enterEvent.dataTransfer = data;
  //   element.dispatchEvent(enterEvent);
  //
  //   let overEvent = new CustomEvent('dragover', defaultOptions);
  //   overEvent.clientX = x;
  //   overEvent.clientY = y;
  //   overEvent.dataTransfer = data;
  //   element.dispatchEvent(overEvent);
  // }

  /*
   * Simulate a file drop event by triggering
   * dragenter, dragover and drop DOM events.
   *
   * @param {HTMLElement} element - The element to drop onto.
   * @param {string} text - The text containing the url(s).
   * @param {number} x - The x location of the drop event.
   * @param {number} y - The y location of the drop event.
   * @param {function} done - A callback to call once the drop is completed.
   * @param {object} options - Any additional event properties you'd like to set.
   */
  // dropURLs(element, text, x=0, y=0, done, options) {
  //   let enterEvent = createURLDropEvent('dragenter', text, x, y, options);
  //   element.dispatchEvent(enterEvent);
  //
  //   let overEvent = createURLDropEvent('dragover', text, x, y, options);
  //   element.dispatchEvent(overEvent);
  //
  //   setTimeout(() => {
  //     let dropEvent = createURLDropEvent('drop', text, x, y, options);
  //     element.dispatchEvent(dropEvent);
  //
  //     setTimeout(done, 60);
  //   });
  // }


  /*
   * Simulate a file drop event by triggering
   * dragenter, dragover and drop DOM events.
   */
  // dropFiles(element, files, x=0, y=0, done) {
  //   const defaultOptions = {
  //     view: window,
  //     bubbles: true,
  //     cancelable: true,
  //   };
  //
  //   const data = {
  //     dropEffect: 'none',
  //     effectsAllowed: 'all',
  //     types: [ 'Files' ],
  //     items: files.map((f) => ({kind: 'file', type: f.type})),
  //     files: files,
  //   };
  //
  //   // Use CustomEvent instances so we can configure the dataTransfer object.
  //   let enterEvent = new CustomEvent('dragenter', defaultOptions);
  //   enterEvent.clientX = x;
  //   enterEvent.clientY = y;
  //   enterEvent.dataTransfer = data;
  //   element.dispatchEvent(enterEvent);
  //
  //   let overEvent = new CustomEvent('dragover', defaultOptions);
  //   overEvent.clientX = x;
  //   overEvent.clientY = y;
  //   overEvent.dataTransfer = data;
  //   element.dispatchEvent(overEvent);
  //
  //   setTimeout(() => {
  //     let dropEvent = new CustomEvent('drop', defaultOptions);
  //     dropEvent.clientX = x;
  //     dropEvent.clientY = y;
  //     dropEvent.dataTransfer = data;
  //     element.dispatchEvent(dropEvent);
  //
  //     setTimeout(done, 60);
  //   });
  // }

  /**
   * Drag and drop one element over another.
   * @param {HTMLElement} element - the element being dragged.
   * @param {Number} deltaX - the number of pixes to move the element in the x direction.
   * @param {Number} deltaY - the number of pixes to move the element in the y direction.
   * @param {HTMLElement} dropTarget - the target onto which element is being dropped.
   * @param {Function} done - a callback for once all events have been dispatched.
   */
  dragAndDropElement(element, deltaX, deltaY, dropTarget, done) {
    // Seeing intermittent issues with this in Firefox:
    // https://github.com/react-dnd/react-dnd/issues/714
    // Use a try catch and then re-trigger the drop event?
    const defaultOptions = {
      view: window,
      bubbles: true,
      cancelable: true,
    };
    const parent = dropTarget ? dropTarget : element.parentElement;
    let rect = element.getBoundingClientRect();
    let clientStartX = rect.x;
    let clientStartY = rect.y;
    let clientEndX = clientStartX + deltaX;
    let clientEndY = clientStartY + deltaY;

    // Pin emits a drag start event.
    let startEvent = new DragEvent('dragstart', {
      ...defaultOptions,
      clientX: clientStartX,
      clientY: clientStartY,
      screenX: clientStartX,
      screenY: clientStartY,
    });
    element.dispatchEvent(startEvent);

    // parent emits a drag enter event as the pin first moves over the map.
    let enterEvent = new DragEvent('dragenter', {
      ...defaultOptions,
      clientX: clientStartX,
      clientY: clientStartY,
      screenX: clientStartX,
      screenY: clientStartY,
    });
    parent.dispatchEvent(enterEvent);

    // parent emits a drag over event as the pin moves over the map.
    let overEvent = new DragEvent('dragover', {
      ...defaultOptions,
      clientX: clientStartX + deltaX/2,
      clientY: clientStartY + deltaY/2,
      screenX: clientStartX + deltaX/2,
      screenY: clientStartY + deltaY/2,
    });
    parent.dispatchEvent(overEvent);

    const doDrop = () => {
      // parent emits a drop event once the pin is dropped.
      let dropEvent = new DragEvent('drop', {
        ...defaultOptions,
        clientX: clientEndX,
        clientY: clientEndY,
        screenX: clientEndX,
        screenY: clientEndY,
      });
      parent.dispatchEvent(dropEvent);

      // pin emits a drag end event after being dropped.
      let endEvent = new DragEvent('dragend', {
        ...defaultOptions,
        clientX: clientEndX,
        clientY: clientEndY,
        screenX: clientEndX,
        screenY: clientEndY,
      });
      element.dispatchEvent(endEvent);

      setTimeout(done, 60);
    };

    setTimeout(() => {
      try {
        doDrop();
      } catch (error) {
        console.warn('File drop failed with the following error (see https://github.com/react-dnd/react-dnd/issues/714).', error);
        console.warn('Attempting drop again....');
        doDrop();
      }
    });
  }
}

/**
 * Create the DataTransfer object for a text paste event.
 * @param {string} text - The text to paste
 * @param {string} [dropEffect]
 * @param {string} [effectAllowed]
 * @return {DataTransfer}
 */
function createTextDataTransfer(text, dropEffect = 'none', effectAllowed = 'all') {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(text, 'text/plain');
  dataTransfer.dropEffect = dropEffect;
  dataTransfer.effectAllowed = effectAllowed;
  return dataTransfer;
}

/**
 * Create the DataTransfer object for a URL paste event.
 * @param {string} text - The text to paste
 * @param {string} [dropEffect]
 * @param {string} [effectAllowed]
 * @return {DataTransfer}
 */
function createURLDataTransfer(text, dropEffect = 'none', effectAllowed = 'all') {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(text, 'text/uri-list');
  dataTransfer.dropEffect = dropEffect;
  dataTransfer.effectAllowed = effectAllowed;
  return dataTransfer;
}

/**
 * Create the DataTransfer object for a file paste event.
 * @param {File|File[]} files - The file(s) to paste.
 * @param {string} [dropEffect]
 * @param {string} [effectAllowed]
 * @return {DataTransfer}
 */
function createFileDataTransfer(files, dropEffect = 'none', effectAllowed = 'all') {
  const dataTransfer = new DataTransfer();
  files.forEach(file => dataTransfer.items.add(file));
  dataTransfer.dropEffect = dropEffect;
  dataTransfer.effectAllowed = effectAllowed;
  return dataTransfer;
}

/**
 * Create a file paste ClipboardEvent.
 * @param {File|File[]} files - The file(s) being pasted.
 * @param {object} [options] - Any options you'd like to add to the event object.
 * @param {string} [dropEffect] - The dropEffect of the clipboard DataTransfer object.
 * @param {string} [effectAllowed] - The effectAllowed of the clipboard DataTransfer object.
 * @return {ClipboardEvent}
 */
function createFilePasteEvent(
  files,
  options,
  dropEffect = 'none',
  effectAllowed = 'uninitialized'
) {
  files = Array.isArray(files) ? files : [files];

  return new ClipboardEvent('paste', {
    clipboardData: createFileDataTransfer(files, dropEffect, effectAllowed),
    ...options
  });
}

/**
 * Create a text paste ClipboardEvent.
 * @param {string} text - The text to paste.
 * @param {object} [options] - Any options you'd like to add to the event object.
 * @param {string} [dropEffect] - The dropEffect of the clipboard DataTransfer object.
 * @param {string} [effectAllowed] - The effectAllowed of the clipboard DataTransfer object.
 * @return {ClipboardEvent}
 */
function createTextPasteEvent(
  text,
  options,
  dropEffect = 'none',
  effectAllowed = 'uninitialized'
) {
  return new ClipboardEvent('paste', {
    clipboardData: createTextDataTransfer(text, dropEffect, effectAllowed),
    ...options,
  });
}

/**
 * Create a URL paste ClipboardEvent.
 * @param {string|string[]} urls - The URL(s) to paste.
 * @param {object} [options] - Any options you'd like to add to the event object.
 * @param {string} [dropEffect] - The dropEffect of the clipboard DataTransfer object.
 * @param {string} [effectAllowed] - The effectAllowed of the clipboard DataTransfer object.
 * @return {ClipboardEvent}
 */
function createURLPasteEvent(
  urls,
  options,
  dropEffect = 'none',
  effectAllowed = 'uninitialized'
) {
  urls = !Array.isArray(urls)
    ? urls
    : urls
        // text/uri-list lines starting with # are comments.
        .filter(u => !u.startsWith('#'))
        // URLs are separated by line.
        .join('\n');

  return new ClipboardEvent('paste', {
    clipboardData: createURLDataTransfer(urls, dropEffect, effectAllowed),
    ...options,
  });
}

/**
 * Create a text drag or drop event.
 * @param {string} eventType - The name of the event being dispatched (ex. dragstart, drop).
 * @param {string} text - The text to drag or drop.
 * @param {number} [x] - The x location of the drag/drop event.
 * @param {number} [y] - The y location of the drag/drop event.
 * @param {object} [options] - Any additional options to set on the event.
 * @return {CustomEvent}
 */
function createTextDropEvent(eventType, text, x, y, options) {
  // Use CustomEvent instances so we can configure the dataTransfer object.
  const event = new CustomEvent(eventType, {
    clientX: x,
    clientY: y,
    view: window,
    bubbles: true,
    cancelable: true,
    ...options,
  });

  // For some reason the data transfer doesn't get set
  // correctly if it is set through the event contructor.
  event.dataTransfer = createTextDataTransfer(text);

  return event;
}

/**
 * Create a URL drag or drop event.
 * @param {string} eventType - The name of the event being dispatched (ex. dragstart, drop).
 * @param {string|string[]} urls - The URL(s) to drop.
 * @param {number} [x] - The x location of the drag/drop event.
 * @param {number} [y] - The y location of the drag/drop event.
 * @param {object} [options] - Any additional options to set on the event.
 * @return {CustomEvent}
 */
function createURLDropEvent(eventType, data, x, y, options) {
  // Use CustomEvent instances so we can configure the dataTransfer object.
  const event = new CustomEvent(eventType, {
    clientX: x,
    clientY: y,
    view: window,
    bubbles: true,
    cancelable: true,
    ...options,
  });

  // For some reason the data transfer doesn't get set
  // correctly if it is set through the event contructor.
  event.dataTransfer = createURLDataTransfer(data);

  return event;
}

/**
 * Create a file drag or drop event.
 * @param {string} eventType - The name of the event being dispatched (ex. dragstart, drop).
 * @param {File|File[]} files - The files to drag or drop.
 * @param {number} [x] - The x location of the drag/drop event.
 * @param {number} [y] - The y location of the drag/drop event.
 * @param {object} [options] - Any additional options to set on the event.
 * @return {CustomEvent}
 */
function createFileDropEvent(eventType, files, x, y, options) {
  // Use CustomEvent instances so we can configure the dataTransfer object.
  const event = new CustomEvent(eventType, {
    clientX: x,
    clientY: y,
    view: window,
    bubbles: true,
    cancelable: true,
    ...options,
  });

  // For some reason the data transfer doesn't get set
  // correctly if it is set through the event contructor.
  event.dataTransfer = createFileDataTransfer(files);

  return event;
}

