import React from 'react';
import useBaseUrl from '../../hooks/useBaseUrl';

// const codeBaseUrl = 'https://github.com/Domiii/dbux/tree/master/';
const PDGBaseUrl = 'gallery/pdg/pdg';

export default function PDGLink(props) {
  const { pdgId, children, title } = props;

  const baseUrl = useBaseUrl();

  const href = `${baseUrl}${PDGBaseUrl}#${pdgId}`; // join(pkg, path)

  return (
    <a title={title} href={href}>{children}</a>
  );
}
