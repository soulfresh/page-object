import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';

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
  if (!target.selectors) {
    throw new Error(
      `"${target.constructor.name}.selectors" does not exist. ` +
      'Make sure your PageObject defines a selectors property.'
    );
  }
  const selector = target.allSelectors[prop];
  if (!selector) {
    throw new Error(
      `"${target.constructor.name}.selectors.${prop}" does not exist. ` +
      "Make sure you've defined that selector in your PageObject's selector list. " +
      'The current selector list is: '
      , target.allSelectors
    );
  }
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
 * An object that is configured to interact with a specific
 * element in the DOM. You shouldn't have to use this class
 * directly as it is returned by PageObject for you.
 */
export class PageSelector {
  constructor(selector, root) {
    this.selector = selector;
    this.root = root;
  }

  /*
   * Get the HTMLElement associated with this proxy.
   */
  get element() {
    return this.root.querySelector(this.selector);
  }

  /*
   * Get a list of HTMLElements in the DOM that match
   * the selector for this proxy.
   */
  get allElements() {
    return this.root.querySelectorAll(this.selector);
  }

  /*
   * Get an element at a specific index (assuming the current
   * selector matches more than one element). If there is only
   * one element matching the selector and you ask for index 0,
   * you will get that single element. If the selector returns
   * no elements or it returns a single element and you asked for
   * element 2+, this function will return null and will log an error.
   */
  elementAt(index) {
    const elements = this.allElements;
    if (elements && elements.length && elements.length >= index) {
      return elements[index];
    } else if (index === 0) {
      return this.element;
    } else {
      const message = `Could not find a ${this.selector} element ` +
        `at index ${index} because there are ${elements.length} ` +
        `elements inside of`;
      console.error(message, this.root);
      return null;
    }
  }

  /*
   * Get a PageSelector configured to select against the
   * nth element in root.
   *
   * Example:
   * page.input.nthChild(2).value = 'foo';
   */
  nthChild(index) {
    const nthChildSelector = `${this.selector}:nth-child(${index})`;
    return new PageObject(nthChildSelector, this.root);
  }

  /*
   * Count the number of elements in the DOM that match
   * this proxy.
   */
  get count() {
    return this.allElements.length;
  }

  /*
   * Determine if this proxy has a representation in the DOM.
   */
  get exists() {
    return !!this.element;
  }

  /*
   * Get the text content of this selector.
   */
  get text() {
    return this.value;
  }

  /*
   * Get the classList object for the element matching
   * this selector.
   */
  get classList() {
    return this.element.classList;
  }

  /*
   * Check if the element matching the current selector
   * has a specific class name.
   */
  hasClass(className) {
    return this.classList.contains(className);
  }

  /*
   * Check if the element has a 'disabled' attribute.
   */
  get disabled() {
    const el = this.element;
    if (el) {
      return el.hasAttribute('disabled');
    }
    return false;
  }

  getValueForElement(element) {
    if (element) {
      const tag = element.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return element.value;
      } else {
        return element.textContent.trim();
      }
    } else {
      return undefined;
    }
  }

  /*
   * Get the text value or input value of this selector.
   * If the target element is an INPUT, then this returns
   * the `value` property of that INPUT. Otherwise, it
   * returns the trimmed text content.
   */
  get value() {
    return this.getValueForElement(this.element);
  }

  /*
   * Set the value of this selector if it points to
   * an INPUT element. If the selector points to something
   * other than an INPUT, then this setter has no effect.
   */
  set value(value) {
    const el = this.element;
    if (el) {
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        el.value = value;
        Simulate.change(el);
        return;
      } else {
        console.error(`Cannot set the value of a non-input element. Tried to set ${this.selector} to ${value}.`);
        return;
      }
    }
    console.error(`${this.selector} does not exist and thus cannot be set to ${value}.`);
  }

  /*
   * Get the value/textContent of all direct children.
   */
  get childValues() {
    const elements = this.allElements;
    if (elements && elements.length > 0) {
      return Array.from(elements).map((e) => this.getValueForElement(e));
    } else {
      return [];
    }
  }

  /*
   * Determine if the current element has focus.
   */
  get focused() {
    return document.activeElement === this.element;
  }

  focus() {
    this.simulateAction('focus', this.element);
  }

  blur() {
    this.simulateAction('blur', this.element);
  }

  /*
   * @private
   * Simulate an action on a specific element.
   */
  simulateAction(action, element) {
    const el = element || this.element;
    if (el) {
      Simulate[action](el);
      return true;
    }

    return false;
  }

  /*
   * @private
   * Click on a specific element.
   */
  clickElement(el) {
    switch (el.tagName) {
      case 'INPUT':
        if (el.type !== 'submit') {
          return this.simulateAction('change', el);
        } else {
          return this.simulateAction('submit', el);
        }
      case 'BUTTON':
        if (el.type === 'submit') {
          return this.simulateAction('submit', el);
        } else {
          return this.simulateAction('click', el);
        }
      default:
        return this.simulateAction('click', el);
    }
  }

  /*
   * Click on the first element that matches this selector.
   */
  click() {
    const el = this.element;
    return this.clickElement(el);
  }

  /*
   * Perform a click action on the Nth item that matches
   * the current selector.
   */
  clickNth(index) {
    const elements = this.allElements;
    if (elements.length <= index) {
      console.error(`${this.selector} index ${index} does not exist and thus cannot be clicked.`);
    } else {
      return this.clickElement(elements[index]);
    }
  }

  /*
   * Simulate a submit event on the element matching the current selector.
   */
  submit() {
    return this.simulateAction('submit');
  }

  /*
   * Press the enter key while the current element is focused.
   */
  pressEnter() {
    Simulate.keyDown(this.element, {keyCode: 13});
    Simulate.keyUp(this.element, {keyCode: 13});
  }
}

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
 * Generally, you will want to create a custom PageObject specific to the
 * component/page you are testing.
 *
 * ```js
 * class MyPageObject extends PageObject {
 *   selectors = {
 *     title: '[data-test=myTitle]',
 *     form: '[name=myForm]',
 *     input: 'input',
 *     button: 'button.submit',
 *     other: '.other',
 *   }
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
 *   expect(page.title.element).toEqual(page.root.querySelector(page.selectors.title);
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
 *
 * Composition:
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

    return new Proxy(this, {
      get(target, prop, receiver) {
        if (target[prop] !== undefined) {
          if (target.allSelectors[prop]) {
            console.warn(
              `Selector name "${prop}" conflicts with an existing PageObject property.
               Consider renaming "selectors.${prop}".`
            )
          }
          return target[prop];
        } else {
          return new PageSelector(
            getSelector(target, prop),
            getRoot(target),
          );
        }
      }
    });
  }

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
   * @param {Function} [done] A callback that will be called after
   *   the component has been rendered by ReactDOM.
   * @param {string} [styles] A CSS string to add test specific
   *   styles to the sandbox. These styles will be removed when
   *   the sandbox is destroyed.
   * @param {boolean} [reuse=false] False = create a fresh sandbox DOM.
   *   True = reuse the existing sandbox.
   * @param {HTMLElement} [parent] The parent into which the component
   *   will be rendered. Defaults to the sandbox root.
   */
  render(definition, done, styles=null, reuse=false, parent=null) {
    if (!reuse) {
      this.prepareSandbox(reuse);
    }

    if (styles) {
      this.setStyles(styles);
    }

    parent = parent || this.sandbox;

    act(() => {
      ReactDOM.render(definition, parent, done);
    });
  }

  /*
   * Re-render an existing component; for example when you want to
   * change it's props.
   */
  rerender(definition, done, parent=null) {
    this.render(definition, done, undefined, true, parent);
  }

  /*
   * Remove the sandbox element and the custom style element from
   * the DOM and unmount the component under test.
   */
  destroySandbox() {
    this.removeStyles();

    if (this.sandbox) {
      ReactDOM.unmountComponentAtNode(this.sandbox);
      this.sandbox.remove();
      this.sandbox = null;
    }
  }

  makeStyleElement() {
    let node = document.createElement('style');
    node.setAttribute('id', 'floorplan-styles');
    document.body.appendChild(node);
    return node;
  }

  getStyleElement() {
    return document.body.querySelector('#floorplan-styles');
  }

  setStyles(str) {
    let node = this.getStyleElement();
    if (!node) {
      node = this.makeStyleElement();
    }

    node.innerHTML = str;
  }

  removeStyles() {
    let node = this.getStyleElement();
    if (node) {
      node.remove();
    }
  }

  prepareSandbox() {
    this.destroySandbox();
    this.sandbox = document.createElement('div');
    this.sandbox.setAttribute('id', 'sandbox-root');
    document.body.appendChild(this.sandbox);
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
    Simulate.submit(form);
  }

  /*
   * Find an element by its `data-test` attribute.
   */
  findByTestName(testName) {
    return this.root.querySelector(`[data-test=${testName}]`);
  }

  /*
   * Simulate changing the value of an input.
   * @param {string} value
   * @param {HTMLElement} input
   */
  setInputValue(value, input) {
    input.value = value;
    Simulate.change(input);
  }

  /*
   * Simulate a click event on an elment.
   */
  clickElement(element) {
    Simulate.click(element);
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

  /*
   * Simulate a dragging files over an element by triggering
   * dragenter and dragover DOM events.
   */
  dragFiles(element, files, x=0, y=0) {
    const defaultOptions = {
      view: window,
      bubbles: true,
      cancelable: true,
    };

    const data = {
      dropEffect: 'none',
      effectsAllowed: 'all',
      types: [ 'Files' ],
      items: files.map((f) => ({kind: 'file', type: f.type})),
      files: files,
    };

    // Use CustomEvent instances so we can configure the dataTransfer object.
    let enterEvent = new CustomEvent('dragenter', defaultOptions);
    enterEvent.clientX = x;
    enterEvent.clientY = y;
    enterEvent.dataTransfer = data;
    element.dispatchEvent(enterEvent);

    let overEvent = new CustomEvent('dragover', defaultOptions);
    overEvent.clientX = x;
    overEvent.clientY = y;
    overEvent.dataTransfer = data;
    element.dispatchEvent(overEvent);
  }

  /*
   * Simulate a file drop event by triggering
   * dragenter, dragover and drop DOM events.
   */
  dropFiles(element, files, x=0, y=0, done) {
    const defaultOptions = {
      view: window,
      bubbles: true,
      cancelable: true,
    };

    const data = {
      dropEffect: 'none',
      effectsAllowed: 'all',
      types: [ 'Files' ],
      items: files.map((f) => ({kind: 'file', type: f.type})),
      files: files,
    };

    // Use CustomEvent instances so we can configure the dataTransfer object.
    let enterEvent = new CustomEvent('dragenter', defaultOptions);
    enterEvent.clientX = x;
    enterEvent.clientY = y;
    enterEvent.dataTransfer = data;
    element.dispatchEvent(enterEvent);

    let overEvent = new CustomEvent('dragover', defaultOptions);
    overEvent.clientX = x;
    overEvent.clientY = y;
    overEvent.dataTransfer = data;
    element.dispatchEvent(overEvent);

    setTimeout(() => {
      let dropEvent = new CustomEvent('drop', defaultOptions);
      dropEvent.clientX = x;
      dropEvent.clientY = y;
      dropEvent.dataTransfer = data;
      element.dispatchEvent(dropEvent);

      setTimeout(done, 60);
    });
  }
}
