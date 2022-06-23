import React from 'react';
import GraphvizDot from './GraphvizDot';
import JSALink from './JSALink';

export default function PDG(props) {
  const { chapterGroup, chapter, exerciseId, renderData } = props;
  const { testLoc, algoLoc, screenshots } = renderData;
  return <>
    <h1>{exerciseId}</h1>
    <p>Chapter: {chapterGroup}/{chapter}</p>

    <p><JSALink loc={testLoc} target="_blank">Test file link</JSALink></p>
    <p><JSALink loc={algoLoc} target="_blank">Algorithm link</JSALink></p>

    <div className="row">
      {screenshots.map((screenshot, index) => {
        return <div className="my-2 vh-100 overflow-hidden">
          <GraphvizDot key={index} dot={screenshot.dot}></GraphvizDot>
        </div>;
      })}
    </div>
  </>;
}
