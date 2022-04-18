/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';
import { Redirect, useLocation } from '@docusaurus/router';
import useBaseUrl from '../hooks/useBaseUrl';
import useBaseRelativePath from '../hooks/useBaseRelativePath';

/**
 * 
 */
const redirects = {
  'runtime-analysis': 'dynamic-analysis'
};

/**
 * Given `redirects = { 'a': 'b' }` and `url = /basePath/a/x/y`, this redirects to `/basePath/b/x/y`.
 * NOTE: Hackfix support for sub-route redirects.
 */
function useMaybeRedirect() {
  const baseUrl = useBaseUrl();
  const relativePath = useBaseRelativePath();
  const rootPath = relativePath.length ? relativePath.split('/', 1) : null;
  if (rootPath) {
    const redirect = redirects[rootPath];
    if (redirect) {
      const newPath = relativePath.replace(rootPath, redirect);
      return `${baseUrl}${newPath}`;
    }
  }
  return null;
}

/**
 * Swizzle for 404.
 * 
 * @see https://github.com/facebook/docusaurus/discussions/6030
 */
function NotFound() {
  const redirect = useMaybeRedirect();
  if (redirect) {
    // custom redirect
    return <Redirect to={redirect} />;
  }
  const relativePath = useBaseRelativePath();

  // default 404
  return (
    <Layout
      title={translate({
        id: 'theme.NotFound.title',
        message: 'Page Not Found',
      })}>
      <main className="container margin-vert--xl">
        <div className="row">
          <div className="col col--6 col--offset-3">
            <h1 className="hero__title">
              <Translate
                id="theme.NotFound.title"
                description="The title of the 404 page">
                Page Not Found
              </Translate>
              <pre>{relativePath}</pre>
            </h1>
            <p>
              <Translate
                id="theme.NotFound.p1"
                description="The first paragraph of the 404 page">
                We could not find what you were looking for.
              </Translate>
            </p>
            <p>
              <Translate
                id="theme.NotFound.p2"
                description="The 2nd paragraph of the 404 page">
                Please contact the owner of the site that linked you to the
                original URL and let them know their link is broken.
              </Translate>
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}

export default NotFound;
