import React from 'react';
import isString from 'lodash/isString';

export default function HSpace({ space }) {
  if (space) {
    space = !isString(space) ? `${space}px` : space;
    
    return (<div style={{ marginRight: space }} />);
  }
  else {
    return (<div className="mr-05" />);
  }
}