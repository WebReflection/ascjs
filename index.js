const cherow = require('cherow');

const babelified = `Object.defineProperty(exports, '__esModule', {value: true}).default`;
const asDefault = name => name === 'default' ? babelified : `exports.${name}`;
const fromDefault = defaultImport => `(m => m.__esModule ? m.default : m)(${defaultImport})`;

const replace = {

  ImportDeclaration(code, item) {
    const source = item.source;
    const name = code.slice(source.start, source.end);
    const esm = code.slice(item.start, item.end);
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
    return {
      start: item.start,
      end: item.end,
      esm,
      cjs: imported.join('\n')
    };
  },

  ExportAllDeclaration(code, item) {
    const source = item.source;
    const esm = code.slice(item.start, item.end);
    const cjs = `(m => Object.keys(m).map(k => k !== 'default' && (exports[k] = m[k])))\n(require(${
      code.slice(source.start, source.end
    )}));`;
    return {
      start: item.start,
      end: item.end,
      esm, cjs
    };
  },

  ExportDefaultDeclaration(code, item) {
    const declaration = item.declaration;
    const esm = code.slice(item.start, item.end);
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
    return {
      start: item.start,
      end: item.end,
      esm, cjs
    };
  },

  ExportNamedDeclaration(code, item) {
    const declaration = item.declaration;
    const source = item.source;
    const esm = code.slice(item.start, item.end);
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
      declaration.declarations.forEach(specifier => {
        cjs += `${asDefault(specifier.id.name)} = ${specifier.id.name}${EOL}`;
      });
    }
    if (source) cjs += `})(require(${
      code.slice(source.start, source.end)
    }));\n`;
    return {
      start: item.start,
      end: item.end,
      esm,
      cjs: cjs.trim()
    };
  }
};

const parse = code => {
  const out = [];
  const chunks = [];
  code = code.toString();
  cherow.parseModule(code, parse.options).body.forEach(item => {
    if (replace.hasOwnProperty(item.type)) {
      chunks.push(replace[item.type](code, item));
    }
  });
  const length = chunks.length;
  for (let c = 0, i = 0; i < length; i++) {
    out.push(
      code.slice(c, chunks[i].start),
      chunks[i].cjs
    );
    c = chunks[i].end;
  }
  out.push(length ? code.slice(chunks[length - 1].end) : code);
  return "'use strict';\n" + out.join('');
};

parse.options = {
  jsx: true,
  next: true,
  ranges: true,
  v8: true
};

module.exports = parse;
