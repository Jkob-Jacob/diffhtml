const { equal } = require('assert');
const { html } = require('diffhtml');
const Component = require('diffhtml-components/dist/component');
const renderToString = require('../');

describe('renderToString', function() {
  it('can render simple vTree', () => {
    const actual = renderToString(html`<div>Hello world</div>`);
    const expected = `<div>Hello world</div>`;

    equal(actual, expected);
  });

  it('can render attributes', () => {
    const actual = renderToString(html`<div data-test="test" />`);
    const expected = `<div data-test="test"></div>`;

    equal(actual, expected);
  });

  it('can render dynamic attributes', () => {
    const actual = renderToString(html`<div data-test=${() => {}} />`);
    const expected = `<div data-test></div>`;

    equal(actual, expected);
  });

  it('can render a value-less attribute', () => {
    const actual = renderToString(html`<div disabled/>`);
    const expected = `<div disabled="disabled"></div>`;

    equal(actual, expected);
  });

  it('can render top level document fragments', () => {
    const actual = renderToString(html`<div/><p/>`);
    const expected = `<div></div><p></p>`;

    equal(actual, expected);
  });

  it('can render nested document fragments', () => {
    const actual = renderToString(html`<div>${html`<div/><p/>`}</div>`);
    const expected = `<div><div></div><p></p></div>`;

    equal(actual, expected);
  });

  it('can render components', () => {
    class MyComponent extends Component {
      render() {
        return html`
          <p>Hello world</p>
        `;
      }
    }

    const actual = renderToString(html`
      <div>
        <${MyComponent}  />
      </div>
    `);

    const expected = `<div>
        <p>Hello world</p>
      </div>`;

    equal(actual, expected);
  });

  it('can render vanilla components with props', () => {
    class Component {
      render({ message }) {
        return html`
          <p>${message}</p>
        `;
      }
    }

    const actual = renderToString(html`
      <div>
        <${Component} message="Hello world" />
      </div>
    `);

    const expected = `<div>
        <p>Hello world</p>
      </div>`;

    equal(actual, expected);
  });
});
