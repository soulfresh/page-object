import React from 'react';

import PageObject from './PageObject';
import PageSelector from './PageSelector';

const selectors = {
  container: '[data-test=root]',
  image: 'img',
  form1: '[data-test=form1]',
  form2: '[data-test=form2]',
  input: 'input',
  normalButton: '[data-test=normalButton]',
  submitButton: '[data-test=submitButton]',
  submitInput: '[data-test=submitInput]',
  p: 'p',
  fake: 'fake',
  exampleComponent: '[data-test=exampleComponent]',
};

class ExamplePageObject extends PageObject {
  selectors = selectors;
}

describe('PageObject', function() {
  let page, onClick, onSubmit, onChange, onFocus, onMount, onUnmount;
  const paragraph = 'This is paragraph text.';

  function ExampleComponent() {
    React.useEffect(() => {
      onMount();
      return () => onUnmount();
    });
    return <div data-test="exampleComponent">Component</div>
  }

  beforeEach(function() {
    page = new ExamplePageObject();
  });

  afterEach(function() {
    page.destroySandbox();
  });

  beforeEach(function() {
    onClick   = jasmine.createSpy('onClick');
    onSubmit  = jasmine.createSpy('onSubmit');
    onChange  = jasmine.createSpy('onChange');
    onFocus   = jasmine.createSpy('onFocus');
    onMount   = jasmine.createSpy('onMount');
    onUnmount = jasmine.createSpy('onUnmount');

    page.render(
      <div data-test="root">
        <img alt="" />
        <button data-test="normalButton" onClick={onClick} type="button">
          Click Me
        </button>
        <form data-test="form1" onSubmit={onSubmit}>
          <input type="text" onChange={onChange} onFocus={onFocus} />
          <input type="submit" data-test="submitInput" value="Submit" />
        </form>
        <form data-test="form2" onSubmit={onSubmit}>
          <button data-test="submitButton" onClick={onClick} />
        </form>
        <p>{ paragraph }</p>
        <ExampleComponent />
      </div>
    );
  });

  it('should return a PageSelector', () => {
    expect(page.image).toEqual(jasmine.any(PageSelector));
  });

  it('should be able to access the desired element.', () => {
    expect(page.image.element)
      .toBe(page.root.querySelector(selectors.image));
  });

  it('should be able to get a list of all matching elements.', () => {
    expect(page.image.allElements)
      .toEqual(page.root.querySelectorAll(selectors.image));
  });

  it('should be able to count the number of matching elements.', () => {
    expect(page.image.count).toEqual(1);
  });

  it('should be able to tell if the element exists.', () => {
    expect(page.image.exists).toBe(true);
    expect(page.container.exists).toBe(true);
  });

  it('should be able to tell if the element does not exist.', () => {
    expect(page.fake.exists).toBe(false);
  });

  it('should be able to get the text content of a element.', () => {
    expect(page.p.text).toEqual(paragraph);
    expect(page.p.value).toEqual(paragraph);
  });

  it('should be able to get the value of an input element.', () => {
    expect(page.input.value).toBe('');
  });

  it('should be able to set the value of an input element.', () => {
    page.input.value = 'Foo Bar';
    expect(page.input.value).toEqual('Foo Bar');
  });

  it('should emit the change handler when an input element value is changed.', () => {
    page.input.value = 'Bazzzz';
    expect(onChange).toHaveBeenCalled();
  });

  it('should be able to click on an element.', () => {
    page.normalButton.click();
    expect(onClick).toHaveBeenCalled();
  });

  it('should trigger a submit when clicking on a submit button.', () => {
    // prevent JSDOM from logging an error that 'SUBMIT' is not implemented.
    spyOn(console, 'error');
    page.submitButton.click();
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should trigger a submit when clicking on an input of type submit.', () => {
    page.submitInput.click();
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should fire a focus event when clicking on an input.', () => {
    page.input.click();
    expect(onFocus).toHaveBeenCalled();
  });

  it('should be able to submit a form through the proxy.', () => {
    page.form1.submit();
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should be able to submit a form directly.', () => {
    page.submit();
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should be able to unmount a component.', () => {
    expect(onUnmount).not.toHaveBeenCalled();
    page.unmount(page.exampleComponent.element);
    expect(onUnmount).toHaveBeenCalled();
  });

  describe('waiting', function() {
    beforeEach(function() {
      return page.exampleComponent.await();
    });

    it('should be able to wait for elements on the page.', () => {
      expect(page.exampleComponent.exists).toBe(true);
    });
  });

  // TODO Remaining tests:
  // pressEnter
  // clickNth
  // focused
  // disabled
  // classList
  // nthChild
  // elementAt
  // dragFiles
  // dropFiles
  // clickElement
  // setInputValue
  // findByTestName
});
