// import merge from 'lodash/merge';
// import isString from 'lodash/isString';
// import { stringify as stringifyQueryString } from 'querystring';
// import fetch from 'node-fetch';

// let BaseUrl = '';

// export function setBaseUrl(baseUrl) {
//   BaseUrl = baseUrl;
// }

// const fetchDefaultOptions = {
//   headers: {
//     'Content-Type': 'application/json'
//   },
//   contentType: "application/json; charset=utf-8",
//   dataType: "json"
// };


// const getPromises = {};


// export async function fetchGET(url, queryString, httpOptions, useCache = true, otherOptions) {
//   url = buildUrl(url, queryString);

//   if (useCache) {
//     // if (GetResultCache[url]) {
//     //   return GetResultCache[url];
//     // }

//     if (getPromises[url]) {
//       return getPromises[url];
//     }
//   }

//   const promise = wrappedFetch('GET', url, null, httpOptions, otherOptions);
//   if (useCache) {
//     getPromises[url] = promise;
//   }

//   const result = await promise;
//   return result;
// }

// export async function fetchPOST(url, body, queryString, httpOptions, otherOptions) {
//   url = buildUrl(url, queryString);

//   const res = await wrappedFetch('POST', url, body, httpOptions, otherOptions);
//   return res;
// }

// export async function fetchPUT(url, body, queryString, httpOptions, otherOptions) {
//   url = buildUrl(url, queryString);

//   const res = await wrappedFetch('PUT', url, body, httpOptions, otherOptions);
//   return res;
// }

// export function buildUrl(url, queryString) {
//   if (queryString !== null && queryString !== undefined) {
//     if (typeof queryString === 'object') {
//       queryString = stringifyQueryString(queryString); // parse querystring object
//     }
//     else {
//       // already a string - nothing to do
//     }

//     if (!queryString.startsWith('?')) {
//       queryString = '?' + queryString;
//     }
//   }
//   else {
//     queryString = '';
//   }

//   return url + queryString;
// }

// /**
//  * Basic JSON API fetch wrapper.
//  */
// export async function wrappedFetch(method, url, body, httpOptions, otherOptions) {
//   if (body !== undefined && body !== null && !isString(body)) {
//     body = JSON.stringify(body);
//   }
  
//   httpOptions = merge(
//     {
//       method,
//       body,
//     },
//     fetchDefaultOptions,
//     httpOptions
//   );

//   if (BaseUrl && !url.startsWith('/')) {
//     url = '/' + url;
//   }
//   const response = await fetch(BaseUrl + url, httpOptions);

//   if (response.status >= 400) {
//     // HTTP/server error
//     const res = await response.text();
//     throw new Error(`could not fetch URL '${url}' [${response.status}] - ${response.statusText}\n\n${res}`);
//   }

//   // read results
//   if (otherOptions?.raw) {
//     return response.text();
//   }
//   else {
//     return response.json();
//   }
// }

// // window.fetchPOST = fetchPOST;