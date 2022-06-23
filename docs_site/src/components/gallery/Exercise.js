import React from 'react';
import PDGLink from './PDGLink';

export default function Exercise(props) {
  const { exercise } = props;
  const { id, ddgs } = exercise;
  if (!Array.isArray(ddgs)) {
    return null;
  }
  return <ul>
    {ddgs.map(renderData => {
      return <li key={renderData.id}><PDGLink pdgId={renderData.id}>{id}</PDGLink></li>;
    })}
  </ul>;
}
