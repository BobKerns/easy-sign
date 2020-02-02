# Project Easy-Sign

This provides an easy-to-use and secure interface to create and use digital signatures within an
application.

# Features
This solves a simpler problem than the bare crypto APIs, which have to concern themselves with
a host of options to interoperate with a wide range of algorithms and data formats. (And it
offers only a small subset of all the options out there).

The focus is on an API that is easy to use in a cryptographically-sound way.
* Ease of use
  * Task-oriented API
  * Limited configuration choices. It is pre-configured to use the appropriate modern algorithms
    at a strength suitable for most cases.
  * Eliminating the requirement for interoperability means you can focus on your application's
    needs, without worrying about what attribute the JWS and JWT standards might specify for
    your need.
  * Supports the large majority of Javascript objects.
  * Supports circular datastructures.
* Follows security best practices out-of-the-box
  * Proper use of salt and iv handled automatically.
  * Keystores are encrypted under a password and PEM-formatted

# Content

## Primary organization

The important files are the outputs included in the published module, and the sources that
produce them. The rest are supporting mechanisms.

## package.json

This describes the package, it's role in the world,

You should edit package.json, with special attention to these fields:
* `name:`
* `version:`
* `description:`
* `repository.url:`
* `keywords:`
* `license:`
* `bugs.url:`
* `homepage:`

## /lib/

This holds the built Javascript files. By default, three versions are built, for compatibility with various module systems. Ultimately, the world is moving toward the ECMAScript module format, but in the meantime,
### /lib/esm
This holds files in the ECMAScript module format.

### /lib/cjs
This uses the CommonJS used traditionally by node.

### /lib/umd
This holds files in the UMD format, a flat file loadable by web browsers.

## [/assets](/assets/README.md)
Data files to be used in documentation or runtime in the application.

## [/config](/config/README.md)
This holds files used to globally configure the project. These are often redirected from the project root, to place them in one place, and to enable the use of typescript rather than javascript.

## [/devtools](/devtools/README.md)
This holds code used to to build the main project. It is built before the main project is configured.

It is initially empty.

## /docs
A generated directory with documentation. Some content may be installed from [/assets](/assets/README.md)

### /docs/api
The generated API documentation via [typedoc](https://typedoc.org)

## /node_modules
This directory is created and managed by [npm](https://npmjs.com), via the `npm install` command.

## [/src](/src/README.md)
This hierarchy contains the project's source code and related tests.

# Top level files
* .editorconfig
* .gitignore
* .npmignore — hides build infrastructure, sources, etc. from the final npm package.
* travis.yml -- configuration for building automatically on [Travis](https://travis-ci.com/)
* rollup.config.js -- redirects to [/config/rollup.config.ts](/config/rollup.config.ts)
*

