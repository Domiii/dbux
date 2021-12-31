import React from 'react';
import c from 'classnames';
import isString from 'lodash/isString';


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
export default function Img({ src, title, zoomable, darkLight, screen, className, maxWidth, style, ...moreProps }) {
  if (screen) {
    if (!src.startsWith('screen') && !src.startsWith('/') && !src.includes('://')) {
      src = `screens/${src}`;
    }
    if (zoomable === undefined) {
      zoomable = true;
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

  const s = {
    maxWidth: isString(maxWidth) ? `${maxWidth}px` : maxWidth,
    ...style
  };

  return (
    // <Image img={actualSrc} {...moreProps} />
    <img className={className} style={s} src={actualSrc} alt={alt} title={title} {...moreProps} />
  );
}
