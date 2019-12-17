import React from 'react';

import PageObject, { PageSelector } from './PageObject';

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
};

class ExamplePageObject extends PageObject {
  selectors = selectors;
}

describe('PageObject', function() {
  let page, onClick, onSubmit, onChange;
  const paragraph = 'This is paragraph text.';

  beforeEach(function() {
    page = new ExamplePageObject();
  });

  afterEach(function() {
    page.destroySandbox();
  });

  beforeEach(function() {
    onClick = jasmine.createSpy('onClick');
    onSubmit = jasmine.createSpy('onSubmit');
    onChange = jasmine.createSpy('onChange');

    page.render(
      <div data-test="root">
        <img alt="" />
        <button data-test="normalButton" onClick={onClick} type="button">
          Click Me
        </button>
        <form data-test="form1" onSubmit={onSubmit}>
          <input type="text" onChange={onChange} />
          <input type="submit" data-test="submitInput" value="Submit" />
        </form>
        <form data-test="form2" onSubmit={onSubmit}>
          <button data-test="submitButton" onClick={onClick} />
        </form>
        <p>{ paragraph }</p>
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
    page.submitButton.click();
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should trigger a submit when clicking on an input of type submit.', () => {
    page.submitInput.click();
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should fire a change event when clicking on an input.', () => {
    page.input.click();
    expect(onChange).toHaveBeenCalled();
  });

  it('should be able to submit a form through the proxy.', () => {
    page.form1.submit();
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should be able to submit a form directly.', () => {
    page.submit();
    expect(onSubmit).toHaveBeenCalled();
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
