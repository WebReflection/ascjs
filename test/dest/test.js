const func = (m => m.__esModule ? m : {default: m})(require('./module.js')).default;
const {a, b} = func;
const tmp = require('other');

const val = 123;

function test() {
  console.log('ascjs');
}
Object.defineProperty(exports, '__esModule', {value: true}).default = test;

exports.func = func;
exports.val = val;

