import func, {a, b} from './module.js';
import * as tmp from 'other';
export * as commands from './local.js'

console.log(import.meta.url);

const val = 123;

export default function test() {
  console.log('ascjs');
};

export {func, val};
