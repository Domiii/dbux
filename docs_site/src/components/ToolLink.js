import React from 'react';
import { getPrettyPath } from '../util/docPaths';
import useBaseUrl from '../hooks/useBaseUrl';

// const codeBaseUrl = 'https://github.com/Domiii/dbux/tree/master/';
const toolsBaseUrl = 'tools-and-configuration/';

export default function ToolLink(props) {
  let { name, children, title, ...moreProps } = props;
  if (!name?.includes) {
    throw new Error(`Invalid ToolLink does not have a "name" of type string. - props: ${JSON.stringify(props, null, 2)}`);
  }
  if (name.includes('/')) {
    throw new Error(`ToolLink's "name" must not be a path. - props: ${JSON.stringify(props, null, 2)}`);
  }
  if (!name) {
    throw new Error(`invalid <ToolLink /> missing "name". - props: ${JSON.stringify(props, null, 2)}`);
  }

  const prettyName = getPrettyPath(name);
  children = children || prettyName;
  title = title || children;

  const baseUrl = useBaseUrl();

  const href = `${baseUrl}${toolsBaseUrl}${name}`; // join(pkg, path)

  return (
    <a title={title} href={href} {...moreProps}>{children}</a>
  );
}
