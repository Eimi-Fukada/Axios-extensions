import test from "ava";
import isCacheLike from "../isCacheLike";

test("a object with specified method will be regard as cache", (t) => {
	let cache = {};
	t.is(isCacheLike(cache), false);

	cache = {
		// tslint:disable-next-line
		get() {},
		// tslint:disable-next-line
		set() {},
		// tslint:disable-next-line
		del() {},
	};
	t.is(isCacheLike(cache), true);
});
