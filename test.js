const ascjs = require('./index.js');

const bold = text => `\x1B[1m${text}\x1B[0m`;

const tests = [
  {
    esm: 'console.log(import.meta.url);',
    cjs: `console.log(({url: require('url').pathToFileURL(__filename).href}).url);`
  },
  // nothing to do
  {
    esm: '',
    cjs: ''
  },
  // exports
  {
    esm: `const name1 = 1, name2 = 2, nameN = 3; export { name1, name2, nameN }`,
    cjs: `const name1 = 1, name2 = 2, nameN = 3; exports.name1 = name1\nexports.name2 = name2\nexports.nameN = nameN`
  },
  {
    esm: `export { name1, name2, nameN } from "module"`,
    cjs: `(m => {\n  exports.name1 = m.name1\n  exports.name2 = m.name2\n  exports.nameN = m.nameN\n})(require("module"));`
  },
  {
    esm: `const name0 = 0, name1 = 1; export { name0, name1 as default };`,
    cjs: `const name0 = 0, name1 = 1; exports.name0 = name0;\nObject.defineProperty(exports, '__esModule', {value: true}).default = name1;`
  },
  {
    esm: `export { name0, name1 as default } from "shenanigans"`,
    cjs: `(m => {\n  exports.name0 = m.name0\n  Object.defineProperty(exports, '__esModule', {value: true}).default = m.name1\n})(require("shenanigans"));`
  },
  {
    esm: `const variable1 = 1, variable2 = 2, nameN = 3; export { variable1 as name1, variable2 as name2, nameN };`,
    cjs: `const variable1 = 1, variable2 = 2, nameN = 3; exports.name1 = variable1;\nexports.name2 = variable2;\nexports.nameN = nameN;`
  },
  {
    esm: `export let name1 = 1, name2 = function () {}, nameN = 'N';`,
    cjs: `let name1 = 1, name2 = function () {}, nameN = 'N';\nexports.name1 = name1;\nexports.name2 = name2;\nexports.nameN = nameN;`
  },
  {
    esm: `export default function () {};`,
    cjs: `Object.defineProperty(exports, '__esModule', {value: true}).default = function () {};`
  },
  {
    esm: `export default function named() {};`,
    cjs: `function named() {}\nObject.defineProperty(exports, '__esModule', {value: true}).default = named;`
  },
  {
    esm: `export default sideEffect = true;`,
    cjs: `Object.defineProperty(exports, '__esModule', {value: true}).default = sideEffect = true;`
  },
  {
    esm: `export const identifier = 123;`,
    cjs: `const identifier = 123;\nexports.identifier = identifier;`
  },
  {
    esm: `const identifier = 123;\nexport {identifier};`,
    cjs: `const identifier = 123;\nexports.identifier = identifier;`
  },
  {
    esm: `const identifier = 123;\nexport default identifier;`,
    cjs: `const identifier = 123;\nObject.defineProperty(exports, '__esModule', {value: true}).default = identifier;`
  },
  {
    esm: `export * from "foo";`,
    cjs: `(m => Object.keys(m).map(k => k !== 'default' && (exports[k] = m[k])))\n(require("foo"));`
  },
  // imports
  {
    esm: `import * as name from "module-name";`,
    cjs: `const name = require("module-name");`
  },
  {
    esm: `import { name } from "module-name";`,
    cjs: `const { name } = require("module-name");`
  },
  {
    esm: `import {name} from "module-name"`,
    cjs: `const {name} = require("module-name")`
  },
  {
    esm: `import { name as alias } from "module-name";`,
    cjs: `const { name: alias } = require("module-name");`
  },
  {
    esm: `import { export1 , export2 } from "module-name";`,
    cjs: `const { export1, export2 } = require("module-name");`
  },
  {
    esm: `import { export1 , export2 as alias2 } from "module-name";`,
    cjs: `const { export1, export2: alias2 } = require("module-name");`
  },
  {
    esm: `import defaultExport, { otherExport } from "module-name"`,
    cjs: `const defaultExport = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require("module-name"))\nconst { otherExport } = require("module-name")`
  },
  {
    esm: `import defaultExport, * as name from "module-name";`,
    cjs: `const defaultExport = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require("module-name"));\nconst name = require("module-name");`
  },
  {
    esm: `import "foo";`,
    cjs: `require("foo");`
  },
  {
    esm: `import 'foo';`,
    cjs: `require('foo');`
  },
  {
    esm: `import "foo"`,
    cjs: `require("foo")`
  },
  {
    esm: `export function test() {}`,
    cjs: `function test() {}\nexports.test = test`
  },
  {
    esm: `export default function () {}`,
    cjs: `Object.defineProperty(exports, '__esModule', {value: true}).default = function () {}`
  },
  {
    esm: `export default function test() {};`,
    cjs: `function test() {}\nObject.defineProperty(exports, '__esModule', {value: true}).default = test;`
  },
  {
    esm: `import "https://unpkg.com/hyperhtml@latest/min.js"`,
    cjs: `require("hyperhtml")`
  },
  {
    esm: `export default {a: 1, b: 2};`,
    cjs: `Object.defineProperty(exports, '__esModule', {value: true}).default = {a: 1, b: 2};`
  },
  {
    esm: `export default [1, 2, 3]`,
    cjs: `Object.defineProperty(exports, '__esModule', {value: true}).default = [1, 2, 3]`
  },
  {
    esm: `'use strict';\nmodule.exports = 123;`,
    cjs: `module.exports = 123;`
  }
];

console.log(`${bold('ascjs')} v${require('./package.json').version} - ${tests.length} tests\n`);

tests.forEach(code => {
  console.assert(
    ("'use strict';\n" + code.cjs) === ascjs(code.esm),
    `\n${bold('Source')}\n${code.esm}\n${bold('Expected')}\n${code.cjs}\n${bold('Received')}\n${ascjs(code.esm)}\n`
  );
});

console.log(
  ascjs(
    'import I from "test";\nexport default function E() {}',
    {IMPORT: 'require.I', EXPORT: 'require.E(exports)'}
  ) ===
  `'use strict';\nconst I = require.I(require("test"));\nfunction E() {}\nrequire.E(exports).default = E`,
  'both import and export can be overwritten'
);