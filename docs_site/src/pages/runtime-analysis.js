import React from 'react';
import { Redirect, useLocation } from '@docusaurus/router';

const oldRoute = 'runtime-analysis';
const newRoute = 'dynamic-analysis';

// TODO: make sure, `page-x/a/b/c` can be handled by `page-x`.

export default function RuntimeAnalysis() {
  const location = useLocation();
  const { pathname } = location;
  const to = pathname.replace(oldRoute, newRoute);    // replace first occurrence of oldRoute
  return <Redirect to={to} />;
}
