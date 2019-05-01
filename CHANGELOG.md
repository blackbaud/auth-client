# 2.14.0 (2019-05-01)

- Improved browser support for cross-domain auth token requests. (#88)

# 2.13.0 (2019-02-08)

- Added `hideResourceLinks` config property which hides the menu items above the "Sign out" menu item in the user menu. (#81)

# 2.12.0 (2018-11-08)

- Updated token requests to allow legal entity ID to be specified with a permission scope; previously permission scope could only be specified if environment ID were specified. (#79)

# 2.11.0 (2018-10-31)

- Added `navVersion` config property. (#78)

# 2.10.0 (2018-10-01)

- Updated inactivity prompt to be shown with a higher z-index to avoid being covered up by a page's contents in more cases. (#75)

# 2.9.0 (2018-08-30)

- Updated user activity session renewal logic to reflect new max session age value from BBID. (#73)

# 2.8.0 (2018-08-29)

- Added the ability to enforce legal entity context with `BBContextProvider`. (#71)

# 2.7.1 (2018-06-21)

- Fixed issue where user could be redirected to an error page if a pending request was interrupted. (#69)

# 2.7.0 (2018-06-14)

- Added interfaces and methods for theming the omnibar. (#67)

# 2.6.0 (2018-05-22)

- Added support for passing legal entity ID when retrieving a token.

# 2.5.0 (2018-05-09)

- Optimized the `BBAuth.getToken()` method by bypassing the CSRF endpoint which is no longer required by BBID. (#63)

# 2.4.0 (2018-04-17)

- Added `BBContextProvider` class which allows an application to ensure the proper context (such as environment ID) is supplied to the application either by automatically selecting a default context or by allowing the user to select a context. (#61)

# 2.3.0 (2018-03-22)

- Fixed accessibility issues. (#59)

# 2.2.0 (2017-11-29)

- The legacy keep-alive URL can now be set by the omnibar through the navigation service response instead of being specified at load time. The `legacyKeepAliveUrl` property of `BBOmnibarConfig` should now be considered deprecated and will be removed in a future major version. (#56)

# 2.1.0 (2017-11-08)

- Added ability to specify an environment ID when retrieving a token.  When not a member of the specified environment, the user will be redirected to an error page.  Specifying an environment ID also adds the environment ID to the JWT token so that consumers of the token can know the user is part of the specified environment.  Note that previously an environment ID could be specified but only when combined with a permission scope. (#55)

# 2.0.0 (2017-10-24)

- The 2.0.0 release introduces a few breaking changes, so upgrading to it will require changes to your code.

 - The `experimental` omnibar config option has been removed, and what was formerly referred to as the "experimental" omnibar is now the default omnibar.  To load the legacy omnibar (equivalent to not specifying the `experimental` flag in auth-client 1.x), use the new `BBOmnibarLegacy` class and call its `load()` rather than the `load()` method on `BBOmnibar`.

 - `BBAuth.getToken()` now only accepts an `args` parameter of type `BBAuthGetTokenArgs`.  Previously, the method overloaded the first argument to accept either an `args` parameter or a `forceNewToken` boolean parameter as well as a second `disableRedirect` parameter.  `forceNewToken` and `disableRedirect` should now be specified on the `args` object.

 - Several TypeScript config/DTO-style `class`es have been converted to `interface`s.  This keeps these types from being reified (i.e. generating a runtime artifact after transpilation to JavaScript) and results in a smaller bundle.  This should have no effect on your code unless you're doing something unusual like calling one of these type's constructors.

# 1.18.0 (2017-10-13)

- The new omnibar will now display the current environment name in a bar under the main omnibar when the user exists in more than one envrionment. (#52)

# 1.17.1 (2017-10-12)

- Fixed flicker when new omnibar is rendered. (#51)

# 1.17.0 (2017-10-11)

- Added `htmlFields` property to search results object for specifying which search result fields contain HTML elements and should not be escaped when displayed. (#50)

# 1.16.0 (2017-10-02)

- Added configuration option to omnibar to allow anonymous users to access pages that do not require authentication. (#49)
- Fixed bug where users were redirected to signin on inactivity when the site allowed anonymous access. (#49)

# 1.15.0 (2017-09-06)

- Added additional search results properties. (#48)

# 1.14.0 (2017-09-05)

- Added `session-refresh` message that will be posted to the legacy keep-alive IFRAME when the user's Blackbaud session changes. (#46)

# 1.13.0 (2017-08-24)

- Added basic support for a legacy keep-alive IFRAME when using the experimental omnibar. (#43)
- Ensure `menuEl` is a jQuery object before passing it through to the underlying omnibar widget. (#44)

# 1.12.0 (2017-08-15)

- Added support for showing an inactivity prompt. (#41)

# 1.11.0 (2017-08-02)

- Added support for local notifications. (#39)

# 1.10.1 (2017-07-25)

- Export `BBAuthGetTokenArgs` class in main barrel file. (#38)

# 1.10.0 (2017-07-19)

- Added ability to specify a permission scope when requesting an auth token so that permissions can be returned in the token. (#37)

# 1.9.1 (2017-07-14)

- Fixed experimental omnibar rendering issue in IE 11. (#36)

# 1.9.0 (2017-06-30)

- Added `localSearch` property to the `nav-ready` event when the consumer has defined a local search callback. (#35)

# 1.8.2 (2017-06-16)

- Fixed issue where background watcher iframe was keyboard focusable and interfered with assistive technology. (#34)

# 1.8.1 (2017-06-06)

- Fixed issue where the experimental omnibar's tab order was not first on the page. (#33)

# 1.8.0 (2017-06-02)

- Added minified bundle for vanilla JavaScript projects. (#32)

# 1.7.0 (2017-05-30)

- Added ability to open the help widget from the experimental omnibar. (#30)

# 1.6.0 (2017-05-24)

- Added `subtitle` and `label` properties to search results object. (#28)
- Respect `enableHelp` config property for the new omnibar. (#28)

# 1.5.0 (2017-05-16)

- Added ability to disable automatic redirect to the sign-in page when failing to retrieve a token and instead reject the returned promise. This allows the caller to handle the case when a user is not logged in, such as when retrieving a token to optionally display user data. (#23)

# 1.4.0 (2017-05-15)

- Added ability to specify a list of services and their navigation items in the omnibar config object. (#21)

# 1.3.2 (2017-05-10)

- Fixed dependency reference for `remap-istanbul`.

# 1.3.1 (2017-04-27)

- Fixed issue where making multiple calls to `BBAuth.getToken()` before the first request completed resulted in multiple token requests. (#15) (Thanks @Blackbaud-MatthewBell!)

# 1.3.0 (2017-04-26)

- Fixed an issue retrieving a token in IE (#13) (Thanks @Blackbaud-MatthewBell!)
- More infrastructure around the experimental omnibar (#14)

# 1.2.0 (2017-04-25)

- Added support for running local search from omnibar (#12)
- Added support for passing auth token from host page to omnibar (#12)

# 1.1.0 (2017-04-17)

 - Updated logic for loading jQuery so that a newer version of jQuery already loaded onto the page does not get overwritten with an older version required by omnibar. (#8) (Thanks @Blackbaud-RoseWhipple!)
 - Added ability to retrieve a mock token for consumers testing non-production code. (#9)

# 1.0.0 (2017-04-11)

 - Version 1.0
