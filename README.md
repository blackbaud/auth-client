# @blackbaud/auth-client
Provides a client-side library for interacting with Blackbaud authentication.

## Installation

- Ensure that you have Node v6+ and NPM v3+. To verify this, run `node -v` and `npm -v` at the command line.
- For Mac OS X, we recommend that you use [Node Version Manager (nvm)](https://github.com/creationix/nvm) to wrap your NodeJS installation so that it installs in your user directory and avoids permission-related issues.
- From the command line, run `npm install blackbaud/auth-client -g` (Note the lack of `@` at the beginning of the package name.  This is because auth client has not yet been registered with NPM).

## Usage

### Standalone (ES6/TypeScript)

There are two classes available in this package: `BBAuth` and `BBOmnibar`.  `BBAuth` allows you to retrieve an auth token from the Blackbaud authentication service, and `BBOmnibar` allows you to render the omnibar at the top of the page.

You can use these in combination to integrate your application with Blackbaud authentication.

```
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

```
import { BBAuth } from '@blackbaud/auth-client';

BBAuth.getToken()
  .then((token: string) => {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);

    xhr.setRequestHeader('Authorization', 'Bearer ' + token);

    xhr.send();
  });
```
