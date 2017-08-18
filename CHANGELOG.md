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
