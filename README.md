# @blackbaud/auth-client

[![npm](https://img.shields.io/npm/v/@blackbaud/auth-client.svg)](https://www.npmjs.com/package/@blackbaud/auth-client)
[![status](https://travis-ci.org/blackbaud/auth-client.svg?branch=master)](https://travis-ci.org/blackbaud/auth-client)
[![coverage](https://codecov.io/github/blackbaud/auth-client/coverage.svg?branch=master)](https://codecov.io/github/blackbaud/auth-client/)

Provides a client-side library for interacting with Blackbaud authentication.

## Installation

- Ensure that you have Node v6+ and NPM v3+. To verify this, run `node -v` and `npm -v` at the command line.
- Install the library as a dependency of your project by running `npm install @blackbaud/auth-client --save` in your project's folder.

## Usage

### Prerequisites

The auth client library makes extensive use of [ES6-style Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), so in order to support browsers that do not yet have native support for Promises (such as Internet Explorer 11) you will need to include a Promise polyfill such as [`es6-promise`](https://github.com/stefanpenner/es6-promise) and use the [auto-polyfill feature](https://github.com/stefanpenner/es6-promise#auto-polyfill) of the library so that `Promise` is added to the global environment.  This will need to be loaded on your page before the auth client library.

### ES6/TypeScript

There are two classes available in this package: `BBAuth` and `BBOmnibar`.  `BBAuth` allows you to retrieve an auth token from the Blackbaud authentication service, and `BBOmnibar` allows you to render the omnibar at the top of the page.

You can use these in combination to integrate your application with Blackbaud authentication.

```ts
import { BBAuth, BBOmnibar } from '@blackbaud/auth-client';

// Make an initial attempt to get an auth token.  If the user is not currently logged in,
// this code will redirect the browser to Blackbaud's sign-in page.
BBAuth.getToken()
  .then(() => {
    // The user is logged in; load the omnibar.
    BBOmnibar.load({
      serviceName: 'Some service name'
    });

    // Add additional logic to bootstrap the rest of the application.
  });
```

To make authorized requests to your web service endpoints you will also use the `BBAuth.getToken()` method to retrieve a token that can be added as a header to your request.  Since retrieving a token is an asynchronous operation, this method returns a `Promise`, so you should wait until the Promise is resolved before making your web request.

```ts
import { BBAuth } from '@blackbaud/auth-client';

BBAuth.getToken()
  .then((token: string) => {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);

    xhr.setRequestHeader('Authorization', 'Bearer ' + token);

    xhr.send();
  });
```

### Vanilla JavaScript/ES5

Auth client is also distributed as a UMD bundle.  If you're using ES5 with Node or a tool like Browserify you can `require()` it:

```js
var BBAuthClient = require('@blackbaud/auth-client');

BBAuthClient.BBOmnibar.load({
  serviceName: 'Some service name'
});
```

If you're not using a module loader or prefer to reference the file via CDN, you can load the file onto your page via `<script>` tag.

If using NPM, add a reference to `dist/bundles/auth-client.umd.js` or concatenate that file with the rest of your page's JavaScript.

If using the SKY UX CDN, add a reference to `https://sky.blackbaudcdn.net/static/auth-client/[VERSION]/auth-client.global.min.js`, where `[VERSION]` is the version you'd like to use.  All versions published to NPM are also available through the CDN.  You can also reference the latest major version. Example versions:

- `https://sky.blackbaudcdn.net/static/auth-client/2.24.0/auth-client.global.min.js`
- `https://sky.blackbaudcdn.net/static/auth-client/2/auth-client.global.min.js`

You can now access it via the global `BBAuthClient` variable:

```js
// BBAuthClient is global here.
BBAuthClient.BBOmnibar.load({
  serviceName: 'Some service name'
});
```
