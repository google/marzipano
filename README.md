# Marzipano

A 360° media viewer for the modern web.

This is not an official Google product.

Check out our website at http://www.marzipano.net/,
including the [demos](http://www.marzipano.net/demos.html)
and the [documentation](http://www.marzipano.net/docs.html).

### User guide

You can include Marzipano in your project in two different ways:

* Obtain the `marzipano.js` and `marzipano.swf` files from the latest release
  at http://www.marzipano.net and copy them into your project.

* Install Marzipano as a dependency using the `npm` package manager and
  `require` it as a module.

### Developer guide

This is an `npm`-based project.
A [Node.js](http://www.nodejs.org) installation is required for development. 
You also need a Java compiler to build the SWF file containing the Flash renderers. (Set 32-bit Java path in your PATH, as MXMLC does not support 64-bit Java) 

Run `npm install` to install the dependencies. If you haven't in a while,
bring them up to date with `npm update`.

Run `npm run dev` to serve this directory at `http://localhost:8080`.
While this script is running, the demos are live-reloaded whenever the source
files are edited.

Run `npm run test` to serve the browser-based test suite at `http://localhost:7357`.
While this script is running, the test suite is live-reloaded whenever the
source or test files are edited.

### Maintainer guide

Before preparing a release, make sure there are no uncommitted changes.
Create a new commit to bump the version number in `package.json` and tag it
with `git tag vX.Y.Z`.

Run `npm run release` to prepare a new release.

Run `npm run deploy` to deploy the release to the website.

Run `npm publish` to publish the release to the npm registry.
