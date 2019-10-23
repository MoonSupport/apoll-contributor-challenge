## DataLoader

local
this.\_batchLoadFn 배치로드할 함수
this.\_options 옵션
this.\_promiseCache 키밸류맵
this.\_queue = []

document name in a MongoDB database?헤에?

batchLoadFn => 배치를 로드하는 함수 (배치 준비 함수)

this.*batchLoadFn = batchLoadFn ==> this의 함수 안에서 batchLoadFn을 사용하기 위해서 다음과 같이 *변수명

shouldBatch = 옵션의 배치가 없다면 해야함
shouldCache = 옵션의 캐시가 없다면 해야함

cacheKeyFn => 캐시 key 뽑아내는 함수
cacheKey = CacheKeyFn으로 뽑아낸 key, 만약 함수가 없다면 받은 key

promiseCache => Map(key,value)로 된 약속된 캐시, 옵션이 있다면 그걸 쓰고 없다면 새로운 맵을 만든다.

cachePromise - cache가 히트되어 생긴 Promise

promise = 새로운 프라미스
------> this.\_queue = key와 promise의 resolve, reject를 객체로 쌓는다.
------> enqueuePostPromiseJob -> queue에 PromiseJob를 넣는 함수.
------> resolvedPromise -> Promise를 이행하는 것.
------> 인자로 받은 fn을 nextTick을 이용해서 뒤로 미룸
------> nextTick은 setImmdiate나 (setTimeout,0)과 같이 아주 짧은 시간 뒤에 발생시키는 것

\*\* enqueuePostPromiseJob dispatchQueue를 뒤로 미룬다!!

dispatchQueue - 큐를 조건에 따라서 Promise 처리

dispatchQueueBatch - 배치로드할 함수를 키들에게 박음. --> Promise 함수를 리턴함
이후 queue를 mapping하며 Promise함수를 실행시킴
결론 : 애는 큐에 쌓인 Promise를 처리하는 역할이 맞음
