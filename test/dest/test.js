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

