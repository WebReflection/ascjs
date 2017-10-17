#!/usr/bin/env node

const ascjs = require('./index.js');

const source = process.argv[2];
if (/^-/.test(source)) {
  const info = require('./package.json');
  console.log(`
\x1B[1mascjs\x1B[0m v${info.version}
${'-'.repeat(info.description.length)}
${info.description}
${'-'.repeat(info.description.length)}

# as executable
ascjs code
ascjs sourceFile
ascjs sourceFile destFile
ascjs sourceFolder destFolder # dest is required

# as pipe
echo code | ascjs
cat sourceFile | ascjs

${'-'.repeat(info.description.length)}
${' '.repeat(info.description.length)
      .slice(0, -(3 + info.author.length))}by ${info.author}
`);
} else if (source) {
  const fs = require('fs');
  const dest = process.argv[3];
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
      const path = require('path');
      (function walkThrough(source, dest) {
        fs.readdir(source, (err, files) => {
          if (err) throw err;
          files.forEach(file => {
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
        path.resolve(process.cwd(), dest)
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