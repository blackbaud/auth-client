# @blackbaud/auth-client
Provides a client-side library for interacting with Blackbaud authentication.

## Installation

- Ensure that you have Node v6+ and NPM v3+. To verify this, run `node -v` and `npm -v` at the command line.
- For Mac OS X, we recommend that you use [Node Version Manager (nvm)](https://github.com/creationix/nvm) to wrap your NodeJS installation so that it installs in your user directory and avoids permission-related issues.
- From the command line, run `npm install blackbaud/auth-client -g` (Note the lack of `@` at the beginning of the package name.  This is because auth client has not yet been registered with NPM).

## Usage

### Standalone (TypeScript)

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

### With SKY UX Builder

You can easily wire in the initial auth token check as a step to a SKY UX project's boostrap logic.  In the event that the user is not logged in, this will prevent the rest of the application from being bootstrapped.

```
import { SkyAppBootstrapper } from '@blackbaud/skyux-builder/runtime';
import { BBAuth, BBOmnibar } from '@blackbaud/auth-client';

// Make an initial attempt to get an auth token.  If the user is not currently logged in,
// this code will redirect the browser to Blackbaud's sign-in page.
let tokenPromise = BBAuth.getToken();

tokenPromise.then(() => {
  // The user is logged in; load the omnibar.
  BBOmnibar.load({
    serviceName: 'Some service name'
  });
});

// Hand the token Promise to the SKY UX application bootstrapper so the application is
// only bootstrapped if the user is logged in.
SkyAppBootstrapper.bootstrapper = tokenPromise;
```
