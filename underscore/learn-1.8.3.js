(function () {
  let root = this
  let previousUnderscore = root._
  let ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype
  let push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;
  let
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;
  
  const Ctor = function () {};
  
  let _ = obj => {
    if (obj instanceof _) return obj
    if (!(this instanceof _)) return new _(obj)
    this._wrapped = obj
  }
  
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _
    }
    exports._ = _
  } else {
    root._ = _
  }
  
  const optimizeCb = (func, context, argCount) => {
    if (context === void 0) return func
    switch (argCount === null ? 3 : argCount) {
      case 1:
        return value => func.call(context, value)
      case 3:
        return (value, index, collection) => func.call(context, value, index, collection)
    }
    
    return () => func.apply(context, arguments)
  }
  
  const createAssigner = (keysFuc, undefinedOnly) => obj => {
    let length = arguments.length
    if (length < 2 || obj == null) return obj
    for (let index = 1; index < length; index++) {
      let source = arguments[index],
        keys = keysFunc(source),
        l = keys.length
      for (let i = 0; i < l; i++) {
        let key = keys[i]
        if (!undefinedOnly || obj[key] === void 0) {
          obj[key] = source[key]
        }
      }
    }
    return obj
  }
  
  const baseCreate = prototype => {
    if (!_.isObject(prototype)) return {}
    if (nativeCreate) return nativeCreate(prototype)
    Ctor.prototype = prototype
    let result = new Ctor
    Ctor.prototype = null
    return result
  }
  
  const property = key => obj => obj === null ? void 0 : obj[key]
  _.property = property
  
  const cb = (value, context, argCount) => {
    if (value === null) return _.identity
    if (_.isFunction(value)) return optimizeCb(value, context, argCount)
    if (_.isObject(value)) return _.matcher(value)
    return _.property(value)
  }
  
  const MAX_ARRAY_INDEX = Math.pow(2, 53) - 1
  const getLength = property('length')
  const isArrayLike = collection => {
    let length = getLength(collection)
    return typeof length === 'number' && length >= 0 && length <= MAX_ARRAY_INDEX
  }
  
  _.each = _.forEach = (obj, iteratee, context) => {
    iteratee = optimizeCb(iteratee, context)
    let i, length
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj)
      }
    } else {
      let keys = _.keys(obj)
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj)
      }
    }
    return obj
  }
  
  _.map = _.collect = (obj, iteratee, context) => {
    iteratee = cb(iteratee, context)
    let keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length,
      results = Array(length)
    for (let index = 0; index < length; index++) {
      let currentKey = keys ? keys[index] : index
      results[index] = iteratee(obj[currentKey], currentKey, obj)
    }
    return results
  }
  
  function createReduce (dir) {
    // 优化后的遍历器函数。在主函数（外层函数）内使用arguments.length检查参数长度会跳过优化，参见1991行
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        let currentKey = keys ? keys[index] : index
        memo = iteratee(memo, obj[currentKey], currentKey, obj)
      }
      return memo
    }
    
    return function (obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4)
      let keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        index = dir > 0 ? 0 : length - 1
      // 如果没有提供初始值参数（memo）
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index]
        index += dir
      }
      return iterator(obj, iteratee, memo, keys, index, length)
    }
  }
  
  _.reduce = _.foldl = _.inject = createReduce(1)
  _.reduceRight = _.foldr = createReduce(-1)
  
  _.find = _.detect = function (obj, predicate, context) {
    let key
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context)
    } else {
      key = _.findKey(obj, predicate, context)
    }
    if (key !== void 0 && key !== -1) return obj[key]
  }
  
  _.filter = _.select = function (obj, predicate, context) {
    let results = []
    predicate = cb(predicate, context)
    _.each(obj, function (value, index, list) {
      if (predicate(value, index, list)) results.push(value)
    })
    return results
  }
  
  _.reject = function (obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context)
  }
  
  _.every = _.all = function (obj, predicate, context) {
    predicate = cb(predicate, context)
    let keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length
    for (let index = 0; index < length; index++) {
      let currentKey = keys ? keys[index] : index
      if (!predicate(obj[currentKey], currentKey, obj)) return false
    }
    return true
  }
  
  _.some = _.any = function (obj, predicate, context) {
    predicate = cb(predicate, context)
    let keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  }
  
  _.contains = _.includes = _.include = function (obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj) // 将键值对的对象改造成由原对象值组成的数组
    if (typeof fromIndex != 'number' || guard) fromIndex = 0
    return _.indexOf(obj, item, fromIndex) >= 0
  }
  
  /**
   * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
   => [[1, 5, 7], [1, 2, 3]]
   * @param obj
   * @param method
   */
  _.invoke = function (obj, method) {
    let args = slice.call(arguments, 2)
    let isFunc = _.isFunction(method)
    return _.map(obj, function (value) {
      let func = isFunc ? method : value[method]
      return func == null ? func : func.apply(value, args)
    })
  }
  
  _.pluck = function (obj, key) {
    return _.map(obj, _.property(key))
  }
  
  /**
   * _.where(listOfPlays, {author: "Shakespeare", year: 1611});
   => [{title: "Cymbeline", author: "Shakespeare", year: 1611},
   {title: "The Tempest", author: "Shakespeare", year: 1611}]
   * @param obj
   * @param attrs 对象
   */
  _.where = function (obj, attrs) {
    return _.filter(obj, _.matcher(attrs))
  }
  
  /**
   * _.findWhere(publicServicePulitzers, {newsroom: "The New York Times"});
   => {year: 1918, newsroom: "The New York Times",
  reason: "For its public service in publishing in full so many official reports,
  documents and speeches by European statesmen relating to the progress and
  conduct of the war."}
   * @param obj
   * @param attrs
   */
  _.findWhere = function (obj, attrs) {
    return _.find(obj, _.matcher(attrs))
  }
  
  _.max = (obj, iteratee, context) => {
    let result = -Infinity, lastComputed = -Infinity, value, computed
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj)
      for (let i = 0, length = obj.length; i < length; i++) {
        value = obj[i]
        if (value > result) {
          result = value
        }
      }
    } else {
      iteratee = cb(iteratee, context)
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list)
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed
        }
      })
    }
    return result
  }
  
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
      value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };
  
  /**
   * _.shuffle([1, 2, 3, 4, 5, 6]);
   => [4, 1, 6, 3, 5, 2]
   * @param obj
   * @returns {*}
   */
  _.shuffle = function (obj) {
    let set = isArrayLike(obj) ? obj : _.values(obj)
    let length = set.length
    let shuffled = Array(length)
    for (let index = 0, rand; index < length; index++) {
      rand = _.random(0, index)
      // 如果随机值和当前读取的下标不一致，则调换随机值位置和下标位置储存的值
      // 否则拷贝原数组上的值
      // 当下标为0时，随机值只能为0，所以拷贝
      // 随着下标逐渐增加，随机值与下标相同的概率逐渐降低，shuffled数组上的数据就逐步调换了
      // 无论是调换还是拷贝，都需要将原数组当前下标上的值拷贝一份到新数组上
      // 这种打乱数组的方式称作Fisher-Yates shuffle
      if (rand !== index) shuffled[index] = shuffled[rand]
      shuffled[rand] = set[index]
    }
    return shuffled
  }
  
  /**
   * 商品取样函数
   * _.sample([1, 2, 3, 4, 5, 6], 3);
   => [1, 6, 2]
   * @param obj
   * @param n 限定样品个数
   * @param guard
   */
  _.sample = (obj, n, guard) => {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj)
      // 不传入取样个数，或传入第三个参数，则返回随机一个样品
      return obj[_.random(obj.length - 1)]
    }
    // 写法很高明，打乱数组，返回前n个数值组成的新数组即可
    return _.shuffle(obj).slice(0, Math.max(0, n))
  }
  
  /**
   * _.sortBy([1, 2, 3, 4, 5, 6], function(num){ return Math.sin(num); });
   => [5, 4, 6, 3, 1, 2]
   * var stooges = [{name: 'moe', age: 40}, {name: 'larry', age: 50}, {name: 'curly', age: 60}];
   _.sortBy(stooges, 'name');
   => [{name: 'curly', age: 60}, {name: 'larry', age: 50}, {name: 'moe', age: 40}];
   * @param obj
   * @param iteratee 排序规则
   * @param context
   */
  _.sortBy = (obj, iteratee, context) => {
    iteratee = cb(iteratee, context)
    return _.pluck(_.map(obj, function (value, index, list) {
      return {
        value,
        index,
        criteria: iteratee(value, index, list)
      }
    }).sort(function(left, right) {
      let a = left.criteria, b = right.criteria
      if (a !== b) {
        if (a > b || a === void 0) return 1
        if (a < b || b === void 0) return -1
      }
      // a, b值相同时按照其在原数组的下标先后排列
      return left.index - right.index
    }), 'value')
  }
  
  const group = behavior => (obj, iteratee, context) => {
    let result = {}
    iteratee = cb(iteratee, context)
    _.each(obj, function (value, index) {
      let key = iteratee(value, index, obj)
      behavior(result, value, key)
    })
    return result
  }
  
  /**
   * _.groupBy([1.3, 2.1, 2.4], function(num){ return Math.floor(num); });
   => {1: [1.3], 2: [2.1, 2.4]}
   * _.groupBy(['one', 'two', 'three'], 'length');
   => {3: ["one", "two"], 5: ["three"]}
   */
  _.groupBy = group((result, value, key) => {
    if (_.has(result, key)) result[key].push(value)
    else result[key] = [value]
  })
  
  /**
   * var stooges = [{name: 'moe', age: 40}, {name: 'larry', age: 50}, {name: 'curly', age: 60}];
     _.indexBy(stooges, 'age');
     => {
          "40": {name: 'moe', age: 40},
          "50": {name: 'larry', age: 50},
          "60": {name: 'curly', age: 60}
        }
   * 和groupBy方法类似，但是只有在确认key值唯一时使用
   */
  _.indexBy = group((result, value, key) => {
    result[key] = value
  })
  
  /**
   * _.countBy([1, 2, 3, 4, 5], function(num) {
      return num % 2 == 0 ? 'even': 'odd';
    });
    => {odd: 3, even: 2}
   */
  _.countBy = group((result, value, key) => {
    if (_.has(result, key)) result[key]++
    else result[key] = 1
  })
  
  _.toArray = obj => {
    if (!obj) return [] // 不传入对象，则返回空数组
    if (_.isArray(obj)) return slice.call(obj) // 本身是数组，则复制数组
    if (isArrayLike(obj)) return _.map(obj, _.identity) // 本身为类数组，则返回由类数组元素组成的新数组
    return _.values(obj) // 否则为普通对象，则返回由对象值构成的新数组
  }
  
  _.size = (obj) => {
    if (obj == null) return 0
    return isArrayLike(obj) ? obj.length : _.keys(obj).length
  }
  
  /**
   * _.partition([0, 1, 2, 3, 4, 5], function(num){return num % 2 === 1});
      => [[1, 3, 5], [0, 2, 4]]
   * @param obj
   * @param predicate
   * @param context
   */
  _.partition = (obj, predicate, context) => {
    predicate = cb(predicate, context)
    let pass = [], fail = []
    _.each(obj, (value, key, obj) => {
      (predicate(value, key, obj) ? pass : fail).push(value)
    })
    return [pass, fail]
  }
  
  /**
   * _.first([5, 4, 3, 2, 1], 4);
   * => [5,4,3,2]
   * @type {function(*=, *, *=)}
   */
  _.first = _.head = _.take = (array, n, guard) => {
    if (array == null) return void 0
    if (n == null || guard) return array[0]
    return _.initial(array, array.length - n)
  }
  
  /**
   *
   * @param array
   * @param n 和_.first的参数n不一样，这里的n是不包含的元素个数
   * @param guard
   * @returns {*}
   */
  _.initial = (array, n, guard) => {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1: n)))
  }
  
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };
  
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };
  
  /**
   * _.compact([0, 1, false, 2, '', 3]);
   * => [1, 2, 3]
   * @param array
   */
  _.compact = array => _.filter(array, _.identity)
  
  const flatten = (input, shallow, strict, startIndex) => {
    let output = [], idx = 0
    for (let i = startIndex || 0, length = getLength(input); i < length; i++) {
      let value = input[i]
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        if (!shallow) value = flatten(value, shallow, strict) // 通过函数递归使数组扁平化，可打断点观测函数递归过程
        let j = 0, len = value.length
        output.length += len
        while (j < len) {
          output[idx++] = value[j++]
        }
      } else if (!strict) {
        output[idx++] = value
      }
    }
    return output
  }
  
  /**
   * _.flatten([1, [2], [3, [[4]]]]);
   * => [1, 2, 3, 4]
   * @param array
   * @param shallow
   */
  _.flatten = (array, shallow) => flatten(array, shallow, false)
  
  // _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
  // => [2, 3, 4]
  _.without = array => _.difference(array, slice.call(arguments, 1))
  
  /**
   * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
   * => [1, 3, 4]
   * @param array
   */
  _.difference = array => {
    let rest = flatten(arguments, true, true, 1) // 等同于Array.prototype.slice.call(arguments, 1)
    return _.filter(array, value => {
      return !_.contains(rest, value)
    })
  }
  
  /**
   * _.uniq([1, 2, 1, 4, 1, 3]);
   * => [1, 2, 4, 3]
   * var stooges = [
       {name: 'moe', age: 40},
       {name: 'larry', age: 60},
       {name: 'curly', age: 60},
       {name: 'moe', age: 50}
     ];
   * _.unique(stooges, 'age')
   * => [{name: 'moe', age: 40},{name: 'larry', age: 60},{name: 'moe', age: 50}]
   * @type {function(*=, *=, *=, *=)}
   */
  _.uniq = _.unique = (array, isSorted, iteratee, context) => {
    if (!_.isBoolean(isSorted)) {
      context = iteratee
      iteratee = isSorted
      isSorted = false
    }
    
    if (iteratee != null) iteratee = cb(iteratee, context)
    let result = []
    let seen = []
    for (let i = 0, length = getLength(array); i < length; i++) {
      let value = array[i],
        computed = iteratee ? iteratee(value, i, array) : value
      
      if (isSorted) {
        if (
          !i || seen !== computed // !i等同于i === 0; 由于数组本身是按序排列的，如果遍历的元素与已保存的seen元素不相同，则代表后面不会再有元素与seen元素相同，可以放心push
        ) result.push(value)
        seen = computed
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed) // seen数组保存计算后的数据
          result.push(value) // 待返回的结果数组只保存原数据
        }
      } else if (!_.contains(result, value)) {
        result.push(value)
      }
    }
    return result
  }
  
  /**
   * _.union([1, 2, 3], [101, 2, 1, 10], [2, 1]);
   * => [1, 2, 3, 101, 10]
   */
  _.union = () => _.uniq(flatten(arguments, true, true))
  
  /**
   * _.intersection([1, 2, 3], [101, 2, 1, 10], [2, 1]);
   * => [1, 2]
   * @param array
   */
  _.intersection = array => {
    let result = []
    let argsLength = arguments.length
    for (let i = 0, length = getLength(array); i < length; i++) {
      let item = array[i]
      if (_.contains(result, item)) continue // 跳过已检测成功的重复值；最后返回的数组包含唯一值
      for (let j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      } // 如果该for循环中途没有break，则执行完j的值等于argsLength；循环过程中只要有任意数组中不包含该item，则终端循环，j值最大为argsLength - 1
      if (j === argsLength) result.push(item)
    }
    return result
  }
  
  /**
   * _.zip(['moe', 'larry', 'curly'], [30, 40, 50], [true, false, false]);
   * => [["moe", 30, true], ["larry", 40, false], ["curly", 50, false]]
   * 类似于python的zip函数
   */
  _.zip = () => _.unzip(arguments)
  
  /**
   * _.unzip([["moe", 30, true], ["larry", 40, false], ["curly", 50, false]]);
   * => [['moe', 'larry', 'curly'], [30, 40, 50], [true, false, false]]
   * @param array
   * @returns {*}
   */
  _.unzip = array => {
    let length = array && _.max(array, getLength).length || 0
    let result = Array(length)
    for (let index = 0; index < length; index++) {
      result[index] = _.pluck(array, index) // 妙用pluck方法
    }
    return result
  }
  
  /**
   * _.object(['moe', 'larry', 'curly'], [30, 40, 50]);
   * => {moe: 30, larry: 40, curly: 50}
   * _.object([['moe', 30], ['larry', 40], ['curly', 50]]);
   * => {moe: 30, larry: 40, curly: 50}
   * @param list
   * @param values
   */
  _.object = (list, values) => {
    let result = {}
    for (let i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i]
      } else {
        result[list[i][0]] = list[i][1]
      }
    }
    return result
  }
  
  const createPredicateIndexFinder = dir => (array, predicate, context) => {
    predicate = cb(predicate, context)
    let length = getLength(array)
    let index = dir > 0 ? 0 : length - 1
    for (; index >= 0 && index < length; index += dir) {
      if (predicate(array[index], index, array)) return index
    }
    return -1
  }
  
  _.findIndex = createPredicateIndexFinder(1)
  _.findLastIndex = createPredicateIndexFinder(-1)
  
  /**
   * _.sortedIndex([10, 20, 30, 40, 50], 35);
   * => 3
   * var stooges = [{name: 'moe', age: 40}, {name: 'curly', age: 60}];
   * _.sortedIndex(stooges, {name: 'larry', age: 50}, 'age');
   * => 1
   * @param array
   * @param obj
   * @param iteratee
   * @param context
   * @returns {*}
   */
  _.sortedIndex = (array, obj, iteratee, context) => {
    iteratee = cb(iteratee, context, 1)
    let value = iteratee(obj)
    let low = 0, high = getLength(array)
    while (low < high) {
      let mid = Math.floor((low + high) / 2)
      if (iteratee(array[mid]) < value) low = mid + 1
      else high = mid
    }
    return low
  }
  
  const createIndexFinder = (dir, predicateFind, sortedIndex) => (array, item, idx) => {
    let i = 0, length = getLength(array)
    if (typeof idx === 'number') {
      if (dir > 0) {
        i = idx >= 0 ? idx : Math.max(idx + length, i)
      } else {
        length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1
      }
    } else if (sortedIndex && idx && length) {
      idx = sortedIndex(array, item)
      return array[idx] === item ? idx : -1
    }
    if (item !== item) {
      idx = predicateFind(slice.call(array, i, length), _.isNaN)
      return idx >= 0 ? idx + i : -1
    }
    for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
      if (array[idx] === item) return idx
    }
    return -1
  }
  
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex)
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex)
  
  /**
   * _.range(10);
   * => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
   * _.range(1, 11);
   * => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
   * _.range(0, 30, 5);
   * => [0, 5, 10, 15, 20, 25]
   * 类似于python的range函数
   * @param start
   * @param stop
   * @param step
   */
  _.range = (start, stop, step) => {
    if (stop == null) {
      stop = start || 0
      start = 0
    }
    step = step || 1
    
    let length = Math.max(Math.ceil((stop - start) / step), 0)
    let range = Array(length)
    
    for (let idx = 0; idx < length; idx++, start += step) {
      range[idx] = start
    }
    
    return range
  }
  
  // 决定是否将函数作为构造器执行，抑或作为普通函数传参执行
  const executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    let self = baseCreate(sourceFunc.prototype);
    let result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };
  
  /**
   * var func = function(greeting){ return greeting + ': ' + this.name };
   * func = _.bind(func, {name: 'moe'}, 'hi');
   * func();
   * => 'hi: moe'
   * @param func
   * @param context
   */
  _.bind = (func, context) => {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1))
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function')
    let args = slice.call(arguments, 2)
    let bound = () => executeBound(func, bound, context, this, args.concat(slice.call(arguments)))
    
    return bound
  }
  
  /**
   * var buttonView = {
      label  : 'underscore',
      onClick: function(){ alert('clicked: ' + this.label); },
      onHover: function(){ console.log('hovering: ' + this.label); }
    };
   * _.bindAll(buttonView, 'onClick', 'onHover');
   * // When the button is clicked, this.label will have the correct value.
   * jQuery('#underscore_button').on('click', buttonView.onClick);
   * @param obj
   */
  _.bindAll = obj => {
    let i, length = arguments.length, key
    if (length <= 1) throw new Error('bindAll must be passed function names')
    for (i = 1; i < length; i++) {
      key = arguments[i]
      obj[key] = _.bind(obj[key], obj)
    }
    return obj
  }
  
  /**
   * var subtract = function(a, b) { return b - a; };
   * sub5 = _.partial(subtract, 5);
   * sub5(20);
   * => 15
   * subFrom20 = _.partial(subtract, _, 20);
   * subFrom20(5);
   * => 15
   * 函数柯里化的进阶版；传入参数可用'_'占位符替代
   * 学习参数占位符构思
   * @param func
   */
  _.partial = func => {
    let boundArgs = slice.call(arguments, 1)
    let bound = function () {
      let position = 0, length = boundArgs.length
      let args = Array(length)
      for (let i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i] // 如果绑定时传入参数有_占位符，则这些占位符依次指向函数调用时传入的参数
      }
      while (position < arguments.length) args.push(arguments[position++])
      return executeBound(func, bound, this, this, args) // 等同于func.apply(this, args)
    }
    return bound
  }
  
  /**
   * var fibonacci = _.memoize(function(n) {
      return n < 2 ? n: fibonacci(n - 1) + fibonacci(n - 2);
    });
   * 当函数够复杂时，为避免重复计算，巧妙使用了闭包储存值的方式对计算过的值进行保存
   * @param func
   * @param hasher 哈希函数，可选参数
   */
  _.memoize = (func, hasher) => {
    let memoize = key => {
      let cache = memoize.cache
      let address = '' + (hasher ? hasher.apply(this, arguments) : key) // 如果传入哈希函数，则用哈希函数生成地址；否则使用传入的第一个参数转换成的字符串作为键名地址
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments)
      return cache[address] // 巧用闭包储存值
    }
    memoize.cache = {}
    return memoize
  }
  
  /**
   * var log = _.bind(console.log, console);
   * _.delay(log, 1000, 'logged later');
   * => 'logged later' // Appears after one second.
   * @param func
   * @param wait
   * @returns {number}
   */
  _.delay = (func, wait) => {
    let args = slice.call(arguments, 2)
    return setTimeout(() => func.apply(null, args), wait)
  }
  
  // 延迟执行函数：当前调用栈全部执行完毕后再执行该函数
  _.defer = _.partial(_.delay, _, 1)
  
  /**
   * var throttled = _.throttle(updatePosition, 100);
   * $(window).scroll(throttled);
   * 懒执行函数：如果函数重复触发，而你只希望它“每隔规定时间”触发一次，则可以使用该函数
   * 使用场景：如文本框快速输入，你不希望每次敲键盘都提交ajax请求，希望每隔500ms提交一次
   * @param func
   * @param wait
   * @param options {leading: false // leading设置为false则在一开始不会先触发一次，默认为true，即一开始就触发一次，然后每隔规定时间触发一次}；{trailing: false // trailing设置为false则不会在事件池中添加待触发事件。默认为true，即当事件不满足立即触发的条件时，会在事件池中添加延迟间隔时间后再触发的事件}
   * @returns {Function}
   */
  _.throttle = (func, wait, options) => {
    let context, args, result
    let timeout = null
    let previous = 0
    if (!options) options = {}
    let later = function () {
      previous = options.leading === false ? 0 : _.now()
      timeout = null
      result = func.apply(context, args)
      if (!timeout) context = args = null
    }
    return function () {
      let now = _.now()
      // 如果leading没有设置为false，则now - previous所得的数字必定
      // wait值，亦即事件触发瞬间就会立即执行一次。如果设置
      // leading = false，那么在事件触发瞬间，now - previous = 0
      // 也就不会在触发瞬间立即执行一次了
      if (!previous && options.leading === false) previous = now
      let remaining = wait - (now - previous)
      
      context = this
      args = arguments
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        // 执行一次后，立即记录执行的时间
        previous = now
        result = func.apply(context, args)
        if (!timeout) context = args = null
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining)
      }
      return result
    }
  }
  
  /**
   * var lazyLayout = _.debounce(calculateLayout, 300);
   * $(window).resize(lazyLayout);
   * 懒执行函数：如果函数重复触发，而你希望他“最终只执行一次”，则可以使用这个函数
   * 使用场景：如文本框快速输入，你不希望重复提交ajax请求，只在用户停止输入后才提交
   * 关于throttle和debounce的区别参看：
   * http://drupalmotion.com/article/debounce-and-throttle-visual-explanation
   * @param func
   * @param wait
   * @param immediate
   */
  _.debounce = (func, wait, immediate) => {
    let timeout, args, context, timestamp, result
    
    let later = () => {
      let last = _.now() - timestamp
      
      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last)
      } else {
        timeout = null
        if (!immediate) {
          result = func.apply(context, args)
          if (!timeout) context = args = null
        }
      }
    }
    
    return function () {
      context = this
      args = arguments
      timestamp = _.now()
      let callNow = immediate && !timeout
      if (!timeout) timeout = setTimeout(later, wait)
      if (callNow) {
        result = func.apply(context, args)
        context = args = null
      }
      
      return result
    }
  }
  
  /**
   * var hello = function(name) { return "hello: " + name; };
   * hello = _.wrap(hello, function(func) {
       return "before, " + func("moe") + ", after";
     });
   * hello();
   * => 'before, hello: moe, after'
   * 在函数外层再包裹一层函数
   * 当执行函数前需要先执行额外的逻辑或传入额外的参数时适用
   * @param func
   * @param wrapper
   */
  _.wrap = (func, wrapper) => {
    return _.partial(wrapper, func)
  }
  
  /**
   * var greet    = function(name){ return "hi: " + name; };
   * var exclaim  = function(statement){ return statement.toUpperCase() + "!"; };
   * var welcome = _.compose(greet, exclaim);
   * welcome('moe');
   * => 'hi: MOE!'
   * 组合函数：从后往前，每个函数的返回值都将作为下一个函数的参数
   */
  _.compose = () => {
    let args = arguments
    let start = args.length - 1
    return function () {
      let i = start
      let result = args[start].apply(this, arguments)
      while (i--) result = args[i].call(this, result)
    }
  }
  
  /**
   * var renderNotes = _.after(notes.length, render);
   * _.each(notes, function(note) {
       note.asyncSave({success: renderNotes});
     });
   * // renderNotes is run once, after all notes have saved.
   * @param times
   * @param func
   */
  _.after = (times, func) => () => {
    if (--times < 1) {
      return func.apply(this, arguments)
    }
  }
  
  /**
   * var monthlyMeeting = _.before(3, askForRaise);
   * monthlyMeeting();
   * monthlyMeeting();
   * monthlyMeeting();
   * // the result of any subsequent calls is the same as the second call
   * @param times
   * @param func
   * @returns {Function}
   */
  _.before = (times, func) => {
    let memo
    return function () {
      if (--times > 0) {
        memo = func.apply(this, arguments)
      }
      if (times <= 1) func = null
      return memo
    }
  }
  
  _.once = _.partial(_.before, 2)
  
  /**
   * var isFalsy = _.negate(Boolean);
   * _.find([-2, -1, 0, 1, 2], isFalsy);
   * => 0
   * @param predicate
   */
  _.negate = predicate => () => !predicate.apply(this, arguments)
  
  _.random = function (min, max) {
    if (max == null) {
      max = min // 如果之传入一个参数，则默认取值范围为0~传入的数字
      min = 0
    }
    return min + Math.floor(Math.random() * (max - min + 1))
  }
  
  // 将由键值对构成的非数组对象改造成由值构成的数组对象
  _.values = function (obj) {
    let keys = _.keys(obj),
      length = keys.length,
      values = Array(length)
    for (let i = 0; i < length; i++) {
      values[i] = obj[keys[i]]
    }
    return values
  }
  
  _.matcher = _.matches = function (attrs) {
    attrs = _.extendOwn({}, attrs)
    return function (obj) {
      return _.isMatch(obj, attrs)
    }
  }
  
  // 检测对象是否包含指定的“键：值”对组合
  _.isMatch = function (object, attrs) {
    let keys = _.keys(attrs), length = keys.length
    if (object == null) return !length
    let obj = Object(object)
    for (let i = 0; i < length; i++) {
      let key = keys[i]
      if (attrs[key] !== obj[key] || !(key in obj)) return false
    }
    return true
  }
  
  
  const createAssigner = (keysFuc, undefinedOnly) => obj => {
    let length = arguments.length
    if (length < 2 || obj == null) return obj
    for (let index = 1; index < length; index++) {
      let source = arguments[index],
        keys = keysFunc(source),
        l = keys.length
      for (let i = 0; i < l; i++) {
        let key = keys[i]
        // 如果不传入undefinedOnly，则不检测原对象上是否存在该属性；
        // 亦即覆盖原对象上的所有属性
        // undefinedOnly这个参数将这个函数在merge（合并）和inherit&extend（继承原对象上的值，扩展原对象上不存在的键）之间自由切换
        if (!undefinedOnly || obj[key] === void 0) {
          obj[key] = source[key]
        }
      }
    }
    return obj
  }
  
  _.extendOwn = _.assign = createAssigner(_.keys)
  
  _.negate = function (predicate) {
    return function () {
      return !predicate.apply(this, arguments)
    }
  }
  
  // IE9以下的版本有bug，下面这些keys不能被'for key in...'方法遍历，所以如果在对象实例上重写对象原型上的这些方法，就会导致它们无法被遍历到
  const hasEnumBug = !{toString:null}.propertyIsEnumerable('toString')
  const nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString']
  
  /**
   *
   * @param obj
   * @param keys
   */
  function collectNonEnumProps(obj, keys) {
    let nonEnumIdx = nonEnumerableProps.length
    let constructor = obj.constructor
    let proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto
    
    // Constructor是特殊情况
    let prop = 'constructor'
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop)
    
    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx]
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop)
      }
    }
  }
  
  _.keys = obj => {
    if (!_.isObject(obj)) return []
    if (nativeKeys) return nativeKeys(obj)
    let keys = []
    for (key in obj) _.has(obj, key) && keys.push(key)
    // 兼容IE9
    if (hasEnumBug) collectNonEnumProps(obj, keys)
    return keys
  }
  
  _.allKeys = obj => {
    if (!_.isObject(obj)) return [];
    let keys = [];
    for (let key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  }
  
  _.values = obj => {
    let keys = _.keys(obj)
    let length = keys.length
    let values = Array(length)
    for (let i = 0; i < length; i++) {
      values[i] = obj[keys[i]]
    }
    return values
  }
  
  /**
   * _.mapObject({start: 5, end: 12}, function(val, key) {
       return val + 5;
     });
   * => {start: 10, end: 17}
   * 数组map方法的普通对象版，返回新对象，并不修改原对象
   * @param obj
   * @param iteratee
   * @param context
   */
  _.mapObject = (obj, iteratee, context) => {
    iteratee = cb(iteratee, context)
    let keys = _.keys(obj), length = keys.length, result = {}, currentKey
    for (let i = 0; i < length; i++) {
      currentKey = keys[i]
      result[currentKey] = iteratee(obj[currentKey], currentKey, obj)
    }
    return result
  }
  
  /**
   * _.pairs({one: 1, two: 2, three: 3});
   * => [["one", 1], ["two", 2], ["three", 3]]
   * @param obj
   * @returns {*}
   */
  _.pairs = obj => {
    let keys = _.keys(obj);
    let length = keys.length;
    let pairs = Array(length);
    for (let i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  }
  
  /**
   * _.invert({Moe: "Moses", Larry: "Louis", Curly: "Jerome"});
   * => {Moses: "Moe", Louis: "Larry", Jerome: "Curly"};
   * @param obj
   * @returns {{}}
   */
  _.invert = obj => {
    let result = {};
    let keys = _.keys(obj);
    for (let i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  }
  
  /**
   * _.functions(_);
   * => ["all", "any", "bind", "bindAll", "clone", "compact",   "compose" ...
   * @type {function(*)}
   */
  _.functions = _.methods = obj => {
    let names = []
    for (let key in obj) {
      if (_.isFunction(obj[key])) names.push(key)
    }
    return names.sort()
  }
  
  /**
   * 对象扩展函数，扩展内容包括原型属性及方法
   */
  _.extend = createAssigner(_.allKeys)
  
  /**
   * 对象扩展函数，不包括原型属性及方法
   */
  _.extendOwn = _.assign = createAssigner(_.keys)
  
  /**
   * 类似于es6数组的findIndex方法，但是是用来检测对象的
   * 返回第一个对应的值满足二参数传入的函数的检验的对象键
   * @param obj
   * @param predicate
   * @param context
   * @returns {*}
   */
  _.findKey = (obj, predicate, context) => {
    predicate = cb(predicate, context)
    let keys = _.keys(obj), key
    for (let i = 0, length = keys.length; i < length; i++) {
      key = keys[i]
      if (predicate(obj[key], key, obj)) return key
    }
  }
  
  /**
   * _.pick({name: 'moe', age: 50, userid: 'moe1'}, 'name', 'age');
   * => {name: 'moe', age: 50}
   * _.pick({name: 'moe', age: 50, userid: 'moe1'}, function(value, key, object) {
       return _.isNumber(value);
     });
   * => {age: 50}
   * @param object
   * @param oiteratee
   * @param context
   * @returns {{}}
   */
  _.pick = (object, oiteratee, context) => {
    let result = {}, obj = object, iteratee, keys
    if (obj == null) return result
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj)
      iteratee = optimizeCb(oiteratee, context)
    } else {
      keys = flatten(arguments, false, false, 1) // 将除第一个参数外的剩余参数转换成扁平化后的数组，意味着无法选取嵌套对象的键值对
      iteratee = (value, key, obj) => key in obj
      obj = Object(obj) // 通过obj = Object(obj)创建等同于原对象的新对象，避免iteratee处理obj的时候“可能”意外修改原对象的值
    }
    for (let i = 0, length = keys.length; i < length; i++) {
      let key = keys[i]
      let value = obj[key]
      iteratee(value, key, obj) && (result[key] = value)
    }
    return result
  }
  
  /**
   * _.omit({name: 'moe', age: 50, userid: 'moe1'}, 'userid');
   * => {name: 'moe', age: 50}
   * _.omit({name: 'moe', age: 50, userid: 'moe1'}, function(value, key, object) {
       return _.isNumber(value);
     });
   * => {name: 'moe', userid: 'moe1'}
   * @param obj
   * @param iteratee
   * @param context
   */
  _.omit = (obj, iteratee, context) => {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee)
    } else {
      let keys = _.map(flatten(arguments, false, false, 1), String)
      iteratee = (value, key) => !_.contains(keys, key)
    }
    return _.pick(obj, iteratee, context)
  }
  
  /**
   * var iceCream = {flavor: "chocolate"};
   * _.defaults(iceCream, {flavor: "vanilla", sprinkles: "lots"});
   * => {flavor: "chocolate", sprinkles: "lots"}
   * _.default等同于inherit & extend，_.extend等同于merge
   */
  _.defaults = createAssigner(_.allKeys, true);
  
  /**
   * var moe = _.create(Stooge.prototype, {name: "Moe"});
   * 以传入的第一个参数为原型创建新的对象
   * 如果传入第二个参数，则扩展新创建的对象（不包括原型属性）
   * @param prototype
   * @param props
   * @returns {{}}
   */
  _.create = (prototype, props) => {
    let result = baseCreate(prototype)
    if (props) _.extendOwn(result, props)
    return result
  }
  
  // 浅复制对象
  _.clone = obj => {
    if (!_.isObject(obj)) return obj
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj)
  }
  
  /**
   * _.chain([1,2,3,200])
       .filter(function(num) { return num % 2 == 0; })
       .tap(alert)
       .map(function(num) { return num * num })
       .value();
   * => // [2, 200] (alerted)
   * => [4, 40000]
   * 用于链式调用，在后续处理数据前先用interceptor拦截处理
   * 返回处理**前**的对象以供后续函数继续处理
   * @param obj
   * @param interceptor
   * @returns {*}
   */
  _.tap = (obj, interceptor) => {
    interceptor(obj)
    return obj
  }
  
  /**
   * var stooge = {name: 'moe', age: 32};
   * _.isMatch(stooge, {age: 32});
   * => true
   * @param object
   * @param attrs
   * @returns {boolean}
   */
  _.isMatch = (object, attrs) => {
    let keys = _.keys(attrs), length = keys.length
    if (object == null) return !length
    let obj = Object(object)
    for (let i = 0; i < length; i++) {
      let key = keys[i]
      if (attrs[key] !== obj[key] || !(key in obj)) return false
    }
    return true
  }
  
  /**
   *
   * @param a
   * @param b
   * @param aStack
   * @param bStack
   */
  const eq = (a, b, aStack, bStack) => {
    // 如果a,b全等，则检测它们是否为0，不为0则返回true；
    // 如果为0，则检测是否有符号，0 和 “-0”不相等
    // 检测方法为 1 / 0返回Infinity，1 / -0 返回-Infinity
    if (a === b) return a !== 0 || 1 / a === 1 / b
    
    // 排除undefined == null的情况
    if (a == null || b == null) return a === b
    
    // 如果a, b为underscore的实例，则将之还原为实例化前的a,b
    if (a instanceof _) a = a._wrapped
    if (b instanceof _) b = b._wrapped
    
    // 如果两者使用Object.prototype.toString方法转化后的结果不相等，代表两个对象不同类型，后续也就不需要再比较了
    // 比如'[object Object]'和'[object Array]'
    let className = toString.call(a)
    if (className !== toString.call(b)) return false
    
    switch (className) {
      case '[object RegExp]':
      case '[object String]':
        // 正则和字符串类型对象对比方案：转换成字符串对比
        return '' + a === '' + b
      case '[object Number]':
        // 如果是数字类型对象：
        // 1. 检测转化为数字后的a, b是否为NaN
        if (+a !== +a) return +b !== +b
        // 2. 检测转后后的数字是否为+0, -0, +0 !== -0
        // 3. 转化后的a,b为其它普通数字，则全等比较即可
        return +a === 0 ? 1 / +a === 1 / b : +a === +b
      case '[object Date]':
      case '[object Boolean]':
        // 如果为日期或布尔值对象，则强制转化成数字后比较
        // +Date返回毫秒数的日期时间戳，+Boolean返回0或1
        return +a === +b
    }
    
    // 检测是否为数组
    let areArrays = className === '[object Array]'
    
    if (!areArrays) {
      // 非数组比较
      if (typeof a != 'object' || typeof b != 'object') return false // a, b任一类型为函数的情况下，直接返回false ?????函数无法全等比较？
      
      // 不同构造器生成的对象不相等，但是如果仅仅是不同frame的构造器生成的对象或数组，则可以是相等的
      let aCtor = a.constructor, bCtor = b.constructor
      if (aCtor !== bCtor
        && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor)
        && ('constructor' in a && 'constructor' in b)) {
        return false
      }
    }
    
    aStack = aStack || []
    bStack = bStack || []
    let length = aStack.length
    while (length--) {
      if (aStack[length] === a) return bStack[length] === b
    }
    
    aStack.push(a)
    bStack.push(b)
    
    // 递归对比对象和数组
    if (areArrays) {
      length = a.length
      if (length !== b.length) return false
      while (length--) {
        // 注意递归思路
        if (!eq(a[length], b[length], aStack, bStack)) return false
      }
    } else {
      let keys = _.keys(a), key
      length = keys.length
      if (_.keys(b).length !== length) return false
      while (length--) {
        key = keys[length]
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false
      }
    }
    
    aStack.pop()
    bStack.pop()
    return true
  }
  
  _.isEqual = (a, b) => eq(a, b)
  
  _.isEmpty = obj => {
    if (obj === null) return true
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0
    
    return _.keys(obj).length === 0
  }
  
  // 通过nodeType为1检测对象是否为dom对象
  _.isElement = obj => !!(obj && obj.nodeType === 1)
  
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };
  
  _.isObject = function(obj) {
    let type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };
  
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], name => {
    _[`is${name}`] = obj => toString.call(obj) === `[object ${name}]`
  })
  
  // IE9以下版本无法检测Arguments类型，故用如下回退方法
  // Arguments对象自带callee属性
  if (!_.isArguments(arguments)) {
    _.isArguments = obj => _.has(obj, 'callee')
  }
  
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = obj => typeof obj == 'function' || false
  }
  
  _.isFinite = obj => isFinite(obj) && !isNaN(parseFloat(obj))
  
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };
  
  _.isNull = function(obj) {
    return obj === null;
  };
  
  _.isUndefined = function(obj) {
    return obj === void 0;
  };
  
  _.has = (obj, key) => obj != null && hasOwnProperty.call(obj, key)
  
  _.noConflict = function () {
    root._ = previousUnderscore
    return this
  }
  
  /**
   * var stooge = {name: 'moe'};
   * stooge === _.constant(stooge)();
   * => true
   * @param value
   */
  _.constant = value => () => value
  
  _.noop = function () {}
  
  _.propertyOf = obj => obj == null ? function () {} : function (key) {return obj[key]}
  
  /**
   * let consoleFunc = function(num) {return num}
   * _.times(3, consoleFunc)
   * => [0,1,2]
   * @param n
   * @param iteratee
   * @param context
   * @returns {*}
   */
  _.times = (n, iteratee, context) => {
    let accum = Array(Math.max(0, n))
    iteratee = optimizeCb(iteratee, context, 1)
    for (let i = 0; i < n; i++) accum[i] = iteratee(i)
    return accum
  }
  
  _.random = (min, max) => {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  }
  
  _.now = Date.now || (() => new Date().getTime())
  
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  }
  
  const unescapeMap = _.invert(escapeMap)
  
  const createEscaper = map => {
    let escaper = match => map[match]
    
    let source = '(?:' + _.keys(map).join('|') + ')'
    let testRegexp = RegExp(source)
    let replaceRegexp = RegExp(source, 'g')
    
    return function (string) {
      string = string == null ? '' : '' + string
      
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string
    }
  }
  
  // _.escape('Curly, Larry & Moe');
  // => "Curly, Larry &amp; Moe"
  _.escape = createEscaper(escapeMap)
  
  // _.unescape('Curly, Larry &amp; Moe');
  // => "Curly, Larry & Moe"
  _.unescape = createEscaper(unescapeMap)
  
  /**
   * var object = {cheese: 'crumpets', stuff: function(){ return 'nonsense'; }};
   * _.result(object, 'cheese');
   * => "crumpets"
   * _.result(object, 'stuff');
   * => "nonsense"
   * _.result(object, 'meat', 'ham');
   * => "ham"
   * @param object
   * @param property
   * @param fallback
   * @returns {*}
   */
  _.result = (object, property, fallback) => {
    let value = object == null ? void 0 : object[property]
    if (value === void 0) {
      // 如果value为undefined，返回fallback回退值
      value = fallback
    }
    // 属性为方法则执行方法，不为方法则返回属性值
    return _.isFunction(value) ? value.call(object) : value
  }
  
  //
  let idCounter = 0
  _.uniqueId = prefix => {
    let id = ++idCounter + ''
    return prefix ? prefix + id : id
  }
  
  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  }
  
  const noMatch = /(.)^/
  
  const escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  }
  
  const escaper = /\\|'|\r|\n|\u2028|\u2029/g
  
  const escapeChar = match => '\\' + escapes[match]
  
  /**
   * var compiled = _.template("hello: <%= name %>");
   * compiled({name: 'moe'});
   * => "hello: moe"
   *
   * var template = _.template("<b><%- value %></b>");
   * template({value: '<script>'});
   * => "<b>&lt;script&gt;</b>"
   * @param text
   * @param settings
   * @param oldSettings
   */
  _.template = (text, settings, oldSettings) => {
    if (!settings && oldSettings) settings = oldSettings
    settings = _.defaults({}, settings, _.templateSettings)
    
    let matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g')
    
    let index = 0
    let source = "__p+='"
    
    text.replace(matcher, (match, escape, interpolate, evaluate, offset) => {
      source += text.slice(index, offset).replace(escaper, escapeChar)
      index = offset + match.length
      
      if (escape) {
        source += `'+\n((__t=(${escape}))==null?'':_escape(__t))+\n'`
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      
      return match
    })
    
    source += "';\n"
    
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
    
    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';
    
    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }
    
    let template = data => render.call(this, data, _)
  
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';
  
    return template;
  }
  
  /**
   * var stooges = [{name: 'curly', age: 25}, {name: 'moe', age: 21}, {name: 'larry', age: 23}];
   * var youngest = _.chain(stooges)
       .sortBy(function(stooge){ return stooge.age; })
       .map(function(stooge){ return stooge.name + ' is ' + stooge.age; })
       .first()
       .value();
   * => "moe is 21"
   * @param obj
   */
  _.chain = obj => {
    let instance = _(obj)
    instance._chain = true
    return instance
  }
  
  let result  = (instance, obj) => instance._chain ? _(obj).chain() : obj
  
  /**
   * _.mixin({
       capitalize: function(string) {
         return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
       }
     });
   * _("fabio").capitalize();
   * => "Fabio"
   * 用于编写underscore插件，扩展方法
   * @param obj
   */
  _.mixin = function (obj) {
    _.each(_.functions(obj), function (name) {
      let func = _[name] = obj[name]
      _.prototype[name] = function () {
        let args = [this._wrapped]
        push.apply(args, arguments)
        return result(this, func.apply(_, args))
      }
    })
  }
  
  // 将underscore的所有自有方法代理（复制）到underscore的原型上，使所有的underscore的实例也继承这些方法
  // 进一步的，使得_.chain开启链式调用成为现实
  _.mixin(_)
  
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], name => {
    let method = ArrayProto[name]
    _.prototype[name] = function () {
      let obj = this._wrapped
      method.apply(obj, arguments)
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0]
      return result(this, obj)
    }
  })
  
  _.each(['concat', 'join', 'slice'], name => {
    let method = ArrayProto[name]
    _.prototype[name] = function () {
      return result(this, method.apply(this._wrapped, arguments))
    }
  })
  
  _.prototype.value = function () {
    return this._wrapped
  }
  
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value
  
  _.prototype.toString = function () {
    return '' + this._wrapped
  }
  
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function () {
      return _
    })
  }
}.call(this))