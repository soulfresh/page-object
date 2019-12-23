import { fireEvent } from '@testing-library/react';

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
      fireEvent[action](el);
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
}
