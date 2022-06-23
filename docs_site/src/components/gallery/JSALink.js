import React from 'react';

const JSARepositoryBaseUrl = 'https://github.com/trekhleb/javascript-algorithms/blob/master';

function getJSAUrl(filePath, line) {
  // e.g. https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/graph/bellman-ford/bellmanFord.js#L35
  return `${JSARepositoryBaseUrl}/${filePath}#L${line}`;
}

export default function JSALink(props) {
  let { loc, children, title, ...moreProps } = props;
  if (!loc) {
    throw new Error(`Invalid <JSALink /> missing "loc". - props: ${JSON.stringify(props, null, 2)}`);
  }
  if (!loc.filePath) {
    throw new Error(`Invalid <JSALink /> missing "loc.filePath" of type string. - props: ${JSON.stringify(props, null, 2)}`);
  }
  if (!loc.loc?.start?.line) {
    throw new Error(`Invalid <JSALink /> missing "loc.start.line" of type string. - props: ${JSON.stringify(props, null, 2)}`);
  }

  const href = getJSAUrl(loc.filePath, loc.loc.start.line);

  return (
    <a title={title} href={href} {...moreProps}>{children}</a>
  );
}
