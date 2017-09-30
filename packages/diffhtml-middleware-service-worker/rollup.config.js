import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import Visualizer from 'rollup-plugin-visualizer';

const entries = {
  min: 'index.js',
  umd: 'index.js',
};

const dests = {
  min: 'dist/logger.min.js',
  umd: 'dist/logger.js',
}

const { NODE_ENV = 'umd' } = process.env;

export const exports = 'default';
export const context = 'this';
export const entry = entries[NODE_ENV];
export const sourceMap = false;
export const moduleName = 'logger';
export const globals = { diffhtml: 'diff' };
export const external = ['diffhtml'];

export const targets = [{
  dest: dests[NODE_ENV],
  format: 'umd',
}];

export const plugins = [
  NODE_ENV === 'min' && replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
  babel(),
  nodeResolve({ jsnext: true }),
  NODE_ENV === 'umd' && Visualizer({ filename: './dist/build-size.html' }),
];
