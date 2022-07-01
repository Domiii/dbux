import React from 'react';
import PDGLink from './PDGLink';

export default function Exercise(props) {
  const { chapterGroup, chapter, exercise } = props;
  const { pdgs } = exercise;

  function copyPDGArgs(renderData) {
    navigator.clipboard.writeText(JSON.stringify({
      exerciseName: exercise.name,
      pdgTitle: renderData.pdgTitle
    }, null, 2));
  }

  if (!Array.isArray(pdgs)) {
    return <p className="text-danger">{pdgs.failedReason}</p>;
  }

  return <ul>
    {pdgs.map(renderData => {
      const linkData = {
        chapterGroup,
        chapter,
        exercise: exercise.id,
        pdgTitle: renderData.pdgTitle
      };

      if (renderData.success !== false) {
        return <li key={renderData.id}>
          <PDGLink linkData={linkData}>{renderData.pdgTitle}</PDGLink>
          <button className="ms-2" onClick={() => copyPDGArgs(renderData)}>copy</button>
        </li>;
      }
      else {
        return <li key={renderData.id}>
          <PDGLink linkData={linkData} className="text-danger">success: false, {renderData.failedReason}</PDGLink>
        </li>;
      }
    })}
  </ul>;
}
