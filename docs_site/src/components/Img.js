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
export default function Img({ src, title, zoomable, darkLight, screen, concept, className, maxWidth, style, ...moreProps }) {
  if (concept) {
    if (!src.startsWith('concept') && !src.startsWith('/') && !src.includes('://')) {
      src = `concepts/${src}`;
    }
  }
  if (screen) {
    if (!src.startsWith('screen') && !src.startsWith('/') && !src.includes('://')) {
      src = `screens/${src}`;
    }
  }

  const canBeBig = concept || screen;

  if (canBeBig) {
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
      'border-screen': canBeBig,
      zoomable
    }
  );

  let img = <img className={className} style={style} src={actualSrc} alt={alt} title={title} {...moreProps} />;

  if (maxWidth) {
    maxWidth = !isString(maxWidth) ? `${maxWidth}px` : maxWidth;
    /**
     * Keep image responsive.
     * 
     * @see https://stackoverflow.com/questions/50193946/responsive-image-with-max-height-max-width/50194061
     */
    const containerStyle = {
      display: 'inline-block',
      maxWidth
      //   /**
      //    * @see https://stackoverflow.com/a/65690408
      //    */
      //   // objectFit: 'contain',
    };

    img = (
      <div style={containerStyle}>{img}</div>
    );
  }

  return img;
}
