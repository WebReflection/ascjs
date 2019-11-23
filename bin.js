#!/usr/bin/env node

const path = require('path');
const $ascjs = require('./index.js');
const ascjs = input => {
  const output = $ascjs(input);
  return noDefault ?
          output.replace(`${$ascjs.EXPORT}.default`, 'module.exports') :
          output;
};

const argv = process.argv.slice(2);
const files = argv.filter(arg => /^[^-]/.test(arg));
const options = argv.filter(arg => /^-/.test(arg));

let noDefault = false;
const ignore = [];
options.forEach(arg => {
  if (/^--no-default$/.test(arg))
    noDefault = true;
  else if (/^--ignore=/.test(arg))
    ignore.push.apply(
      ignore,
      arg.slice(9).replace(/^('|")|('|")$/g, '').split(',')
          .map(file => path.resolve(__dirname, file))
    );
});

const source = files[0];
if (files.length < 1 && options.length) {
  const info = require('./package.json');
  console.log(`
\x1B[1mascjs\x1B[0m v${info.version}
${'-'.repeat(info.description.length)}
${info.description}
${'-'.repeat(info.description.length)}

# as executable
ascjs code
ascjs --ignore=a.js,b.js sourceFile
ascjs --no-default
ascjs sourceFile destFile
ascjs sourceFolder destFolder # dest is required

# as pipe
echo code | ascjs
cat sourceFile | ascjs

${'-'.repeat(info.description.length)}
${' '.repeat(info.description.length)
      .slice(0, -(3 + info.author.length))}by ${info.author}
`);
} else if (files.length) {
  const fs = require('fs');
  const dest = files[1];
  fs.stat(source, (err, stat) => {
    if (err) {
      process.stdout.write(ascjs(source));
    } else if (stat.isFile()) {
      fs.readFile(source, (err, source) => {
        if (err) throw err;
        if (dest) fs.writeFileSync(dest, ascjs(source));
        else process.stdout.write(ascjs(source));
      });
    } else if (stat.isDirectory() && dest && fs.statSync(dest).isDirectory()) {
      const cjsDest = path.resolve(process.cwd(), dest);
      process.on('exit', () => {
        const cjsPackage = path.join(cjsDest, 'package.json');
        if (!fs.existsSync(cjsPackage))
          fs.writeFileSync(cjsPackage, JSON.stringify({type: 'commonjs'}));
      });
      const mkdir = dir => {
        try{ fs.mkdirSync(dir); }
        catch(e){
          if(e.errno === 34){
            mkdir(path.dirname(dir));
            mkdir(dir);
          }
        }
      };
      (function walkThrough(source, dest) {
        fs.readdir(source, (err, files) => {
          if (err) throw err;
          files.forEach(file => {
            if (ignore.includes(path.join(source, file))) return;
            fs.stat(path.join(source, file), (err, stat) => {
              if (err) throw err;
              switch (true) {
                case stat.isDirectory():
                  walkThrough(path.join(source, file), path.join(dest, file));
                  break;
                case stat.isFile():
                  if (/\.(?:m\.?)?js$/.test(file)) {
                    fs.readFile(path.join(source, file), (err, content) => {
                      if (err) throw err;
                      mkdir(dest);
                      fs.writeFile(
                        path.join(dest, file),
                        ascjs(content),
                        (err) => {
                          if (err) throw err;
                        }
                      );
                    });
                  }
                  break;
              }
            });
          });
        });
      }(
        path.resolve(process.cwd(), source),
        cjsDest
      ));
    } else {
      throw new Error('not sure what to do, try ascjs --help\n');
    }
  });
} else {
  const chunks = [];
  process.stdin.on('data', data => {
    chunks.push(data);
  });
  process.stdin.on('end', () => {
    process.stdout.write(ascjs(chunks.join('')));
  });
}
