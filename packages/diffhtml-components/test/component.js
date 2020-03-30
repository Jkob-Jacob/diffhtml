/// <reference types="mocha" />

import { ok, equal, doesNotThrow } from 'assert';
import { innerHTML, html, release, Internals } from 'diffhtml';
import PropTypes from 'prop-types';
import Component from '../lib/component';
import validateCaches from './util/validate-caches';

const { process } = Internals;
const { assign } = Object;
const whitespaceEx = /[ ]{2,}|\n/g;

describe('Component implementation', function() {
  beforeEach(() => {
    this.fixture = document.createElement('div');
    process.env.NODE_ENV = 'development';
    Component.subscribeMiddleware();
  });

  afterEach(() => {
    release(this.fixture);
    Component.unsubscribeMiddleware();
    validateCaches();
  });

  it('will render a component', () => {
    class CustomComponent extends Component {
      render() {
        return html`
          <div>Hello world</div>
        `;
      }
    }

    innerHTML(this.fixture, html`<${CustomComponent} />`);

    equal(
      this.fixture.outerHTML.replace(whitespaceEx, ''),
      '<div><div>Hello world</div></div>',
    );
  });

  it('will return multiple top level elements', () => {
    class CustomComponent extends Component {
      render() {
        return html`
          <div>Hello world</div>
          <p>Test</p>
        `;
      }
    }

    innerHTML(this.fixture, html`<${CustomComponent} />`);

    equal(
      this.fixture.innerHTML.replace(whitespaceEx, ''),
      `<div>Hello world</div><p>Test</p>`,
    );
  });

  it('will have a component return a component aka HoC', () => {
    class CustomComponent extends Component {
      render({ message }) {
        return html`${message}`;
      }
    }

    const embolden = WrappedComponent => class EmboldenComponent {
      render() {
        return html`
          <b><${WrappedComponent} message="Hello world" /></b>
        `;
      }
    };

    const BoldCustomComponent = embolden(CustomComponent);

    innerHTML(this.fixture, html`<${BoldCustomComponent} />`);

    equal(
      this.fixture.outerHTML.replace(whitespaceEx, ''),
      '<div><b>Hello world</b></div>',
    );
  });

  it('will have a series of HoC', () => {
    class CustomComponent extends Component {
      render({ message }) {
        return html`${message}`;
      }
    }

    const embolden = WrappedComponent => class EmboldenComponent {
      render({ message }) {
        return html`
          <b><${WrappedComponent} message=${message} /></b>
        `;
      }
    };

    const spanify = WrappedComponent => class SpanifyComponent {
      render({ message }) {
        return html`
          <span><${WrappedComponent} message=${message} /></span>
        `;
      }
    };

    const BoldAndSpanned = spanify(embolden(CustomComponent));

    innerHTML(this.fixture, html`<${BoldAndSpanned} message="Hello world" />`);

    equal(
      this.fixture.outerHTML.replace(whitespaceEx, ''),
      '<div><span><b>Hello world</b></span></div>',
    );
  });

  describe('Lifecycle', () => {
    it('will map to componentDidMount', () => {
      let wasCalled = false;

      class CustomComponent extends Component {
        render() {
          return html`<div />`;
        }

        componentDidMount() {
          wasCalled = true;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} someProp="true" />`);

      ok(wasCalled);
    });

    it('will map to componentWillUnmount', () => {
      let wasCalled = false;

      class CustomComponent extends Component {
        render() {
          return html`<div />`;
        }

        componentWillUnmount() {
          wasCalled = true;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} someProp="true" />`);
      innerHTML(this.fixture, html``);

      ok(wasCalled);
    });

    it('will block rendering with shouldComponentUpdate', () => {
      let wasCalled = false;
      let counter = 0;

      class CustomComponent extends Component {
        render() {
          const { message } = this.state;
          return html`${message}`;
        }

        constructor(props) {
          counter++;
          super(props);
          this.state.message = 'default'
        }

        shouldComponentUpdate() {
          wasCalled = true;
          return false;
        }
      }

      let ref = null;
      innerHTML(this.fixture, html`<${CustomComponent} ref=${node => (ref = node)} />`);
      equal(this.fixture.innerHTML, 'default');
      ref.setState({ message: 'something' });
      equal(this.fixture.innerHTML, 'default');
      ok(wasCalled);
      equal(counter, 1);
    });

    it('will map to componentWillReceiveProps', () => {
      let wasCalled = false;
      let counter = 0;

      class CustomComponent extends Component {
        render() {
          return html`<div />`;
        }

        constructor(props) {
          counter++;
          super(props);
        }

        componentWillReceiveProps() {
          wasCalled = true;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} someProp="true" />`);
      innerHTML(this.fixture, html`<${CustomComponent} someProp="false" />`);

      ok(wasCalled);
      equal(counter, 1);
    });

    it('will map root changes to componentDidUpdate', () => {
      let wasCalled = false;
      let counter = 0;

      class CustomComponent extends Component {
        render() {
          return html`<div />`;
        }

        constructor(props) {
          counter++;
          super(props);
        }

        componentDidUpdate() {
          wasCalled = true;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} someProp="true" />`);
      innerHTML(this.fixture, html`<${CustomComponent} someProp="false" />`);

      ok(wasCalled);
      equal(counter, 1);
    });

    it('will map state changes from forceUpdate to componentDidUpdate', () => {
      let wasCalled = false;
      let counter = 0;
      let ref = null;
      let i = 0;

      class CustomComponent extends Component {
        render() {
          return html`<div>${++i}</div>`;
        }

        constructor(props) {
          counter++;
          super(props);
        }

        componentDidUpdate() {
          wasCalled = true;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent}
        ref=${node => (ref = node)}
        someProp="true"
      />`);

      ref.forceUpdate();

      ok(wasCalled);
      ok(ref);
      equal(counter, 1);
      equal(i, 2);
    });
  });

  describe('Props', () => {
    it('will set simple string', () => {
      class CustomComponent extends Component {
        render() {
          return html`<div />`;
        }
      }

      const vTree = html`<${CustomComponent} test="true" />`;

      equal(vTree.attributes.test, 'true');
    });

    it('will set complex object', () => {
      class CustomComponent extends Component {
        render() {
          return html`<div />`;
        }
      }

      const ref = {};
      const vTree = html`<${CustomComponent} test=${ref} />`;

      equal(vTree.attributes.test, ref);
    });

    it('will not throw if missing proptypes in production', () => {
      process.env.NODE_ENV = 'production';

      class CustomComponent extends Component {
        render() {
          return html`<div />`;
        }
      }

      CustomComponent.propTypes = {
        customProperty: PropTypes.string.isRequired,
      };

      doesNotThrow(() => innerHTML(this.fixture, html`<${CustomComponent} />`));
    });

    it('will interpolate an object', () => {
      class CustomComponent extends Component {
        render(props) {
          return html`<div ${props} />`;
        }
      }

      const props = { a: true };
      const vTree = html`<${CustomComponent} ${props} />`;

      equal(vTree.attributes.a, true);
    });
  });

  describe('Refs', () => {
    it('will invoke a ref attribute on a Component', () => {
      let refNode = null;

      class CustomComponent extends Component {
        render() {
          return html`<div ref=${node => (refNode = node)}/>`;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent}
        ref=${node => (refNode = node)}
      />`);

      ok(refNode);
    });

    it('will invoke a ref attribute on a DOM Node', () => {
      let refNode = null;
      let count = 0;

      class CustomComponent extends Component {
        render() {
          return html`
            <div>
              <div ref=${node => { refNode = node; count++; }} />
            </div>
          `;
        }
      }

      equal(count, 0);
      innerHTML(this.fixture, html`<${CustomComponent} />`);
      equal(count, 1);
      ok(refNode);
      equal(refNode.getAttribute('ref'), null);
      equal(this.fixture.nodeName, 'DIV');

      innerHTML(this.fixture, html``);
      ok(!refNode);
      equal(count, 2);
    });
  });

  describe('State', () => {
    it('will always be an object', () => {
      let state = null;

      class CustomComponent extends Component {
        render() {
          return html`<div />`;
        }

        constructor() {
          super();
          state = this.state;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} />`);
      equal(typeof state, 'object');
    });

    it('will set state in constructor', () => {
      class CustomComponent extends Component {
        render() {
          const { message } = this.state;
          return html`${message}`;
        }

        constructor() {
          super();
          this.state.message = 'default'
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} />`);
      equal(this.fixture.innerHTML, 'default');
    });

    it('will call setState to re-render the component', () => {
      class CustomComponent extends Component {
        render() {
          const { message } = this.state;
          return html`${message}`;
        }

        constructor(props) {
          super(props);
          this.state.message = 'default'
        }
      }

      let ref = null;

      innerHTML(this.fixture, html`<${CustomComponent} ref=${node => (ref = node)} />`);

      equal(this.fixture.innerHTML, 'default');
      ref.setState({ message: 'something' });
      equal(this.fixture.innerHTML, 'something');
    });

    it('will update with setState', () => {
      let wasCalled = false;
      let counter = 0;

      class CustomComponent extends Component {
        render() {
          const { message } = this.state;
          return html`<div>${message}</div>`;
        }

        constructor(props) {
          counter++;
          super(props);
          this.state.message = 'default';
        }

        shouldComponentUpdate() {
          wasCalled = true;
          return true;
        }
      }

      let ref = null;

      innerHTML(this.fixture, html`<${CustomComponent} ref=${node => (
        ref = node
      )} />`);

      equal(this.fixture.innerHTML, '<div>default</div>');
      ref.setState({ message: 'something' });
      equal(this.fixture.innerHTML, '<div>something</div>');
      ok(wasCalled);
      equal(counter, 1);
    });

    it('will update multiple top level elements with setState', () => {
      class CustomComponent extends Component {
        render() {
          const { count } = this.state;

          return html`${[...Array(count)].map((__unused, i) => html`
            <div>${String(i)}</div>
          `)}`;
        }

        constructor(props) {
          super(props);
          this.state.count = 2;
        }
      }

      let ref = null;

      innerHTML(
        this.fixture,
        html`<${CustomComponent} ref=${node => (ref = node)} />`,
      );

      const { firstChild } = this.fixture;

      equal(
        this.fixture.innerHTML.trim().replace(whitespaceEx, ''),
        '<div>0</div><div>1</div>',
      );

      ref.setState({ count: 3 });

      equal(
        this.fixture.innerHTML.trim().replace(whitespaceEx, ''),
        '<div>0</div><div>1</div><div>2</div>',
      );

      ref.setState({ count: 1 });

      equal(this.fixture.innerHTML.trim(), '<div>0</div>');
      equal(this.fixture.firstChild, firstChild);
    });
  });

  describe('forceUpdate', () => {
    it('will set state manually and call forceUpdate', () => {
      class CustomComponent extends Component {
        render() {
          const { message } = this.state;
          return html`${message}`;
        }

        constructor(props) {
          super(props);
          this.state.message = 'default'
        }
      }

      let ref = null;

      innerHTML(
        this.fixture,
        html`<${CustomComponent} ref=${node => (ref = node)} />`,
      );

      equal(this.fixture.innerHTML, 'default');
      ref.state.message = 'something';
      ref.forceUpdate();
      equal(this.fixture.innerHTML, 'something');
    });
  });

  describe.skip('Context', () => {
    it('will inherit context from a parent component', () => {
      class ChildComponent extends Component {
        render() {
          return html`${this.context.message}`;
        }
      }

      class ParentComponent extends Component {
        render() {
          return html`<${ChildComponent} />`;
        }

        getChildContext() {
          return {
            message: 'From Context'
          };
        }
      }

      innerHTML(this.fixture, html`<${ParentComponent} />`);

      equal(this.fixture.innerHTML, 'From Context');
    });
  });

  describe('HOC', () => {
    it('will support a component that returns a new component', () => {
      let didMount = 0;

      class CustomComponent extends Component {
        render() {
          return html`<span>Hello world</span>`;
        }
      }

      const HOC = ChildComponent => class HOCComponent extends Component {
        render() {
          return html`<${ChildComponent} />`;
        }

        componentDidMount() {
          didMount++;
        }
      };

      const WrappedComponent = HOC(CustomComponent);
      innerHTML(this.fixture, html`<${WrappedComponent} />`);

      equal(didMount, 1);
      equal(this.fixture.innerHTML, '<span>Hello world</span>');
    });
  });

  describe('Function components', () => {
    it('will render a virtual tree', () => {
      const CustomComponent = () => html`<div>Hello world</div>`;

      innerHTML(this.fixture, html`<${CustomComponent} />`);

      equal(this.fixture.outerHTML, '<div><div>Hello world</div></div>');
    });

    it('will render a dom node', () => {
      const CustomComponent = () => assign(document.createElement('div'), {
        innerHTML: 'Hello world',
      });

      innerHTML(this.fixture, html`<${CustomComponent} />`);

      equal(this.fixture.outerHTML, '<div><div>Hello world</div></div>');
    });

    it('will render an array of virtual trees', () => {
      const CustomComponent = () => [
        html`<div>Hello</div>`, html`<span>world</span>`
      ];

      innerHTML(this.fixture, html`<${CustomComponent} />`);

      equal(this.fixture.outerHTML, '<div><div>Hello</div><span>world</span></div>');
    });

    it('will pass props', () => {
      const CustomComponent = ({ key }) => html`
        <div>${key}</div>
      `;

      innerHTML(this.fixture, html`<${CustomComponent} key="Hello world" />`);

      equal(
        this.fixture.outerHTML.replace(whitespaceEx, ''),
        '<div><div>Hello world</div></div>',
      );
    });

    it('will update props', async () => {
      const CustomComponent = ({ key }) => html`
        <div>${key}</div>
      `;

      innerHTML(this.fixture, html`<${CustomComponent} key="Hello world" />`);
      innerHTML(this.fixture, html`<${CustomComponent} key="To you!" />`);

      equal(
        this.fixture.outerHTML.replace(whitespaceEx, ''),
        '<div><div>To you!</div></div>',
      );
    });

    it('will render a nested component and forward props', async () => {
      const NestedComponent = ({ key }) => html`${key}`;

      const CustomComponent = props => html`
        <div><${NestedComponent} ${props} /></div>
      `;

      innerHTML(this.fixture, html`<${CustomComponent} key="Hello world" />`);
      innerHTML(this.fixture, html`<${CustomComponent} key="To you!" />`);

      equal(
        this.fixture.outerHTML.replace(whitespaceEx, ''),
        '<div><div>To you!</div></div>',
      );
    });

    it.skip('will render a component tree: component / component / component', () => {
      function parent() {
        return html`<${self} />`;
      }

      function self() {
        return html`<${child} />`;
      }

      function child() {
        return html`<${nested} />`;
      }

      function nested() {
        return html`
          <div>Hello world</div>
        `;
      }

      innerHTML(this.fixture, html`<${parent} />`);

      equal(this.fixture.outerHTML, '<div>Hello world</div>');
    });

    it.skip('will render a component tree: component / component / dom', () => {
      function parent() {
        return html`<${self} />`;
      }

      function self() {
        return html`<${child} />`;
      }

      function child() {
        return html`<div>Hello world</div>`;
      }

      innerHTML(this.fixture, html`<${parent} />`);

      equal(this.fixture.outerHTML, '<div>Hello world</div>');
    });

    it.skip('will render a component tree: component / dom / dom', () => {
      function parent() {
        return html`<${self} />`;
      }

      function self() {
        return html`<div><${child} /></div>`;
      }

      function child() {
        return html`<div>Hello world</div>`;
      }

      innerHTML(this.fixture, html`<${parent} />`);

      equal(this.fixture.outerHTML, '<div>Hello world</div>');
    });

    it.skip('will render a component tree: dom / dom / dom', () => {
      function parent() {
        return html`<div><${self} /></div>`;
      }

      function self() {
        return html`<div><${child} /></div>`;
      }

      function child() {
        return html`<div>Hello world</div>`;
      }

      innerHTML(this.fixture, html`<${parent} />`);

      equal(this.fixture.outerHTML, '<div><div><div><div>Hello world</div></div></div></div>');
    });
  });

  describe('Class components', () => {
    it('will render a virtual tree', () => {
      class CustomComponent {
        render() {
          return html`
            <div>Hello world</div>
          `;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} />`);

      equal(
        this.fixture.outerHTML.replace(whitespaceEx, ''),
        '<div><div>Hello world</div></div>',
      );
    });

    it('will trigger mount for a component', () => {
      let hit = 0;

      class CustomComponent {
        render() {
          return html`
            <div>Hello world</div>
          `;
        }

        componentDidMount() {
          hit++;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} />`);

      equal(hit, 1);
    });

    it('will trigger unmount for a component', () => {
      let hit = 0;

      class CustomComponent {
        render() {
          return html`
            <div>Hello world</div>
          `;
        }

        componentWillUnmount() {
          hit++;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} />`);
      innerHTML(this.fixture, html``);

      equal(hit, 1);
    });

    it('will trigger unmount for a component', () => {
      let hit = 0;

      class CustomComponent {
        render() {
          return html`
            <div>Hello world</div>
          `;
        }

        componentWillUnmount() {
          hit++;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} />`);
      innerHTML(this.fixture, html``);

      equal(hit, 1);
    });

    it('will trigger should component update for a component', () => {
      let hit = 0;

      class CustomComponent {
        render() {
          return html`
            <div>Hello world</div>
          `;
        }

        shouldComponentUpdate() {
          hit++;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} />`);
      equal(hit, 0);

      innerHTML(this.fixture, html`<${CustomComponent} key="value" />`);

      equal(hit, 1);
    });

    it('will prevent render with should component update', () => {
      let hit = 0;

      class CustomComponent {
        render(props) {
          return html`
            <div>${props.key}</div>
          `;
        }

        shouldComponentUpdate() {
          hit++;
          return false;
        }
      }

      innerHTML(this.fixture, html`<${CustomComponent} key="right" />`);
      innerHTML(this.fixture, html`<${CustomComponent} key="wrong" />`);

      equal(hit, 1);
      equal(
        this.fixture.innerHTML.replace(whitespaceEx, ''),
        '<div>right</div>',
      );
    });
  });
});
