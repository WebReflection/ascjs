# ascjs

[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC) [![Build Status](https://travis-ci.org/WebReflection/ascjs.svg?branch=master)](https://travis-ci.org/WebReflection/ascjs) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/ascjs/badge.svg?branch=master)](https://coveralls.io/github/WebReflection/ascjs?branch=master) [![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&style=flat)](https://github.com/WebReflection/donate) [![Greenkeeper badge](https://badges.greenkeeper.io/WebReflection/ascjs.svg)](https://greenkeeper.io/)

ES2015 to CommonJS import/export transformer

- - -

### Looking for a CommonJS minimalistic bundler ?

Fully based on _ascjs_, **[asbundle](https://github.com/WebReflection/asbundle)** is a no-brainer to create out of the box browser compatible bundles. Don't miss it out!

- - -

This module does one thing only:
it loosely transpiles **ES2015** [import](https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/import)/[export](https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export) statements **into** valid **CommonJS** in order to fix the only part of Node that's incompatible with modern JS.

## How to

You can use _ascjs_ as binary utility or as module.

```sh
npm install -g ascjs

# to see what you can do
ascjs --help

```

As executable, you can use _ascjs_ to output, or save, some code content.
```sh
ascjs code
ascjs --ignore=a.js,b.js sourceFile
ascjs --no-default
ascjs sourceFile
ascjs sourceFile destFile

# folders are recursively parsed
# destFolder is mandatory
ascjs sourceFolder destFolder
```

You can also use it via pipe operator.
```sh
echo code | ascjs
cat source.js | ascjs | uglifyjs -o dest.js
```

As module, you can require it and use it to convert ESM to CJS.
```js
const ascjs = require('ascjs');

ascjs('import "test";');
// require("test");
```

### Features

  * extremely lightweight, based on [babylon](https://github.com/babel/babylon) for performance and reliability, it transforms only imports/exports ignoring everything else
  * produces modern JavaScript, you are in charge of extra transformations if needed
  * indentation, spaces, semi or no-semi are preserved: beautiful source code remains beautiful
  * uses same [Babel](http://babeljs.io) convention, resolving `export default ...` intent as `exports.default`
  * you can finally write `.js` code and transform it for Node only before publishing on _npm_
  * you could write `.mjs` modules and transform them into CommonJS for [Browserify](http://browserify.org) or other bundlers as target

### Constrains

  * live bindings for exported values are not preserved. You need to delegate in scope eventual changes
  * dynamic `import(...)` is untouched. If you write that, let [Webpack](https://webpack.js.org) handle it for you later on
  * there is no magic whatsoever in module names resolution, what you write in ESM is what you get as CJS

### Flags

  * `--ignore=...` a comma separated paths to ignore parsing
  * `--no-default` remove the `__esModule` flag and export default via `module.exports = `

### Example
This module can transform the following ES2015+ code
```js
import func, {a, b} from './module.js';
import * as tmp from 'other';

const val = 123;

export default function test() {
  console.log('ascjs');
};

export {func, val};
```
into the following one:
```js
'use strict';
const func = (m => m.__esModule ? m.default : m)(require('./module.js'));
const {a, b} = require('./module.js');
const tmp = require('other');

const val = 123;

function test() {
  console.log('ascjs');
}
Object.defineProperty(exports, '__esModule', {value: true}).default = test;

exports.func = func;
exports.val = val;
```