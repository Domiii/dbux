import React from 'react';
import PDGLink from './PDGLink';

export default function Exercise(props) {
  const { exercise } = props;
  const { id, ddgs } = exercise;
  return <>
    <h2>{id}</h2>
    {ddgs.map(ddg => {
      return <PDGLink key={ddg.id} pdgId={ddg.id}>{ddg.id}</PDGLink>;
    })}
  </>;
}
