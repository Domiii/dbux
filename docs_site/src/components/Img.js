import React from 'react';
import c from 'classnames';


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
export default function Img({ src, title, zoomable, darkLight, screen, className, ...moreProps }) {
  if (screen) {
    if (!src.startsWith('screen') && !src.startsWith('/') && !src.includes('://')) {
      src = `screens/${src}`;
    }
  }
  const actualSrc = useResourceSrc({ src, darkLight });
  // const actualSrc = src;

  title = title || src;
  const alt = title;

  className = c(
    className,
    {
      'border-screen': screen,
      zoomable
    }
  );

  return (
    // <Image img={actualSrc} {...moreProps} />
    <img className={className} src={actualSrc} alt={alt} title={title} {...moreProps} />
  );
}
