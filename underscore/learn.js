window._ = {
  
  each: function (obj, iterator, context) {
    var index = 0;
    try {
      if (obj.forEach) {
        obj.forEach(iterator, context);
      } else if (obj.length) {
        // 兼容ES3
        for (var i = 0; i < obj.length; i++)
          iterator.call(context, obj[i], i);
      } else if (obj.each) {
        obj.each(function (value) {
          iterator.call(context, value, index++);
        })
      } else {
        var i = 0;
        for (var key in obj) {
          var value = obj[key], pair = [key, value];
          pair.key = key;
          pair.value = value;
          iterator.call(context, pair, i++);
        }
      }
    } catch(e) {
      if (e !== '__break__') throw e;
    }
    
    return obj;
  },
  
  map: function (obj, iterator, context) {
    if (obj && obj.map) return obj.map(iterator, context);
    
    var results = [];
    
    _.each(obj, function (value, index) {
      results.push(iterator.call(context, value, index));
    })
    
    return results;
  },
  
  inject: function (obj, memo, iterator, context) {
    _.each(obj, function (value, index) {
      memo = iterator.call(context, memo, value, index);
    });
    return memo;
  },
  
  detect: function (obj, iterator, context) {
    var result;
    _.each(obj, function (value, index) {
      if (iterator.call(context, value, index)) {
        result = value;
        throw '__break__';
      }
    });
    return result;
  },
  
  select: function (obj, iterator, context) {
    if (obj.filter) return obj.filter(iterator, context);
    var results = [];
    _.each(obj, function (value, index) {
      if (iterator.call(context, value, index)) {
        results.push(value);
      }
    });
    return results;
  },
  
  reject: function (obj, iterator, context) {
    var results = [];
    _.each(obj, function (value, index) {
      if (!iterator.call(context, value, index)) {
        results.push(value);
      }
    });
    return results;
  },
  
  all: function (obj, iterator, context) {
    iterator = iterator || function (v) { return v; };
    if (obj.every) return obj.every(iterator, context);
    var result = true;
    _.each(obj, function (value, index) {
      result = result && !!iterator.call(context, value, index);
      if (!result) throw '__break__';
    });
    return result;
  },
  
  any: function (obj, iterator, context) {
    iterator = iterator || function (v) { return v; };
    if (obj.some) return obj.some(iterator, context);
    var result = false;
    _.each(obj, function (value, index) {
      if (result = !!iterator.call(context, value, index)) {
        throw '__break__';
      }
    });
    return result;
  },
  
  include: function (obj, target) {
    if (_.isArray(obj)) return _.indexOf(obj, target) !== -1;
    var found = false;
    _.each(obj, function (pair) {
      if (found = (pair.value === target)) throw '__break__';
    });
    return found;
  },
  
  invoke: function (obj, method) {
    var args = _.toArray(arguments).slice(2);
    return _.map(obj, function (value) {
      return (method ? value[method] : value).apply(value, args);
    });
  },
  
  pluck: function (obj, key) {
    return _.map(obj, function (value) {
      return value[key];
    })
  },
  
  max: function (obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    let result = null;
    _.each(obj, function (value, index) {
      let computed = iterator ? iterator.call(context, value, index) : value;
      if (result === null || computed >= result.computed)
        result = {
          value: value,
          computed: computed
        };
    });
    return result.value;
  },
  
  sortBy (obj, iterator, context) {
    // 返回从小到大排列的新数组
    return _.pluck(_.map(obj, (value, index) => {
      let criteria = typeof iterator === 'function' ? iterator.call(context, value, index) : value[iterator];
      return {
        value,
        criteria
      }
    }).sort((left, right) => {
      let a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  },
  
  sortedIndex (array, obj, iterator) {
    // let tempArr = array.slice();
    // tempArr.push(obj);
    // return _.sortBy(tempArr, iterator).indexOf(obj);
    iteratee = typeof iterator === 'function' ? iterator : (obj => obj[iterator]);
    let low = 0, high = array.length;
    while (low < high) {
      let mid = (low + high) >> 1;
      iteratee(array[mid]) < iteratee(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  },
  
  toArray (iterable) {
    if (!iterable) return [];
    if (_.isArray(iterable)) return iterable;
    return _.map(iterable, val => val);
  },
  
  size (obj) {
    return _.toArray(obj).length;
  },
  
  compact (array) {
    return _.select(array, value => !!value);
  },
  
  flatten (array) {
    return _.inject(array, [], (memo, value) => {
      if (_.isArray(value)) return memo.concat(_.flatten(value))
      memo.push(value)
      return memo
    })
  },
  
  without (array) {
    let values = array.slice.call(arguments, 1)
    return _.select(array, value => !_.include(values, value))
  },
  
  uniq (array, isSorted) {
    return _.inject(array, [], (memo, el, i) => {
      if (0 === i || (isSorted ? _.last(memo) !== el : !_.include(memo, el))) memo.push(el)
      return memo
    })
  },
  
  intersect (array) {
    let rest = _.toArray(arguments).slice(1)
    return _.select(_.uniq(array), function (item) {
      return _.all(rest, function (other) {
        return _.indexOf(other, item) >= 0
      })
    })
  },
  
  zip () {
    // let argArr = [].slice.call(arguments);
    // let ret = new Array(argArr[0].length);
    // _.each(argArr, arr => {
    //   _.each(arr, (value, i) => {
    //     if (!ret[i]) ret[i] = [value]
    //     else ret[i].push(value)
    //   })
    // })
    // return ret
    let args = _.toArray(arguments)
    let length = _.max(_.pluck(args, 'length'))
    let results = new Array(length)
    for (let i = 0; i < length; i++) results[i] = _.pluck(args, String(i))
    return results
  },
  
  bind (func, context) {
    if (!context) return func
    let args = _.toArray(arguments).slice(2)
    return () => {
      let a = args.concat(_.toArray(arguments))
      return func.apply(context, a)
    }
  },
  
  bindAll () {
    let args = _.toArray(arguments)
    let context = args.pop()
    _.each(args, methodName => {
      context[methodName] = _.bind(context[methodName], context)
    })
  },
  
  delay (func, wait) {
    let args = _.toArray(arguments).slice(2)
    return window.setTimeout(() => func.apply(func, args), wait)
  },
  
  defer (func) {
    return _.delay.apply(_, [func, 1].concat(_.toArray(arguments).slice(1)))
  },
  
  wrap (func, wrapper) {
    return () => {
      let args = [func].concat(_.toArray(arguments))
      return wrapper.apply(wrapper, args)
    }
  },
  
  keys (obj) {
    return _.pluck(obj, 'key')
  },
  
  values : function(obj) {
    return _.pluck(obj, 'value');
  },
  
  extend : function(destination, source) {
    for (var property in source) destination[property] = source[property];
    return destination;
  },
  
  clone : function(obj) {
    return _.extend({}, obj);
  },
  
  isEqual : function(a, b) {
    // Check object identity.
    if (a === b) return true;
    // Different types?
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // Basic equality test (watch out for coercions).
    if (a == b) return true;
    // One of them implements an isEqual()?
    if (a.isEqual) return a.isEqual(b);
    // If a is not an object by this point, we can't handle it.
    if (atype !== 'object') return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // Recursive comparison of contents.
    for (var key in a) if (!_.isEqual(a[key], b[key])) return false;
    return true;
  },
  
  isElement (obj) {
    return !!(obj && obj.nodeType === 1)
  },
  
  isArray (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  },
  
  indexOf (array, item) {
    if (array.indexOf) return array.indexOf(item)
    let length = array.length
    for (let i = 0; i < length; i++) {
      if (array[i] === item) return i
    }
    return -1
  },
  
  uniqueId (prefix) {
    let id = this._idCounter = (this._idCounter || 0) + 1
    return prefix ? prefix + id : id
  },
  
  template (str, data) {
    let fn = new Function('obj', 'var p = [], print=function(){p.push.apply(p, arguments);};' +
      'with(obj){p.push(\'' +
      str
        .replace(/[\r\t\n]/g, ' ')
        .split('<%').join('\t')
        .replace(/((^|%>)[^\t]*)/g, '$1\r')
        .replace()
      + '\');}return p.join(\'\');'
    )
  }
};