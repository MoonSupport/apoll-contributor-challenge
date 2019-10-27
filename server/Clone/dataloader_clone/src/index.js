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
    this._options = options // optional
    this._promiseCache = getValidCacheMap(options)
    this._queue = []
  }

  load(key) {
    if (key === null || key === undefined) {
      throw new TypeError('key가 없음')
    }

    var options = this._options
    var shouldBatch = !options || options.batch !== false
    // 옵션이 없을때 true , 옵션 배치가 true라면 true
    var shouldCache = !options || options.cache !== false
    // 옵션이 없을때 true, 옵션 캐시가 true라면 true
    var cacheKeyFn = options && options.cacheKeyFn
    var cacheKey = cacheKeyFn ? cacheKeyFn(key) : key
    // If caching and there is a cache-hit, return cached Promise.
    if (shouldCache) {
      var cachePromise = this._promiseCache.get(cacheKey)
      // 중복을 제거하는 느낌 cachePromise가 있으면 그냥 cachePromise를 리턴
      // cache-hit => 캐시가 존재하는거. 캐시를 생성할 필요가 없이 캐시에서 데이터를 가져올 수 있는 것
      if (cachePromise) {
        return cachePromise
      }
    }
    // Otherwise, produce a new Promise for this value.
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

    if (shouldCache) {
      this._promiseCache.set(cacheKey, promise)
    }

    return promise
  }

  loadMany(keys) {
    if (!Array.isArray(keys)) {
      throw new Error('keys가 어레이가 아닙니다.')
    }
    return Promise.all(keys.map(key => this.load(key)))
  }

  clear(key) {
    var cacheKeyFn = this._options && this._options.cacheKeyFn
    var cacheKey = cacheKeyFn ? cacheKeyFn(key) : key
    this._promiseCache.delete(cacheKey)
    return this
  }

  clearAll() {
    this._promiseCache.clear()
    return this
  }

  prime(key, value) {
    var cacheKeyFn = this._options && this._options.cacheKeyFn
    var cacheKey = cacheKeyFn ? cacheKeyFn(key) : key

    if (this._promiseCache.get(cacheKey) === undefined) {
      var promise = value instanceof Error ? Promise.reject(value) : Promise.resolve(value)

      this._promiseCache.set(cacheKey, promise)
    }
    return this
  }
}

var enqueuePostPromiseJob =
  typeof process === 'object' && typeof process.nextTick === 'function'
    ? function(fn) {
        if (!resolvedPromise) {
          resolvedPromise = Promise.resolve()
        }
        resolvedPromise.then(() => process.nextTick(fn))
      }
    : setImmdiate || setTimeout

var resolvedPromise

function dispatchQueue(loader) {
  var queue = loader._queue //로더에 있는 큐를 가져오고 로컬 함수 큐에 담음
  loader._queue = [] //로더의 큐는 리셋

  var maxBatchSize = loader._options // 옵션 뒤짐
  if (maxBatchSize && maxBatchSize > 0 && maxBatchSize < queue.length) {
    //maxBatchSize가 queue의 길이보다 작고 0보다 크다면.
    for (var i = 0; i < queue.length / maxBatchSize; i++) {
      // 나눠서 큐 배치
      dispatchQueueBatch(loader, queue.slice(i * maxBatchSize, (i + 1) * maxBatchSize))
    } // 아니면 그냥 큐 배치
  } else {
    dispatchQueueBatch(loader, queue)
  }
}

function dispatchQueueBatch(loader, queue) {
  var keys = queue.map(({ key }) => key) // 큐의 키들

  var batchLoadFn = loader._batchLoadFn // 배치로드할 함수
  var batchPromise = batchLoadFn(keys) //

  if (!batchPromise || typeof batchPromise.then !== 'function') {
    return failedDispatch(loader, queue, new TypeError('배치 프라미스가 없거나 배치 프라미스 덴이 펑션이 아님'))
  }

  batchPromise
    .then(values => {
      if (!Array.isArray(values)) {
        throw new TypeError('values는 어레이여야함')
      }

      // console.log('value is :', values)
      // console.log('key is :', keys)

      if (values.length !== keys.length) {
        throw new TypeError('values 길이랑 키 길이랑 다름')
      }

      queue.forEach(({ resolve, reject }, index) => {
        var value = values[index]
        if (value instanceof Error) {
          reject(value)
        } else {
          resolve(value)
        }
      })
    })
    .catch(error => failedDispatch(loader, queue, error))
}

function failedDispatch(loader, queue, error) {
  queue.forEach(({ key, reject }) => {
    loader.clear(key)
    reject(error)
  })
}

//

;(async function() {
  const a = new DataLoader(
    keys =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(keys)
        }, 1000)
      })
  )
  var promise1 = a.load(1)
  var promise2 = a.load(2)
  var promise3 = a.load(3)
  var promise3_1 = a.load(3)
  // var promise4 = await a.load(4)
  // var promise5 = await a.loadMany([1, 2, 3, 4, 3])
  console.log(promise3_1)
})()

// var enqueuePostPromiseJob =
//   typeof process === 'object' && typeof process.nextTick === 'function'
//     ? function(fn) {
//         if (!resolvedPromise) {
//           resolvedPromise = Promise.resolve()
//         }
//         resolvedPromise.then(() => process.nextTick(fn))
//       }
//     : setImmdiate || setTimeout

// const test = enqueuePostPromiseJob(FN)
