import React, { useState } from 'react';
import { useLocation } from '@docusaurus/router';
import GraphvizDot from './GraphvizDot';
import JSALink from './JSALink';
import PDGLink from './PDGLink';

// function getDot(screenshots, index) {
//   const screenshot = screenshots[index];
//   if (screenshot.dot) {
//     return screenshot.dot;
//   }
//   else if ('sameAs' in screenshot) {
//     return getDot(screenshots, screenshot.sameAs);
//   }
//   else {
//     return null;
//   }
// }

function getSameAsOrigin(screenshots, index) {
  const screenshot = screenshots[index];
  if ('sameAs' in screenshot) {
    return getSameAsOrigin(screenshots, screenshot.sameAs);
  }
  else {
    return index;
  }
}

export default function PDG(props) {
  const pdgIdString = useLocation().hash.substring(1);
  const pdgId = parseInt(pdgIdString, 10);
  const { chapterGroup, chapter, exerciseId, renderData } = props;
  const { testLoc, algoLoc, screenshots } = renderData;

  const [index, setIndex] = useState(0);

  // const dot = getDot(screenshots, index);
  const { dot, sameAs } = screenshots[index];
  let graph;
  if (dot) {
    graph = <GraphvizDot dot={dot} exerciseId={exerciseId} index={index}></GraphvizDot>;
  }
  else if (sameAs !== undefined) {
    const originIndex = getSameAsOrigin(screenshots, index);
    graph = <h1 className="mt-4 text-center">
      Graph same as {originIndex}
      <button className="mx-4 p-2" onClick={() => setIndex(originIndex)}>Go</button>
    </h1>;
  }
  else {
    throw new Error(`Invalid screenshot missing "dot" or "sameAs", ${JSON.stringify(screenshots[index])}`);
  }

  const success = renderData.success !== false;

  return <>
    <div className="container">
      <h1 className="my-2">
        <PDGLink title="Previous exercise" pdgId={pdgId - 1}>
          <button className="p-2">&laquo;</button>
        </PDGLink>
        <PDGLink title="Next exercise" pdgId={pdgId + 1}>
          <button className="mx-4 p-2">&raquo;</button>
        </PDGLink>
        {renderData.ddgTitle}
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
          return <button key={i} className={"mx-1 p-2" + ((i === index) ? " active" : "")} onClick={() => setIndex(i)}>{i}</button>;
        })}
        <button className="mx-1 p-2" onClick={() => setIndex(index + 1)} disabled={index === screenshots.length - 1}>&raquo;</button>
      </div>
    </div>

    <div className="mt-3 vh-100 overflow-hidden border border-white" key={index}>
      {
        success ?
          graph :
          <p>{renderData.error}</p>
      }
    </div>
  </>;
}
