import React from 'react';
import useBaseUrl from '../../hooks/useBaseUrl';
import { makePdgLinkId } from '../../pdgUtil';

// const codeBaseUrl = 'https://github.com/Domiii/dbux/tree/master/';
const PDGBaseUrl = 'gallery/pdg/pdg';

export default function PDGLink(props) {
  const { linkData, children, title, className } = props;

  const baseUrl = useBaseUrl();

  const linkId = makePdgLinkId(linkData);

  const href = `${baseUrl}${PDGBaseUrl}#${encodeURIComponent(linkId)}`; // join(pkg, path)

  return (
    <a title={title} href={href} className={className}>{children}</a>
  );
}
