import React from 'react';
import { Redirect, useLocation } from '@docusaurus/router';

const oldRoute = 'runtime-analysis';
const newRoute = 'features';

// This page re-routes any request of `page-x/a/b/c` to `page-y/a/b/c`.

export default function RuntimeAnalysis() {
  const location = useLocation();
  const { pathname } = location;
  const to = pathname.replace(oldRoute, newRoute);    // replace first occurrence of oldRoute
  return <Redirect to={to} />;
}
