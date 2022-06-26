import React from 'react';
import PDGLink from './PDGLink';

export default function Exercise(props) {
  const { chapterGroup, chapter, exercise } = props;
  const { ddgs } = exercise;

  function copyDDGArgs(renderData) {
    navigator.clipboard.writeText(JSON.stringify({
      exerciseName: exercise.name,
      ddgTitle: renderData.ddgTitle
    }, null, 2));
  }

  if (!Array.isArray(ddgs)) {
    return <p className="text-danger">{ddgs.failedReason}</p>;
  }

  return <ul>
    {ddgs.map(renderData => {
      const linkData = {
        chapterGroup,
        chapter,
        exercise: exercise.id,
        ddgTitle: renderData.ddgTitle
      };

      if (renderData.success !== false) {
        return <li key={renderData.id}>
          <PDGLink linkData={linkData}>{renderData.ddgTitle}</PDGLink>
          <button className="ms-2" onClick={() => copyDDGArgs(renderData)}>copy</button>
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
