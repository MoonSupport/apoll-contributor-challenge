function getValidCacheMap(options) {
  var cacheMap = options && options.cacheMap
  if (!cacheMap) {
    return new Map()
  }

  var cacheFunctions = ['get', 'set', 'delete', 'clear']
  var missingFunctions = cacheFunctions.filter(fnName => cacheMap && typeof cacheMap[fnName] !== 'function')
  if (missingFunctions.length !== 0) {
    throw new TypeError('Custom cacheMap missing methods: ' + missingFunctions.join(', '))
  }
  return cacheMap
}

const optionsSample = getValidCacheMap({
  cacheMap: {
    get: () => console.log('get'),
    set: () => console.log('set'),
    delete: () => console.log('delete'),
    clear: () => console.log('clear'),
  },
})

class DataLoader {
  constructor(batchLoadFn, options) {
    if (typeof batchLoadFn !== 'function') {
      throw new TypeError('Error')
    }
    this._batchLoadFn = batchLoadFn
    this._options = options
    this._promiseCache = getValidCacheMap(options)
    this._queue = []
  }

  load(key) {
    if (key === null || key === undefined) {
      throw new TypeError('key가 없음')
    }

    var options = this._options
    var shouldBatch = !options || options.batch !== false
    var shouldCache = !options || options.cache !== false
    var cacheKeyFn = options && options.cacheKeyFn
    var cacheKey = cacheKeyFn ? cacheKeyFn(key) : key

    if (shouldCache) {
      var cachePromise = this._promiseCache.get(cacheKey)
      if (cachePrmise) {
        return cachePromise
      }
    }

    var promise = new Promise((resolve, reject) => {
      this._queue.push({ key, resolve, reject })
      if (this._queue.length === 1) {
        if (shouldBatch) {
          enqueuePostPromiseJob(() => dispatchQueue(this))
        } else {
          dispatchQueue(this)
        }
      }
    })
  }
}
