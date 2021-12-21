import React from 'react';


/**
 * @see https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-ideal-image
 */
// import Image from '@theme/IdealImage';

import useResourceSrc from '../hooks/useResourceSrc';

/**
 * Image from a resources/light or resources/dark folder.
 * 
 * @see https://docusaurus.io/docs/api/themes/configuration#hooks
 */
export default function Img({ src, zoomable, ...moreProps }) {
  const actualSrc = useResourceSrc({ src, noLightMode: true });
  // const actualSrc = src;
  const className = zoomable ? 'zoomable' : '';

  return (
    // <Image img={actualSrc} {...moreProps} />
    <img className={className} src={actualSrc} alt={src} {...moreProps} />
  );
}
