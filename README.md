# axios-extensions-pro

由原 axios-extensions 改造而来，解决 buildURL 引入、rollup.js 不支持导入 json 模块、axios 版本过久等问题

## Usage

```javascript
import axios from "axios";
import {
	cacheAdapterEnhancer,
	throttleAdapterEnhancer,
} from "axios-extensions";

// enhance the original axios adapter with throttle and cache enhancer
const http = axios.create({
	baseURL: "/",
	headers: { "Cache-Control": "no-cache" },
	adapter: throttleAdapterEnhancer(
		cacheAdapterEnhancer(axios.defaults.adapter)
	),
});
```

#### browser (webpack)

```js
new webpack.DefinePlugin({
	"process.env.LOGGER_LEVEL": JSON.stringify("info"),
});
```

#### node

```json
// package.json
"scripts": {
	"start": "cross-env LOGGER_LEVEL=info node server.js"
}
```

## API

### cacheAdapterEnhancer

> Makes axios cacheable

```typescript
cacheAdapterEnhancer(adapter: AxiosAdapter, options: Options): AxiosAdapter
```

Where `adapter` is an axios adapter which following the [axios adapter standard](https://github.com/axios/axios/blob/master/lib/adapters/README.md), `options` is an optional that configuring caching:

| Param            | Type      | Default value                                               | Description                                                                                                                       |
| ---------------- | --------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| enabledByDefault | boolean   | true                                                        | Enables cache for all requests without explicit definition in request config (e.g. `cache: true`)                                 |
| cacheFlag        | string    | 'cache'                                                     | Configures key (flag) for explicit definition of cache usage in axios request                                                     |
| defaultCache     | CacheLike | <pre>new LRUCache({ maxAge: FIVE_MINUTES, max: 100 })</pre> | a CacheLike instance that will be used for storing requests by default, except you define a custom Cache with your request config |

`cacheAdapterEnhancer` enhances the given adapter and returns a new cacheable adapter back, so you can compose it with any other enhancers, e.g. `throttleAdapterEnhancer`.

#### basic usage

```javascript
import axios from "axios";
import { cacheAdapterEnhancer } from "axios-extensions";

const http = axios.create({
	baseURL: "/",
	headers: { "Cache-Control": "no-cache" },
	// cache will be enabled by default
	adapter: cacheAdapterEnhancer(axios.defaults.adapter),
});

http.get("/users"); // make real http request
http.get("/users"); // use the response from the cache of previous request, without real http request made
http.get("/users", { cache: false }); // disable cache manually and the the real http request invoked
```

#### custom cache flag

```javascript
const http = axios.create({
	baseURL: "/",
	headers: { "Cache-Control": "no-cache" },
	// disable the default cache and set the cache flag
	adapter: cacheAdapterEnhancer(axios.defaults.adapter, {
		enabledByDefault: false,
		cacheFlag: "useCache",
	}),
});

http.get("/users"); // default cache was disabled and then the real http request invoked
http.get("/users", { useCache: true }); // make the request cacheable(real http request made due to first request invoke)
http.get("/users", { useCache: true }); // use the response cache from previous request
```

##### custom cache typing

Note that if you are using custom cache flag and typescript, you may need to add the typing declaration like below:

```ts
import { ICacheLike } from "axios-extensions";
declare module "axios" {
	interface AxiosRequestConfig {
		// if your cacheFlag was setting to 'useCache'
		useCache?: boolean | ICacheLike<any>;
	}
}
```

#### more advanced

Besides configuring the request through the `cacheAdapterEnhancer`, we can enjoy more advanced features via configuring every individual request.

```js
import axios from "axios";
import { cacheAdapterEnhancer, Cache } from "axios-extensions";

const http = axios.create({
	baseURL: "/",
	headers: { "Cache-Control": "no-cache" },
	// disable the default cache
	adapter: cacheAdapterEnhancer(axios.defaults.adapter, {
		enabledByDefault: false,
	}),
});

http.get("/users", { cache: true }); // make the request cacheable(real http request made due to first request invoke)

// define a cache manually
const cacheA = new Cache();
// or a cache-like instance
const cacheB = {
	get() {
		/*...*/
	},
	set() {
		/*...*/
	},
	del() {
		/*...*/
	},
};

// two actual request will be made due to the different cache
http.get("/users", { cache: cacheA });
http.get("/users", { cache: cacheB });

// a actual request made and cached due to force update configured
http.get("/users", { cache: cacheA, forceUpdate: true });
```

_Note: If you are using typescript, do not forget to enable `"esModuleInterop": true` and `"allowSyntheticDefaultImports": true` for better development experience._

### throttleAdapterEnhancer

> Throttle GET requests most once per threshold milliseconds

```ts
throttleAdapterEnhancer(adapter: AxiosAdapter, options: Options): AxiosAdapter
```

Where `adapter` is an axios adapter which following the [axios adapter standard](https://github.com/axios/axios/blob/master/lib/adapters/README.md), `options` is an optional object that configuring throttling:

| Param     | Type      | Default value                        | Description                                                         |
| --------- | --------- | ------------------------------------ | ------------------------------------------------------------------- |
| threshold | number    | 1000                                 | The number of milliseconds to throttle request invocations to       |
| cache     | CacheLike | <pre>new LRUCache({ max: 10 })</pre> | CacheLike instance that will be used for storing throttled requests |

Basically we recommend using the `throttleAdapterEnhancer` with `cacheAdapterEnhancer` together for the maximum caching benefits.
Note that POST and other methods besides GET are not affected.

```js
throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter));
```

Check [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/) to learn more details about throttle and how it differs from debounce.

#### basic usage

```js
import axios from "axios";
import { throttleAdapterEnhancer } from "axios-extensions";

const http = axios.create({
	baseURL: "/",
	headers: { "Cache-Control": "no-cache" },
	adapter: throttleAdapterEnhancer(axios.defaults.adapter, {
		threshold: 2 * 1000,
	}),
});

http.get("/users"); // make real http request
http.get("/users"); // responsed from the cache
http.get("/users"); // responsed from the cache

setTimeout(() => {
	http.get("/users"); // after 2s, the real request makes again
}, 2 * 1000);
```

### retryAdapterEnhancer

> Retry the failed request with special times

```ts
retryAdapterEnhancer(adapter: AxiosAdapter, options: Options): AxiosAdapter
```

Where `adapter` is an axios adapter which following the [axios adapter standard](https://github.com/axios/axios/blob/master/lib/adapters/README.md), `options` is an optional that configuring caching:
| Param | Type | Default value | Description |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------ | ---- |
| times | number | 2 | Set the retry times for failed request globally. |

#### basic usage

```ts
import axios from "axios";
import { retryAdapterEnhancer } from "axios-extensions";

const http = axios.create({
	baseURL: "/",
	headers: { "Cache-Control": "no-cache" },
	adapter: retryAdapterEnhancer(axios.defaults.adapter),
});

// this request will retry two times if it failed
http.get("/users");

// you could also set the retry times for a special request
http.get("/special", { retryTimes: 3 });
```
