import React from 'react';
// import useBaseUrl from '../hooks/useBaseUrl';

const codeBaseUrl = 'https://github.com/Domiii/dbux/tree/master/';

const pkgNames = {
  'dbux-code': 'Dbux VSCode Extension'
};

function join(a, b) {
  return `${(a && b) && `${a}/` || a || ''}${b || ''}`;
}

function getPrettyPath(path) {
  const name = pkgNames[path];
  if (name) {
    return name;
  }

  // hackfix stuff
  if (path.startsWith('dbux-') && !path.startsWith('dbux-code')) {
    return `@dbux/${path.substring(5)}`;
  }

  return path;
}

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
