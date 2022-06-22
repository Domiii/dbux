import React from 'react';

export default function DDGScreenshots(props) {
  const { ddg } = props;
  const { screenshots } = ddg;
  return <>
    {screenshots.map((screenshot, index) => {
      return <p key={index}>{screenshot.dot.slice(0, 100)}</p>;
    })}
  </>;
}
