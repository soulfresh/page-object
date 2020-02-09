import {
  fireEvent,
  waitForElement,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import {
  getByText,
} from '@testing-library/dom';

/*
 * An object that is configured to interact with a specific
 * element in the DOM. You shouldn't have to use this class
 * directly as it is returned by PageObject for you.
 */
export default class PageSelector {
  constructor(selector, root) {
    this.selector = selector;
    this.root = root;
  }

  /*
   * Get the HTMLElement associated with this proxy.
   */
  get element() {
    if (this.selector) {
      return this.root.querySelector(this.selector);
    } else {
      return this.root;
    }
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
   * DEPRECATED - use `nth()` instead.
   */
  nthChild(index) {
    // the CSS nth-child selector is 1 based so we convert to that indexing.
    const nthChildSelector = `${this.selector}:nth-child(${index + 1})`;
    return new PageSelector(nthChildSelector, this.root);
  }

  /*
   * Get a PageSelector configured to select against the
   * nth element matching the selector.
   *
   * Example:
   * const secondInput = page.input.nth(1);
   *
   * page.input.nth(1).value = 'foo';
   *
   * expect( page.input.nth(2).exists ).toBe(true);
   */
  nth(index) {
    const root = this.allElements[ index ];
    return new PageSelector(null, root);
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
   * Get the checked value of a checkbox or radio input.
   */
  get checked() {
    const el = this.element;
    if (el) {
      return this.element.checked;
    }
  }

  /*
   * Set the checked value of a checkbox or radio input.
   */
  set checked(value) {
    const el = this.element;
    if (el) {
      el.checked = value;
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
        fireEvent.change(el, { target: { value } });
        return;
      } else {
        console.error(`Cannot set the value of a non-input element. Tried to set ${this.selector} to ${value}.`);
        return;
      }
    }
    console.error(`${this.selector} does not exist and thus cannot be set to ${value}.`);
  }

  /*
   * DEPRECTATED - use `values`
   */
  get childValues() {
    return this.values;
  }

  /*
   * Get the value/textContent of all direct children.
   */
  get values() {
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

  /*
   * Emit a Focus event from the element matching this selector.
   */
  focus() {
    this.simulateAction('focus', this.element);
  }

  /*
   * Emit a Blur event from the element matching this selector.
   */
  blur() {
    this.simulateAction('blur', this.element);
  }

  /*
   * @private
   * Simulate an action on a specific element.
   */
  simulateAction(action, element, event) {
    const el = element || this.element;
    if (el) {
      fireEvent[action](el, event);
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
        if (el.type === 'checkbox' || el.type === 'radio') {
          return this.simulateAction('click', el);
        }
        else if (el.type !== 'submit') {
          return this.simulateAction('focus', el);
        } else {
          return this.simulateAction('submit', el);
        }
      case 'BUTTON':
        if (el.type === 'submit') {
          return this.simulateAction('click', el);
        } else {
          return this.simulateAction('click', el);
        }
      default:
        return this.simulateAction('click', el);
    }
  }

  [ 'await' ](options) {
    return waitForElement(() => this.element, options);
  }

  awaitRemoval(options) {
    return waitForElementToBeRemoved(() => this.element, options);
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
   fireEvent.keyDown(this.element, {keyCode: 13});
   fireEvent.keyUp(this.element, {keyCode: 13});
  }

  /*
   * Get an attribute for the element specified.
   */
  attribute(name) {
    return this.element.getAttribute(name);
  }

  get visible() {
    const style = window.getComputedStyle(this.element);

    // TODO opacity > 0 or not set, visiblility === 'visible' or not set
    return this.exists && style.display !== 'none';
  }

  get branchIsVisible() {
    // TODO follow the tree to see if all parents are visible.
    return true;
  }
}
