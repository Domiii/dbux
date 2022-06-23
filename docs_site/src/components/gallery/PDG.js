import React, { useState } from 'react';
import { useLocation } from '@docusaurus/router';
import GraphvizDot from './GraphvizDot';
import JSALink from './JSALink';
import PDGLink from './PDGLink';

function getDot(screenshots, index) {
  const screenshot = screenshots[index];
  if (screenshot.dot) {
    return screenshot.dot;
  }
  else if ('sameAs' in screenshot) {
    return getDot(screenshots, screenshot.sameAs);
  }
  else {
    return null;
  }
}

export default function PDG(props) {
  const pdgIdString = useLocation().hash.substring(1);
  const pdgId = parseInt(pdgIdString, 10);
  const { chapterGroup, chapter, exerciseId, renderData } = props;
  const { testLoc, algoLoc, screenshots } = renderData;

  const [index, setIndex] = useState(0);

  const dot = getDot(screenshots, index);

  const success = renderData.success !== false;

  return <>
    <div className="container">
      <h1 className="my-2">
        <PDGLink pdgId={pdgId - 1}>
          <button className="mx-4 p-2">&laquo;</button>
        </PDGLink>
        {exerciseId}

        <PDGLink pdgId={pdgId + 1}>
          <button className="mx-4 p-2">&raquo;</button>
        </PDGLink>
      </h1>
      <p>
        Chapter: {chapterGroup}/{chapter}
      </p>

      {
        success && <>
          <p><JSALink loc={testLoc} target="_blank">Test file link</JSALink></p>
          <p><JSALink loc={algoLoc} target="_blank">Algorithm link</JSALink></p>
        </>
      }

      <div className="d-flex flex-row">
        <button className="mx-1 p-2" onClick={() => setIndex(index - 1)} disabled={index === 0}>&laquo;</button>
        {screenshots.map((v, i) => {
          return <button key={i} className="mx-1 p-2" onClick={() => setIndex(i)}>{i}</button>;
        })}
        <button className="mx-1 p-2" onClick={() => setIndex(index + 1)} disabled={index === screenshots.length - 1}>&raquo;</button>
      </div>
    </div>

    <div className="mt-3 vh-100 overflow-hidden border border-white" key={index}>
      {
        success ?
          <GraphvizDot dot={dot} exerciseId={exerciseId} index={index}></GraphvizDot> :
          <p>{renderData.error}</p>
      }
    </div>
  </>;
}
