import fetch from 'node-fetch';
import merge from 'lodash/merge';
import { isString } from 'lodash';

let BaseUrl = '';

export function setBaseUrl(baseUrl) {
  BaseUrl = baseUrl;
}

const fetchDefaultOptions = {
  headers: {
    'Content-Type': 'application/json'
  },
  contentType: "application/json; charset=utf-8",
  dataType: "json"
};


const getPromises = {};


export async function fetchGET(url, queryString, httpOptions, useCache = true, otherOptions) {
  url = buildUrl(url, queryString);

  if (useCache) {
    // if (GetResultCache[url]) {
    //   return GetResultCache[url];
    // }

    if (getPromises[url]) {
      return await getPromises[url];
    }
  }

  const promise = wrappedFetch('GET', url, null, httpOptions, otherOptions);
  if (useCache) {
    getPromises[url] = promise;
  }

  const result = await promise;
  return result;
}

export async function fetchPOST(url, body, queryString, httpOptions, otherOptions) {
  url = buildUrl(url, queryString);

  const res = await wrappedFetch('POST', url, body, httpOptions, otherOptions);
  return res;
}

export function buildUrl(url, queryString) {
  if (queryString !== null && queryString !== undefined) {
    if (typeof queryString === 'object') {
      // queryString = $.param(queryString); // parse querystring object
      throw new Error('queryString support NYI');
    }
    else {
      // already a string - nothing to do
    }

    if (!queryString.startsWith('?')) {
      queryString = '?' + queryString;
    }
  }
  else {
    queryString = '';
  }

  return url + queryString;
}

/**
 * Basic JSON API fetch wrapper.
 */
export async function wrappedFetch(method, url, body, httpOptions, otherOptions) {
  if (body !== undefined && body !== null && !isString(body)) {
    body = JSON.stringify(body);
  }
  
  httpOptions = merge(
    {
      method,
      body,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0'
      }
    },
    fetchDefaultOptions,
    httpOptions
  );

  if (BaseUrl && !url.startsWith('/')) {
    url = '/' + url;
  }
  const response = await fetch(BaseUrl + url, httpOptions);

  if (response.status >= 400) {
    // HTTP/server error
    const res = await response.text();
    throw new Error(`could not fetch URL '${url}' [${response.status}] - ${response.statusText}\n\n${res}`);
  }

  // read results
  if (otherOptions?.raw) {
    return response.text();
  }
  else {
    return response.json();
  }
}
