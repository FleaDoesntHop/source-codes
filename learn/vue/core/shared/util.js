/* @flow */

const _toString = Object.prototype.toString;

export function isRegExp (v) {
  return _toString.call(obj) === '[object RegExp]'
}

export function isDef(v) {
  return v !==undefined && v !==null
}