# Marzipano

A 360° media viewer for the modern web.

This is not an official Google product.

Check out our website at http://www.marzipano.net/,
including the [demos](http://www.marzipano.net/demos.html)
and the [documentation](http://www.marzipano.net/docs.html).

Please report bugs using the [issue tracker](https://github.com/google/marzipano/issues). If you have any questions, head over to our [discussion forum](https://groups.google.com/forum/#!forum/marzipano).

### User guide

You can include Marzipano in your project in two different ways:

* Obtain the `marzipano.js` file from the latest release at
  http://www.marzipano.net and copy them into your project.

* Install Marzipano as a dependency using the `npm` package manager and
  `require` it as a module.

### Developer guide

This is an `npm`-based project.
A [Node.js](http://www.nodejs.org) installation is required for development.

Some dependencies expect the Node.js interpreter to be called `node`. However,
on Debian and Ubuntu systems, the binary installed by the `nodejs` package is
called `nodejs`. To work around this, install the `nodejs-legacy` package, or
use [nvm](https://github.com/creationix/nvm) instead.

Run `npm install` to install the dependencies. If you haven't in a while,
bring them up to date with `npm update`.

Run `npm run dev` to serve this directory at `http://localhost:8080`.
While this script is running, the demos are live-reloaded whenever the source
files are edited.

Run `npm test` to automatically run the browser-based test suite on all
available browsers in your system.

Run `npm run livetest` to serve the browser-based test suite at `http://localhost:7357`.
While this script is running, the test suite is live-reloaded whenever the
source or test files are edited.

### Maintainer guide

Before preparing a release, make sure there are no uncommitted changes and
verify that the tests pass and all of the demos work correctly.

Update the `CHANGELOG` file and bump the version number in `package.json`.
Create a new commit containing only the changes to these two files, tag it with
`git tag vX.Y.Z`, and push it to GitHub with `git push --tags`.

Run `npm run release` to prepare a new release.

Run `npm run deploy` to deploy the release to the website.

Run `npm publish` to publish the release to the npm registry.
