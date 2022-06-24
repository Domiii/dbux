import React from 'react';
import PDGLink from './PDGLink';

export default function Exercise(props) {
  const { exercise } = props;
  const { ddgs } = exercise;

  if (!Array.isArray(ddgs)) {
    return <p>{ddgs.failedReason}</p>;
  }

  return <>
    {ddgs.map(renderData => {
      if (renderData.success !== false) {
        return <PDGLink key={renderData.id} pdgId={renderData.id}>{renderData.ddgTitle}</PDGLink>;
      }
      else {
        return <PDGLink key={renderData.id} pdgId={renderData.id} className="text-danger">Failed: {renderData.failedReason}</PDGLink>;
      }
    })}
  </>;
}
