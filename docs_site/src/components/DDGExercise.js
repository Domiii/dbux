import React from 'react';
import DDGScreenshots from './DDGScreenshots';

export default function DDGExercise(props) {
  const { exercise } = props;
  const { id, ddgs } = exercise;
  return <>
    <h2>{id}</h2>
    {ddgs.map(ddg => {
      return <DDGScreenshots key={ddg.id} ddg={ddg}></DDGScreenshots>;
    })}
  </>;
}
