(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
      ? define(factory)
      : (global.Vue = factory());
})(this, function() {
  "use strict";

  function isUndef (v) {
    return v === undefined || v === null
  }

  function isDef (v) {
    return v !== undefined && v !== null
  }

  function isTrue (v) {
    return v === true
  }

  function isFalse (v) {
    return v === false
  }

  function isPrimitive (value) {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    )
  }

  function isObject(obj) {
    return obj !== null && typeof obj === 'object'
  }

  let _toString = Object.prototype.toString

  function isPlainObject (obj) {
    return _toString.call(obj) === '[object Object]'
  }

  function isRegExp (v) {
    return _toString.call(v) === '[object RegExp]'
  }

  function isValidArrayIndex (val) {
    let n = parseFloat(val)
    return n >= 0 && Math.floor(n) === n && isFinite(val)
  }

  function toString (val) {
    return val === null
    ? ''
      : typeof val === 'object'
        /**
         * JSON.stringify除第一个参数外，还可以接收两个可选参数，一个replacer函数或者数组，一个space数字或字符串
         * replacer函数具体用法见 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
         */
    ? JSON.stringify(val, null, 2)
        : String(val)
  }

  function toNumber (val) {
    let n = parseFloat(val);
    return isNaN(n) ? val : n
  }

  function makeMap (str, expectsLowerCase) {
    let map = Object.create(null);
    let list = str.split(',');
    for (let i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase
    ? val => map[val.toLowerCase()]
      : val => map[val];
  }

  const isBuiltInTag = makeMap('slot, component', true);

  const isReservedAttribute = makeMap('key, ref, slot, is')

  function remove (arr, item) {
    if (arr.length) {
      let index = arr.indexOf(item);
      if (index > -1) {
        return arr.splice(index, 1);
      }
    }
  }

  const hasOwnProperty = Object.prototype.hasOwnProperty;

  const hasOwn = (obj, key) => hasOwnProperty.call(obj, key)

  const cached = fn => {
    let cache = Object.create(null);
    return (function cachedFn(str) {
      let hit = cache[str]
      return hit || (cache[str] = fn(str))
    })
  }

  const camelizeRE = /-(\w)/g
  const camelize = cached(str => str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : ''))

  const capitalize = cached(str => str.charAt(0).toUpperCase() + str.slice(1))

  const hyphenateRE = /\B([A-Z])/g
  const hyphenate = cached(str => str.replace(hyphenateRE, '-$1').toLowerCase())

  const bind = (fn, ctx) => {
    const boundFn = a => {
      let l = arguments.length
      return l
        ? l > 1 // 只是为了在参数长度大于1的时候用apply，小于1的时候用call方法；两者性能差距这么大？
          ? fn.apply(ctx, arguments)
          : fn.call(ctx, a)
        : fn.call(ctx)
    }

    boundFn._length = fn.length
    return boundFn
  }
});
