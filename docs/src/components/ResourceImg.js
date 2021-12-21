import React from 'react';

import useResourceSrc from '../hooks/useResourceSrc';

/**
 * Image from a resources/light or resources/dark folder.
 * 
 * @see https://docusaurus.io/docs/api/themes/configuration#hooks
 */
export default function ResourceImg({ src, ...moreProps }) {
  const actualSrc = useResourceSrc({ src });

  return (
    <img src={actualSrc} alt={src} {...moreProps} />
  );
}