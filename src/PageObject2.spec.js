import React from 'react';
import { render } from '@testing-library/react';
import { makeSelector, PageO } from './PageObject2';

fdescribe('PageO', function() {
  let page, testLib;
  const selectors = {
    foo: '[data-testid=foo]',
    bar: (root, index) => root.querySelectorAll('[data-testid=bar]')[index],
  };

  beforeEach(function() {
    testLib = render(
      <div data-testid="root">
        <div data-testid="foo">Foo</div>
        <div data-testid="foo">Bar</div>
        <div data-testid="foo">Baz</div>
        <div data-testid="bar">Bar Bar</div>
        <div data-testid="baz">Foo Bar Baz</div>
      </div>
    );

    page = new PageO(selectors);
  });

  describe('with a string selector', function() {
    it('should be able to select the first matching element.', () => {
      expect(page.foo.element).toEqual(document.querySelector(selectors.foo));
      expect(page.foo.element).toEqual(testLib.getAllByTestId('foo')[0]);
    });

    it('should be able to select the second matching element.', function() {
      expect(page.foo(1).element).toEqual(document.querySelectorAll(selectors.foo)[1]);
      expect(page.foo(1).element).toEqual(testLib.getAllByTestId('foo')[1]);
    });

    it('should throw an error if attempting to select an element that does not exist.', function() {
      expect(() => page.str(4).element).toThrow();
      expect(() => page.str(-1).element).toThrow();
    });
  });

  describe('with a function selector', function() {
    it('should be able to select the first matching element.', function() {
      expect(page.bar.element).toEqual(selectors.bar(document.body, 0));
    });

    it('should throw an error when attempting to select an element that does not exist.', function() {
      expect(() => page.bar(1).element).toThrow();
    });
  });

  describe('with a property that does not exist on selectors', function() {
    it('should use the property as a testid selector.', function() {
      expect(page.baz.element).toEqual(document.querySelector('[data-testid=baz]'));
      expect(page.baz.element).toEqual(testLib.getByTestId('baz'));
    });

    it('should throw an error when attempting to select an element that does not exist.', () => {
      expect(() => page.bozo.element).toThrow();
      expect(() => page.baz(2).element).toThrow();
    });
  });

  describe('with another PageO as selector', function() {
    beforeEach(function() {
      page.selectors.subPage = new PageO();
    });

    it('should be able to select through the sub page object.', function() {
      expect(page.subPage.foo.element).toEqual(document.querySelector('[data-testid=foo]'));
      expect(page.subPage.foo(2).element).toEqual(testLib.getAllByTestId('foo')[2]);
    });

    it('should throw an error if sub page selection fails.', () => {
      expect(() => page.subPage.foo(4).element).toThrow();
    });
  });
});

fdescribe('PageO composition', function() {
  let page, testLib;

  beforeEach(function() {
    testLib = render(
      <div data-testid="outer">
        <div data-testid="outerTitle">Outer Component</div>
        <div data-testid="inner">
          <div data-testid="innerTitle">Inner Component</div>
          <div data-testid="body">Inner Body</div>
        </div>
      </div>
    );
  });

  describe('with an element defining the sub page root', function() {
    beforeEach(function() {
      const selectors = {
        inner: new PageO({}, document.querySelector('[data-testid="inner"]')),
      };
      page = new PageO(selectors);
    });

    it('should be able to select the outer component title.', function() {
      expect(page.outerTitle.text).toEqual('Outer Component');
    });

    it('should be able to select items using the inner component.', function() {
      expect(page.inner.innerTitle.text).toEqual('Inner Component');
      expect(page.inner.body.text).toEqual('Inner Body');
    });
  });

  describe('with a string defining the sub page root', function() {
    beforeEach(function() {
      const selectors = {
        inner: new PageO(null, '[data-testid="inner"]'),
      };
      page = new PageO(selectors);
    });

    it('should be able to select items using the inner component.', function() {
      expect(page.inner.innerTitle.text).toEqual('Inner Component');
      expect(page.inner.body.text).toEqual('Inner Body');
    });
  });

  describe('with a function defining the sub page root', function() {
    beforeEach(function() {
      const selectors = {
        inner: new PageO({}, () => document.querySelector('[data-testid=inner]')),
      };
      page = new PageO(selectors);
    });

    it('should be able to select items using the inner component.', function() {
      expect(page.inner.innerTitle.text).toEqual('Inner Component');
      expect(page.inner.body.text).toEqual('Inner Body');
    });
  });
});

fdescribe('PageO inheritance', function() {
  let page, testLib;

  beforeEach(function() {
    testLib = render(
      <div data-testid="outer">
        <div data-testid="outerTitle">Outer Component</div>
        <div data-testid="inner">
          <div data-testid="innerTitle">Inner Component</div>
          <div data-testid="innerBody">Inner Body</div>
          <div data-testid="otherThing">Other Thing</div>
        </div>
      </div>
    );

    class Inner extends PageO {
      selectors = {
        root: '[data-testid=inner]',
        body: (root, index) => root.querySelectorAll('[data-testid=innerBody]')[index],
      }
    }

    class Outer extends PageO {
      selectors = {
        root: '[data-testid=outer]',
        inner: new Inner({other: '[data-testid=otherThing]'}, '[data-testid=inner]'),
      };
    }

    page = new Outer();
  });

  it('should be able to select the outer title.', function() {
    expect(page.outerTitle.text).toEqual('Outer Component');
  });

  it('should be able to select the root of the inner component.', function() {
    expect(page.inner.element).toEqual(document.querySelector('[data-testid=inner]'));
    expect(page.inner.root.element).toEqual(document.querySelector('[data-testid=inner]'));
  });

  it('should be able to select the inner component elements.', function() {
    expect(page.inner.innerTitle.text).toEqual('Inner Component');
    expect(page.inner.body.text).toEqual('Inner Body');
  });

  it('should be able to merge selectors into the inner component.', function() {
    expect(page.inner.other.text).toEqual('Other Thing');
  });
});

fdescribe('Selectors', function() {
  let page, testLib;
  const selectors = {
    str: '[data-testid=foo]',
    func: (root, index = 0) => root.querySelectorAll('[data-testid=foo]')[index],
  };

  beforeEach(function() {
    testLib = render(
      <div data-testid="root">
        <div data-testid="foo">Foo</div>
        <div data-testid="foo" className="foo bar">Bar</div>
        <div data-testid="foo">Baz</div>
        <div data-testid="baz">Foo Bar Baz</div>
      </div>
    );
  });

  describe('with a string selector', function() {
    beforeEach(function() {
      page = makeSelector(selectors.str);
    });

    it('should retrieve the first matching element', function() {
      expect(page.element).toEqual(document.querySelector(selectors.str));
      expect(page.element).toEqual(testLib.getAllByTestId('foo')[0]);
    });

    it('should retrieve the second matching element.', () => {
      expect(page(1).element).toEqual(document.querySelectorAll(selectors.str)[1]);
      expect(page(1).element).toEqual(testLib.getAllByTestId('foo')[1]);
    });

    it('should throw an exception when requesting an element index that is out of bounds.', () => {
      expect(() => page(4).element).toThrow();
      expect(() => page(-1).element).toThrow();
    });
  });

  describe('with a function selector', function() {
    beforeEach(function() {
      page = makeSelector(selectors.func);
    });

    it('should retrieve the first matching element', function() {
      expect(page.element).toEqual(document.querySelector(selectors.str));
      expect(page.element).toEqual(testLib.getAllByTestId('foo')[0]);
    });

    it('should retrieve the second matching element.', () => {
      expect(page(1).element).toEqual(document.querySelectorAll(selectors.str)[1]);
      expect(page(1).element).toEqual(testLib.getAllByTestId('foo')[1]);
    });

    it('should throw an exception when requesting an element index that is out of bounds.', () => {
      expect(() => page(4).element).toThrow();
      expect(() => page(-1).element).toThrow();
    });
  });

  describe('with a DOM element', function() {
    beforeEach(function() {
      page = makeSelector(selectors.func(document.body));
    });

    it('should retrieve the configured element', function() {
      expect(page.element).toEqual(document.querySelector(selectors.str));
      expect(page.element).toEqual(testLib.getAllByTestId('foo')[0]);
    });
  });

  describe('selector methods', function() {
    beforeEach(function() {
      page = makeSelector(selectors.str);
    });

    it('should forward unknown properties to the underlying element.', () => {
      expect(page.getAttribute('data-testid')).toEqual('foo');
      expect(page(1).classList.contains('bar')).toEqual(true);
    });

    it('should be able to get the text content of an element.', () => {
      expect(page.text).toEqual('Foo');
      expect(page(1).text).toEqual('Bar');
      expect(page(2).text).toEqual('Baz');
      expect(() => page(4).text).toThrow();
    });
  });
});
