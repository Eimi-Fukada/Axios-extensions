import Cache from "lru-cache";
import cacheAdapterEnhancer from "./cacheAdapterEnhancer";
import retryAdapterEnhancer from "./retryAdapterEnhancer";
import throttleAdapterEnhancer from "./throttleAdapterEnhancer";
import { ICacheLike } from "./utils/isCacheLike";

export {
	Cache,
	ICacheLike,
	cacheAdapterEnhancer,
	throttleAdapterEnhancer,
	retryAdapterEnhancer,
};
