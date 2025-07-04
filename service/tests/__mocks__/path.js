// service/tests/__mocks__/path.js

const join = jest.fn(function() {
  return Array.prototype.slice.call(arguments).join('/');
});

const dirname = jest.fn(function(p) {
  return p.split('/').slice(0, -1).join('/') || '/';
});

const basename = jest.fn(function(p) {
  return p.split('/').pop() || '';
});

const extname = jest.fn(function(p) {
  const name = basename(p);
  const lastDot = name.lastIndexOf('.');
  return lastDot > 0 ? name.slice(lastDot) : '';
});

const resolve = jest.fn(function() {
  return '/' + Array.prototype.slice.call(arguments).join('/').replace(/\/+/g, '/');
});

const relative = jest.fn(function(from, to) {
  return to;
});

const isAbsolute = jest.fn(function(p) {
  return p.startsWith('/');
});

const normalize = jest.fn(function(p) {
  return p.replace(/\/+/g, '/');
});

const parse = jest.fn(function(p) {
  const dir = dirname(p);
  const base = basename(p);
  const ext = extname(p);
  const name = base.slice(0, base.length - ext.length);
  return { dir: dir, base: base, ext: ext, name: name, root: '/' };
});

const sep = '/';
const delimiter = ':';
const posix = {
  join: join,
  dirname: dirname,
  basename: basename,
  extname: extname,
  resolve: resolve,
  relative: relative,
  isAbsolute: isAbsolute,
  normalize: normalize,
  parse: parse,
  sep: '/',
  delimiter: ':'
};

module.exports = {
  join: join,
  dirname: dirname,
  basename: basename,
  extname: extname,
  resolve: resolve,
  relative: relative,
  isAbsolute: isAbsolute,
  normalize: normalize,
  parse: parse,
  sep: sep,
  delimiter: delimiter,
  posix: posix,
  default: {
    join: join,
    dirname: dirname,
    basename: basename,
    extname: extname,
    resolve: resolve,
    relative: relative,
    isAbsolute: isAbsolute,
    normalize: normalize,
    parse: parse,
    sep: sep,
    delimiter: delimiter,
    posix: posix
  }
}; 