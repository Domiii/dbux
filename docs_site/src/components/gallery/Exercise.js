import React from 'react';
import PDGLink from './PDGLink';

export default function Exercise(props) {
  const { chapterGroup, chapter, exercise } = props;
  const { ddgs } = exercise;

  if (!Array.isArray(ddgs)) {
    return <p>{ddgs.failedReason}</p>;
  }

  return <>
    {ddgs.map(renderData => {
      const linkData = {
        chapterGroup,
        chapter,
        exercise: exercise.id,
        ddgTitle: renderData.ddgTitle
      };

      if (renderData.success !== false) {
        return <PDGLink key={renderData.id} linkData={linkData}>{renderData.ddgTitle}</PDGLink>;
      }
      else {
        return <PDGLink key={renderData.id} linkData={linkData} className="text-danger">Failed: {renderData.failedReason}</PDGLink>;
      }
    })}
  </>;
}
