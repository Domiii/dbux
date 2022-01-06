import React from 'react';
import { getPrettyPath } from '../util/docPaths';
// import useBaseUrl from '../hooks/useBaseUrl';

const codeBaseUrl = 'https://github.com/Domiii/dbux/tree/master/';

export default function CodeLink(props) {
  let { path, children, title, ...moreProps } = props;
  if (!path) {
    throw new Error(`invalid <CodeLink /> missing "path". - props: ${JSON.stringify(props, null, 2)}`);
  }

  const prettyPath = getPrettyPath(path);
  children = children || prettyPath;
  title = title || children;

  const href = `${codeBaseUrl}${path}`; // join(pkg, path)

  return (
    <a title={title} href={href} {...moreProps}>{children}</a>
  );
}
