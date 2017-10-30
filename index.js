const esprima = require('esprima');
const defaultOptions = {
  sourceType: 'module',
  jsx: true,
  range: true,
  tolerant: true
};

const babelified = `Object.defineProperty(exports, '__esModule', {value: true}).default`;
const asDefault = name => name === 'default' ? babelified : `exports.${name}`;
const fromDefault = defaultImport => `(m => m.__esModule ? m.default : m)(${defaultImport})`;

const slice = (code, info) => code.slice(info.range[0], info.range[1]);
const chunk = (info, esm, cjs) => ({
  start: info.range[0],
  end: info.range[1],
  esm, cjs
});

const replace = {

  ImportDeclaration(code, item) {
    const source = item.source;
    const name = withoutCDN(slice(code, source));
    const esm = slice(code, item);
    const SEPS = /\{(\s+)/.test(esm) ? RegExp.$1 : '';
    const SEPE = /(\s+)\}/.test(esm) ? RegExp.$1 : '';
    const SEP = /(,\s+)[^{]/.test(esm) ? RegExp.$1 : ', ';
    const EOL = /;$/.test(esm) ? ';' : '';
    const imported = [];
    const specifiers = [];
    let defaultImport = `require(${name})`;
    if (item.specifiers.length) {
      item.specifiers.forEach(specifier => {
        switch(specifier.type) {
          case 'ImportDefaultSpecifier':
            imported.push(
              `const ${specifier.local.name} = ${fromDefault(defaultImport)}${EOL}`
            );
            break;
          case 'ImportNamespaceSpecifier':
            imported.push(
              `const ${specifier.local.name} = ${defaultImport}${EOL}`
            );
            break;
          case 'ImportSpecifier':
            specifiers.push(
              specifier.local.name === specifier.imported.name ?
              specifier.local.name :
              `${specifier.imported.name}: ${specifier.local.name}`
            );
            break;
        }
      });
      if (specifiers.length) {
        imported.push(
          `const {${SEPS}${specifiers.join(SEP)}${SEPE}} = ${defaultImport}${EOL}`
        );
      }
    } else {
      imported.push(`${defaultImport}${EOL}`);
    }
    return chunk(item, esm, imported.join('\n'));
  },

  ExportAllDeclaration(code, item) {
    const source = item.source;
    const esm = slice(code, item);
    const cjs = `(m => Object.keys(m).map(k => k !== 'default' && (exports[k] = m[k])))\n(require(${
      withoutCDN(slice(code, source))
    }));`;
    return chunk(item, esm, cjs);
  },

  ExportDefaultDeclaration(code, item) {
    const declaration = item.declaration;
    const esm = slice(code, item);
    let cjs;
    switch (declaration.type) {
      case 'AssignmentExpression':
      case 'FunctionDeclaration':
        if (declaration.id) {
          cjs = `${esm.replace(/^export\s+default\s+/, '')}\n${babelified} = ${declaration.id.name}`;
        } else {
          cjs = esm.replace(/^export\s+default\s+/, `${babelified} = `);
        }
        break;
      case 'Identifier':
        cjs = esm.replace(/^export\s+default\s+/, `${babelified} = `);
        break;
    }
    return chunk(item, esm, cjs);
  },

  ExportNamedDeclaration(code, item) {
    const declaration = item.declaration;
    const source = item.source;
    const esm = slice(code, item);
    const EOL = /;$/.test(esm) ? ';\n' : '\n';
    let cjs = source ? '(m => {\n' : '';
    item.specifiers.forEach(specifier => {
      cjs += `${
        source ? '  ' : ''
      }${asDefault(specifier.exported.name)} = ${
        source ? 'm.' : ''
      }${specifier.local.name}${EOL}`;
    });
    if (declaration) {
      cjs += esm.replace(/^export\s+/, '') + '\n';
      (declaration.declarations || [declaration]).forEach(specifier => {
        cjs += `${asDefault(specifier.id.name)} = ${specifier.id.name}${EOL}`;
      });
    }
    if (source) cjs += `})(require(${
      withoutCDN(slice(code, source))
    }));\n`;
    return chunk(item, esm, cjs.trim());
  }
};

const parse = (code, options) => {
  const out = [];
  const chunks = [];
  code = code.toString();
  esprima.parse(
    code,
    Object.assign(
      {},
      defaultOptions,
      options
    ),
    item => {
      if (replace.hasOwnProperty(item.type)) {
        chunks.push(replace[item.type](code, item));
      }
    }
  );
  const length = chunks.length;
  let c = 0;
  for (let i = 0; i < length; i++) {
    out.push(
      code.slice(c, chunks[i].start),
      chunks[i].cjs
    );
    c = chunks[i].end;
  }
  out.push(length ? code.slice(c) : code);
  return "'use strict';\n" + out.join('');
};

const withoutCDN = name =>
  /^(['"`])https?:\/\/(?:unpkg\.com)\/([^@/]+)\S*?\1$/.test(name) ?
    `${RegExp.$1}${RegExp.$2}${RegExp.$1}` : name;

module.exports = parse;
