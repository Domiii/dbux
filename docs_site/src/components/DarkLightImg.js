import React from 'react';

import Img from './Img';

/**
 * Image from a resources/light or resources/dark folder.
 * 
 * @see https://docusaurus.io/docs/api/themes/configuration#hooks
 */
export default function DarkLightImg({ ...moreProps }) {
  if (!('darkLight' in moreProps)) {
    moreProps.darkLight = true;
  }

  // moreProps.className = 'valign-middle';
  
  return (
    <Img {...moreProps} />
  );
}
