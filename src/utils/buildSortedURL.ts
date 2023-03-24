// @ts-ignore
import buildURL from "../../node_modules/axios/lib/helpers/buildURL.js";

export default function buildSortedURL(...args: any[]) {
	const builtURL = buildURL(...args);

	const [urlPath, queryString] = builtURL.split("?");

	if (queryString) {
		const paramsPair = queryString.split("&");
		return `${urlPath}?${paramsPair.sort().join("&")}`;
	}

	return builtURL;
}
