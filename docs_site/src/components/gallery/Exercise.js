import React from 'react';
import PDGLink from './PDGLink';

export default function Exercise(props) {
  const { exercise } = props;
  const { id, ddgs } = exercise;
  if (!Array.isArray(ddgs)) {
    return <a className="text-danger" title={ddgs.error}>{id}</a>;
  }
  return <>
    {ddgs.map(renderData => {
      return <PDGLink key={renderData.id} pdgId={renderData.id}>{id}</PDGLink>;
    })}
  </>;
}
