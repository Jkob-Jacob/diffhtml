const { JSDOM } = require('jsdom');
const { window } = new JSDOM('<!doctype html>');

Object.assign(global, {
  document: window.document,
  window,
});