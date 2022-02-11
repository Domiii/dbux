import React from 'react';
import c from 'classnames';
import isString from 'lodash/isString';


/**
 * @see https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-ideal-image
 */
// import Image from '@theme/IdealImage';

import useResourceSrc from '../hooks/useResourceSrc';

function isSrcAbsolute(src) {
  return src.startsWith('/') || src.includes('://');
}

/**
 * Image from a resources/light or resources/dark folder.
 * 
 * @see https://docusaurus.io/docs/api/themes/configuration#hooks
 */
export default function Img({ src, title, zoomable, darkLight, screen, concept, className, maxWidth, mb, style, ...moreProps }) {
  if (concept) {
    if (!src.startsWith('concept') && !isSrcAbsolute(src)) {
      src = `concepts/${src}`;
    }
  }
  if (screen) {
    if (!src.startsWith('screen') && !isSrcAbsolute(src)) {
      src = `screens/${src}`;
    }
  }

  const canBeBig = concept || screen || zoomable;

  if (canBeBig) {
    if (zoomable === undefined) {
      zoomable = true;
    }
  }

  const actualSrc = useResourceSrc({ src, darkLight });
  // const actualSrc = src;

  title = title || src;
  const alt = title;

  // const hasDiv = !!maxWidth;

  className = c(
    className,
    {
      'border-screen': canBeBig,
      'img-crisp': canBeBig,
      zoomable,
      // 'mb-1': hasDiv && !mb
    }
  );

  let img = <img className={className} style={style} src={actualSrc} alt={alt} title={title} {...moreProps} />;

  if (maxWidth) {
    maxWidth = !isString(maxWidth) ? `${maxWidth}px` : maxWidth;
    mb = mb === undefined ? 'mb-2' : mb;
    const divClass = c(
      mb
    );
    /**
     * Keep image responsive.
     * 
     * @see https://stackoverflow.com/questions/50193946/responsive-image-with-max-height-max-width/50194061
     */
    const containerStyle = {
      display: 'inline-block',
      maxWidth,
      lineHeight: 0
      //   /**
      //    * @see https://stackoverflow.com/a/65690408
      //    */
      //   // objectFit: 'contain',
    };

    img = (
      <div className={divClass} style={containerStyle}>{img}</div>
    );
  }

  return img;
}
