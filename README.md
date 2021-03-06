# page-object
Page Objects for concise, readable, reusable tests in React projects.

`page-o` is a small wrapper around `@testing-library/react` with the goal of making your tests
more concise and readable while maintaining the main principles of
[Testing Library](https://testing-library.com/docs/guiding-principles).

## A Quick Example

```js
import PageObject from 'page-o';
import MyComponent from './MyComponent.jsx';

describe('My Component', () => {
  let page;

  beforeEach(() => {
    // Create a Page Object with a selector for finding My Component in the DOM.
    // Reusing PageObjects across tests is the true power of `page-o` and we'll
    // show you some strategies for this later.
    page = new PageObject(null, {
      // This selector allows you to find MyComponent.
      // It will be available for use as `page.myComponent`.
      // The `page.myComponent` property has methods for testing
      // existance, visibility, text, value, and performing actions
      // like 'click', 'submit', etc.
      myComponent: '[data-test=myComponent]',
    });

    // Render MyComponent into the DOM.
    page.render(
      <MyComponent data-test="myComponent" />
    );
  });

  afterEach(() => {
    // Clean up the DOM after each test.
    page.destroySandbox();
  });

  it('should have been rendered.', () => {
    // Verify that the component exists in the DOM.
    expect(page.myComponent.exists).toBe(true);
  });

  it('should render the component text.', () => {
    // Your expectations read as sentances making for nice specifications.
    expect(page.myComponent.text).toEqual('Hello World');
  });

  it('should change the message after clicking.', () => {
    // You can easily interact with your component.
    page.myComponent.click();

    expect(page.myComponent.text).toEqual("Don't click so hard!");
  });
});
```

## Why PageObjects?

Much like you centralize your UI logic into reusable components, we
find it helpful to centralize our test logic into PageObjects. This
makes refactoring easier because component interactions are not spread
across multiple tests. Additionally, it makes your tests more readable
because complex component interactions are no longer scattered amongst
test setup routines, leaving simple, readable `it` and `expect` statements.

PageObjects have the benefit of:

- Making component/page interactions reusable across tests such as between unit
  and integration tests.
- Making coponent interactions composable in the same way you compose
  your components. For example, a PageObject representing `MyComponent`
  can be used across all tests that need to ineract with `MyComponent`.
- Making tests easier to read by moving complex component interactions out of tests.
- Making tests easier to read by providing an English like syntax
  for interacting with components under test.
- Making refactoring easier by centralizing interactions and page queries.
- Making component/page setup/destruction easier by providing convenient
  setup/teardown methods.

You don't need `page-o` to acheive the above but we find it helps us get up
and running quickly with good testing principles with minimal boilerplate.

In fact, we used to create vanilla js objects to do everything `page-o` does
and that worked just fine. After a while though, we noticed a lot of
repeated code and boilerplate so we created `page-o`.

## Usage

When using `page-o`, interactions with a component under test are performed through a
`PageObject` instance. The `PageObject` exposes methods for finding elements in the DOM
and then performing actions against those DOM elements.

### Creating an PageObject

```js
let page;

// It is best practice to create PageObjects in a `beforeEach` or `it` method in your tests.
// While this is not technically necessary because PageObjects are stateless, we find
// it a good principle to follow because it ensures a clean slate between tests.
beforeEach(() => {
  page = new PageObject(
    // The first parameter to PageObject is the root DOM node within which you want
    // to search for elements. Most of the time you can pass null/undefined/false, to
    // use the sandbox as your query root. However, we'll come back to some times
    // when passing a root here becomes useful.
    root,

    // The second parameter to PageObject is a list of elements in the DOM you want
    // to query for/interact with.
    {
      // You can use any standard DOM selector to find elements such as class, id or element selectors.
      todoInput: 'input',

      // However, we highly recommend using a dedicated test selector such as
      // `data-test` (ex: `<div data-test="something">`) or `data-testid`.
      saveTodoButton: '[data-test=saveTodoButton]'

      // Dedicated test selectors like this make your tests more resiliant to change
      // by isolating your tests from changes to styling or other markup.
      // We'll discuss this more in detail later or you can do a little reading at:
      // https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change

      // `@testing-library` suggests selecting elements based on their text value
      // which is also something we support and is described later.
    }
  );
});
```

### Sandbox setup

Once you've created a PageObject, you can use it to setup the sandbox for your test.
The sandbox is just a DOM element where components under test are rendered.

```js
// You should setup the sandbox inside of a `beforeEach` or `it` statement so that
// you have a clean sansbox with every test.
beforeEach(() => {
  // To setup the sandbox, simply call `render` with the component
  // you want to render.
  page.render(
    <MyComponent />
  );
});

afterEach(() => {
  // You should also teardown the sandbox after each test.
  page.destroySandbox();
});
```

### Querying your components

Once your sandbox is setup, you can interact with components on the page through
the DOM. We use the DOM (as opposed to interacting with the React
component instances themselves) because the DOM is how your users interact with
your application.

This follows the `@testing-library`
[guiding principles](https://testing-library.com/docs/guiding-principles).
We also stay away from practices like shallow rendering of components
because they make tests harder to debug, harder to grock and less resiliant to change.

```js
it('should be visible.', () => {
  // Your page object exposes properties that allow you to ineract with
  // each of the selectors you defined for that page object.
  // For example, `page.myComponent` relates to the `myComponent` selector
  // you passed when you constructed `page` with
  // `new PageObject(root, {myComponent: '[data-test=myComponent]'})`;
  const myComponent = page.myComponent;

  // You can also access any other selectors you've passed to your `PageObject`.
  const input = page.myInput;

  // You can now query things about your component, such as...
  // Does it exist in the DOM:
  expect(myComponent.exists).toBe(true)

  // Determining what text is has rendered:
  expect(myComponent.text).toEqual('Hello World');

  // While our preference is to use `data-test` ids to select elements,
  // selecting by element text is a key guiding principle of
  // `@testing-library` so we support it as well.
  expect(page.buttonLabeled('Click Me').exists).toBe(true);

  // You can find full documentation of the query API below.

  // You can also access the DOM element directly:
  expect(myComponent.element).toEqual( document.querySelector('[data-test=myComponent]') );

  // You can also interact with DOM elements, such as...
  // Clicking on elements.
  myComponent.click();

  // Focusing elements:
  input.focus();

  // Setting their value:
  input.value = 'Foo Bar';

  // Submitting forms:
  page.myForm.submit();

  // Notice that your expectations read like sentances.
  // In this way, your tests become documentation
  // (ie the "specification" in `myComponent.spec`)
  // which follows well with BDD principles.
});
```

### PageObject reuse

The true power of `page-o` comes from the reuse of your PageObjects and query selectors.
As we mentioned earlier, you don't need `page-o` to encapsulate component interactons
but we find it helps reduce a lot of boilerplate.

#### Reusing selectors

We generally create a `*.page-object.js` file that sits next to our `*.spec.jsx` file.
From this file we export our reusable PageObject and DOM selectors.
However, you could also define and export these from your spec file.

```js
// MyComponent.page-object.js

// The first thing we export is a vanilla js object with our DOM selectors:
export const myComponentSelectors = {
  myComponent: '[data-test=myComponent]',
  nextButton: '[data-test=nextButton]',
};

// This can be good enough for most situations because it allows you quickly create
// PageObject instances in your tests:
beforeEach(() => {
  let page = new PageObject(null, myComponentSelectors);
});
```

#### PageObject subclassing

However, we generally also like to export a `PageObject` subclass that is specific
to the component under test:

```js
export class MyComponentPageObject extends PageObject {
  // If you specify a selectors property on your component PageObject,
  // you will not need to to pass that when constructing your component PageObject.
  selectors = myComponentSelectors;
}

// You can now do the following in your test:
beforeEach(() => {
  // This `page` is preconfigured with its selectors and ready
  // to query against the test sandbox.
  let page = new MyComponentPageObject();
});
```

#### Component specific interactions

For complex component interacts, you can now also add custom
methods to MyComponentPageObject:

```js
// Assuming your component has two inputs with the following `data-test` attributes.
export const myComponentSelectors = {
  name: '[data-test=nameInput]',
  location: '[data-test=locationInput]',
};

// You can now customize your component page object with custom interactions.
export class MyComponentPageObject extends PageObject {
  selectors = myComponentSelectors;

  // Fill all of the inputs elements in the MyComponent form.
  // @param {Object} values - An object with key/value pairs
  //   relating to the inputs in `MyComponent`.
  fillEntireForm(values) {
    for (key in values) {
      // Assuming the keys in the values object passed,
      // match keys in your PageObject selectors,
      // set the value for those inputs to the values passed.
      this[key].value = values[key];
    }
  }

  // Or do some async work...
  doSomethingSlow(done) {
    ...do slow stuff here.
    done();
  }
}

// This keeps your test code nice and readable.
// You can also easily fill out the form in multiple tests.
describe('after filling out the form', () => {
  beforeEach((done) => {
    page.fillEntireForm({
      name: 'Batman',
      location: 'Bat Cave',
    });

    page.doSomethingSlow(done);
  });

  it('should be done', () => {
    // validate
  });
})
```

#### PageObject composition

Another great way to reuse your PageObjects between tests is to compose
PageObjects together.

##### Selector composition

One way to do that is to simple compose your selector objects:

```js
import { myComponentSelectors } from '../my-compnent/MyComponent.page-object';

export const myOtherComponentSelectors = {
  // You could add the selectors for MyComponent to this PageObject:
  ...myComponentSelectors,
  // Or you can add specific selectors:
  nameInput: myComponentSelectors.name,
  // Or you can create more specific selectors:
  locationInput: '[data-test=myComponentRoot] ' + myComponentSelectors.location,
};
```

##### PageObject composition

You could also compose PageObject classes together.

```js
import { MyComponentPageObject } from '../my-compnent/MyComponent.page-object';

export class MyOtherComponentPageObject extends PageObject {
  selectors = myOtherComponentSelectors;

  // You can easily instantiate PageObjects in other PageObjects.
  get nameInput() {
    const myComponent = new MyComponentPageObject();
    return myComponent.name;

    // Notice that we returned `myComponent.name` as opposed to
    // `myComponent.name.text`. This gives the PageObject user
    // the flexibility to interact with `nameInput` methods
    // like `page.nameInput.exists`.
  }

  // Or provide a getter to do access the MyComponentPageObject.
  get myComponent() {
    return new MyComponentPageObject();
  }

  // to use like this:
  get myLocation() {
    return this.myComponent.location;
  }

  // You can also customize the root DOM element in which a PageObject
  // interacts. This can be very useful when there may be multiple
  // instances of MyComponent on a page.
  get interactWithMyComponentAtIndex(index) {
    const componentRoot = this.someSelector.nth(index).element;
    const component = new MyComponentPageObject( componentRoot );
    return component.doComplexThing();
  }
}
```

#### PageObject inheritance

As you might expect, you could also inherit from another PageObject.

```js
import { MyComponentPageObject } from '../my-compnent/MyComponent.page-object';

export class MyOtherComponentPageObject extends MyComponentPageObject {
  // Now this component can do anything MyComponentPageObject can do.
  // You can also override methods to the specific use case of this new component.
}
```

### The API

The `page-o` API is divided into two peices:

1. The `PageObject` API - methods available directly on a `PageObject`.
2. The `PageSelector` API - methods available to objects returned by
   selector queries.

#### PageObject

The following API is exposed by `PageObject` instances:

<table>
  <thead>
    <tr>
      <td>Name</td>
      <td>Description</td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
<pre><b>constructor</b>(
  rootDOM, 
  selectors
)</pre></td>
      <td>
        <code>rootDOM</code> is an HTMLElement that serves as the root within
        which this PageObject will search for elements to interact with.
        Passing <code>null</code>, <code>undefined</code> or <code>false</code> will use the sandbox as
        the root element.
        <br/><br/>
        <code>selectors</code> an object of key/value pairs representing
        elements in the DOM you wish to interacte with.
        <br/><br/>
        For example, given the following PageObject:
        <br/>
        <pre>let page = new PageObject(rootDiv, {someDiv: '[data-test=someDiv]'})</pre>
        The property <code>page.someDiv</code> corresponds to an object Proxy
        representing a DOM element with the attribute <code>data-test=someDiv</code>
        inside the div <code>rootDiv</code>.
      </td>
    </tr>
    <tr>
      <td>
<pre><b>render</b>(
  jsxDefinition, 
  stylesObject, 
  additionalDOM
)</pre></td>
      <td>
        Render the <code>jsxDefinition</code> into the sandbox. This method
        returns a reference to the sandbox DOM element.
        <br/><br/>
        <code>stylesObject</code> is a string that will be applied
        as global style element. In the following example,
        we can make the text color of all buttons in our test red:
        <br/><br/>
        <pre>page.render(&lt;Component /&gt;, 'button {color: red}'})</pre>
        <code>additionaDOM</code> is a string representing additional DOM nodes
        to render inside the sandbox. In the following example,
        a div with the class "loader" is available in the sandbox
        along side <code>Component</code>;
        <br/><br/>
        <pre>page.render(<Component />, null, '&lt;div class="loader"&gt;&lt;/div&gt;')</pre>
      </td>
    </tr>
    <tr>
      <td><pre><b>destroySandbox</b>()</pre></td>
      <td>
        Clean up the sandbox DOM element after a test and unmount all
        components.
      </td>
    </tr>
    <tr>
      <td><pre>get <b>root</b></pre></td>
      <td>
        The root element inside of which this PageObject will select.
        This is the same element passed as the first argument to the constructor.
        <br/><br/>
        For legibility, we suggest you don't modify this in the middle of a test
        but instead create new PageObject instances pointing to other
        root elements.
      </td>
    </tr>
    <tr>
      <td><pre>get <b>allSelectors</b></pre></td>
      <td>
        A list of the selectors this PageObject is configured to interact with.
      </td>
    </tr>
    <tr>
      <td><pre>get <b>selectors</b></pre></td>
      <td>
        A list of selectors that you can modify at runtime. For example,
        you could use this to add or change the selectors your PageObject
        interacts with...
<pre>page.selectors.foo = '[data-test=foo]';
page.foo.click();</pre>
      </td>
    </tr>
    <tr>
      <td><pre><b>select</b>(selector)</pre></td>
      <td>
        A generic method for querying the DOM inside of <code>page.root</code>.
<pre>page.select('[data-test=foo]');
// equivalent to:
page.root.querySelector('[data-test=foo]');</pre>
      </td>
    </tr>
    <tr>
      <td><pre><b>selectAll</b>(selector)</pre></td>
      <td>
        A generic method for querying the DOM inside of <code>page.root</code>.
<pre>page.selectAll('[data-test=foo]');
// equivalent to:
page.root.querySelectorAll('[data-test=foo]');</pre>
      </td>
    </tr>
    <tr>
      <td><pre><b>submit</b>()</pre></td>
      <td>
       Find the first form on the page and simulate a submit event for it.
      </td>
    </tr>
    <tr>
      <td><pre><b>findByTestName</b>(testName)<pre></td>
      <td>
       Find an element by its `data-test` attribute.
<pre>page.findByTestName('foo');
// equivalent to
page.root.querySelector('[data-test=foo]');<pre>
      </td>
    </tr>
  </tbody>
</table>


#### PageSelector API

After defining the selectors available on a PageObject, you can interact
with those selectors by referencing them as properties of your PageObject.

For example:
```js
// given the following DOM...
<div id="sandbox">
  <div data-test="myComponent">
    Hello World
  </div>
</div>

// and the following PageObject...
let page = new PageObject(null, {
  myCommponent: '[data-test=myComponent]',
});

// You can interact with the `data-test=myComponent` div using
// the property `page.myComponent`...
page.myComponent.click();
```

In the example above, the property `myComponent` on `page` is an instance of
a `PageSelector` whose API is as follows.

<table>
  <thead>
    <tr>
      <td>Name</td>
      <td>Description</td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><pre>get <b>element</b></pre></td>
      <td>
        Get the HTMLElement associated with this selector.
      </td>
    </tr>
    <tr>
      <td><pre>get <b>allElements</b></pre></td>
      <td>
        Get a list of HTMLElements in the DOM that match the selector for this proxy.
      </td>
    </tr>
    <tr>
      <td><pre><b>elementAt(index)</td>
      <td>
        Get an element at a specific index (assuming the current
        selector matches more than one element). If there is only
        one element matching the selector and you ask for index 0,
        you will get that single element. If the selector returns
        no elements or it returns a single element and you asked for
        element 2+, this function will return null and will log an error.
      </td>
    </tr>
    <tr>
      <td><pre><b>nth(index)</td>
      <td>
        Get a PageSelector configured to select against the
        nth element matching the selector.
        <br/><br/>
        Example:
<pre>const secondInput = page.input.nth(1);
page.input.nth(1).value = 'foo';
expect( page.input.nth(2).exists ).toBe(true);</pre>
      </td>
    </tr>
    <tr>
      <td><pre>get <b>count</b></pre></td>
      <td>
       Count the number of elements in the DOM that match
       this proxy.
      </td>
    </tr>
    <tr>
      <td><pre>get <b>exists</b></pre></td>
      <td>
       Determine if this proxy exists in the DOM.
      </td>
    </tr>
    <tr>
      <td><pre>get <b>text</b></pre></td>
      <td>
       Get the trimmed text content of this selector.
      </td>
    </tr>
    <tr>
      <td><pre>get <b>classList</b></pre></td>
      <td>
       Get the classList object for the element matching
       this selector.
      </td>
    </tr>
    <tr>
      <td><pre><b>hasClass(className)</td>
      <td>
       Check if the element matching the current selector
       has a specific class name.
       <br/><br/>
       Equivalent to: <code>page.thing.classList.contains.className</code>;
      </td>
    </tr>
    <tr>
      <td><pre>get <b>disabled</b></pre></td>
      <td>
       Check if the element has a 'disabled' attribute.
      </td>
    </tr>
    <tr>
      <td><pre>get <b>checked</b></pre></td>
      <td>
       Get the checked value of a checkbox or radio input.
      </td>
    </tr>
    <tr>
      <td><pre>set <b>checked</b></pre></td>
      <td>
       Set the checked value of a checkbox or radio input.
       <br/><br/>
        Ex: <code>page.thing.checked = true;</code>
      </td>
    </tr>
    <tr>
      <td><pre>get <b>value</b></pre></td>
      <td>
        Get the text value or input value of this selector.
        If the target element is an INPUT, then this returns
        the value property of that INPUT. Otherwise, it
        returns the trimmed text content.
      </td>
    </tr>
    <tr>
      <td><pre>set <b>value</b></pre></td>
      <td>
       Set the value of this selector if it points to
       an INPUT element. If the selector points to something
       other than an INPUT, then this setter has no effect.
      </td>
    </tr>
    <tr>
      <td><pre>get <b>values</b></pre></td>
      <td>
       Get the value/textContent of all direct children as an array of Strings.
      </td>
    </tr>
    <tr>
      <td><pre>get <b>focused</b></pre></td>
      <td>
       Determine if the current element has focus in the document.
      </td>
    </tr>
    <tr>
      <td><pre><b>focus</b>()</pre></td>
      <td>
       Emit a Focus event from the element matching this selector.
      </td>
    </tr>
    <tr>
      <td><pre><b>blur</b>()</pre></td>
      <td>
       Emit a Blur event from the element matching this selector.
      </td>
    </tr>
    <tr>
      <td>
<pre><b>simulateAction</b>(
  actionName, 
  element, 
  eventObject
)</pre></td>
      <td>
       Simulate an action on a specific element. You can simulate any action provided by
       <code>@testing-library fireEvent</code>.
       <br/><br/>
        Ex: <code>page.simulateAction('click', page.thing.element, new CustomEvent())</code>
      </td>
    </tr>
    <tr>
      <td><pre><b>await</b>(options)</pre></td>
      <td>
        Wait for the element matching the current selector to become visible in the DOM.
        This returns a promise that resolves once the element is rendered or throws if it doesn't appear
        in the duration specified in options. Under the hood this uses <code>@testing-library waitFoElement</code>.
        <br/><br/>
        For more details, see (https://testing-library.com/docs/dom-testing-library/api-async#waitforelement)
        <br/><br/>
        Ex: <code>page.thing.await().then(() => done())</code>
      </td>
    </tr>
    <tr>
      <td><pre><b>awaitRemoval</b>(options)</pre></td>
      <td>
        Similar to <code>await</code> but waits for an element to be removed. Under the hood this uses <code>@testing-library
        waitForElementToBeRemoved</code>.
        <br/><br/>
        For more details, see (https://testing-library.com/docs/dom-testing-library/api-async#waitforelementtoberemoved)
        <br/><br/>
        Ex: <code>page.thing.awaitRemoval().then(() => done())</code>
      </td>
    </tr>
    <tr>
      <td><pre><b>click</b>()</pre></td>
      <td>
       Click on the first element that matches this selector.
      </td>
    </tr>
    <tr>
      <td><pre><b>submit</b>()</pre></td>
      <td>
        Simulate a submit event on the element matching the current selector.
        <br/><br/>
        Ex: <code>page.myForm.submit()</code>
        <br/><br/>
        Since there is usually only one form on a page that can be submitted,
        PageObject also exposes a <code>submit</code> method directly that will find the first
        form on a page and submit that.
        <br/><br/>
        Ex: <code>page.submit()</code>
      </td>
    </tr>
    <tr>
      <td><pre><b>pressEnter</b>()</pre></td>
      <td>
       Press the enter key on the specified element.
       <br/><br/>
        Ex: <code>page.someInput.pressEnter()</code>
      </td>
    </tr>
  </tbody>
</table>


### What's happening under the hood?

More docs coming...

### Other useful strategies

barrel `page-objects` files

test selectors vs. element text

[make your tests resiliant](https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change).
