# <±/> diffHTML

*A suite of JavaScript user interface tools built for the web.*

Stable version: 1.0.0-beta.9

[![Build Status](https://travis-ci.org/tbranyen/diffhtml.svg?branch=master)](https://travis-ci.org/tbranyen/diffhtml)
[![Coverage
  Status](https://coveralls.io/repos/tbranyen/diffhtml/badge.svg?branch=master&service=github)](https://coveralls.io/github/tbranyen/diffhtml?branch=master) 

diffHTML is a library that assists with creating user interfaces using
JavaScript. These interfaces can be: applications, games, data visualizations,
or anything else that you may want to render in a web browser.

This repository is a mono-repo structured with the [Lerna](https://lernajs.io/)
CLI tool. This makes it easier to support continuous integration, consistent
versioning, and working on the various diffHTML tools.

[**Click here to go directly to the diffHTML library source**](/packages/diffhtml/)

## Features

- Parses real **HTML** and supports **JSX & Tagged Templates**.
- Efficient minimal rendering that utilizes **object pooling**.
- **Web** and **React**-compatible stateful components.
- View and debug your code using the **Chrome DevTools extension**.
- **Transition hooks** monitor DOM changes an are similar to mutation events.
- Powerful **middleware** extends diffHTML with additional features.

## Packages

The following list of packages are nested in the `/packages` folder. They can
be tested globally or independently by using `npm test` at the root directory
level or any specific nested package level.

* **[diffhtml](/packages/diffhtml)**

  ``` sh
  npm install diffhtml
  ```

  The core library for creating user interfaces. Contains a full build and
  smaller runtime build (which excludes HTML parser, tagged templates, and
  performance metrics).

* **[diffhtml-components](/packages/diffhtml-components)**

  ``` sh
  npm install diffhtml-components
  ```

  Provides stateful React-like and v1 Web Component classes with a consistent
  API. If you're looking for drop-in React parity, refer to the
  [diffhtml-react-compat](/packages/diffhtml-react-compat) package.

* **[diffhtml-render-to-string](/packages/diffhtml-render-to-string)**

  ``` sh
  npm install diffhtml-render-to-string
  ```

  Use with diffHTML to render your Virtual Trees to strings. This is useful for
  server-side rendering and testing.

* **[babel-plugin-transform-diffhtml](/packages/babel-plugin-transform-diffhtml)**

  ``` sh
  npm install babel-plugin-transform-diffhtml
  ```

  Converts HTML found in tagged template strings to `createTree` calls and
  allows you to shave bytes off your bundles by switching to the
  diffHTML runtime build.

* [diffhtml-middleware-logger](/packages/diffhtml-middleware-logger)

  ``` sh
  npm install diffhtml-middleware-logger
  ```

  Logs out diffHTML state from the start and end of every render transaction.

* [diffhtml-middleware-synthetic-events](/packages/diffhtml-middleware-synthetic-events)

  ``` sh
  npm install diffhtml-middleware-synthetic-events
  ```

  Changes the event binding from inline event handlers like `onclick = fn` to
  use `addEventListener`. Events are attached to the `body` element and
  coordinated to children through delegation.

* [diffhtml-middleware-inline-transitions](/packages/diffhtml-middleware-inline-transitions)

  ``` sh
  npm install diffhtml-middleware-inline-transitions
  ```

  By default diffHTML provides transition hooks at a global level. This
  middleware turns them into scoped, performant, event hooks.

* [diffhtml-middleware-verify-state](/packages/diffhtml-middleware-verify-state)

  ``` sh
  npm install diffhtml-middleware-verify-state
  ```

  Asserts that a render properly updated the old Virtual Tree and the DOM. Will
  recursively search for inconsistencies, displays warnings unless debugging is
  enabled, then it throws errors instead.

* [diffhtml-middleware-service-worker](/packages/diffhtml-middleware-service-worker)

  ``` sh
  npm install diffhtml-middleware-service-worker
  ```

  Helps with the creation of a service worker for PWAs, available as a
  convenience to make development more friendlier.

* [diffhtml-react-compat](/packages/diffhtml-react-compat)

  ```
  npm install diffhtml-react-compat
  ```

  This is a compatibility package meant to be a drop-in replacement for the
  modules: `react` and `react-dom`. It wraps the [diffHTML
  Components](/packages/diffhtml-components) package as the base for the
  component constructors. It then layers additional React-specific APIs.

* [diffhtml-static-sync](/packages/diffhtml-static-sync)

  ```
  npm install diffhtml-static-sync
  ```

  A work-in-progress static HTML server that automatically reloads your markup
  as you save using Web Sockets.

* [diffhtml-devtools](/packages/diffhtml-devtools)

  A work-in-progress set of developer tools that logs out transactions.
  Eventually will allow for subscription/unsubscription of middleware, charting
  for the overall application health, and more.

* [diffhtml-website](/packages/diffhtml-website)

  The source for the [www.diffhtml.org](https://www.diffhtml.org) website,
  powered by: [Node](https://nodejs.com/) and [NodeGit](http://nodegit.org).

## Contributors

| [<img src="https://avatars0.githubusercontent.com/u/181635?v=4" width="100px;"/><br /><sub>Tim Branyen</sub>](https://tbranyen.com)<br />[💻](https://github.com/tbranyen/diffhtml/commits?author=tbranyen "Code") | [<img src="https://avatars0.githubusercontent.com/u/4371429?v=4" width="100px;"/><br /><sub>James DiGioia</sub>](http://jamesdigioia.com)<br />[💻](https://github.com/tbranyen/diffhtml/commits?author=mAAdhaTTah "Code") |
|:---:|:---:|
