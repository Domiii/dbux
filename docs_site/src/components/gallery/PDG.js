import React, { useState } from 'react';
import { useLocation } from '@docusaurus/router';
import useGraphs from '@src/hooks/useGraphs';
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
  const pdgId = useLocation().hash.substring(1);
  const [index, setIndex] = useState(0);
  const graphs = useGraphs();
  const { chapterGroup, chapter, exerciseId, renderData } = props;

  if (exerciseId === undefined) {
    return <h1>pdgId "{pdgId}" not found</h1>;
  }

  const success = renderData.success !== false;
  const { testLoc, algoLoc, screenshots } = renderData;

  // linksEl
  let linksEl;
  if (success) {
    linksEl = <>
      <p><JSALink loc={testLoc} target="_blank">Test file link</JSALink></p>
      <p><JSALink loc={algoLoc} target="_blank">Algorithm link</JSALink></p>
    </>;
  }
  else {
    linksEl = null;
  }

  // graphEl
  let graphContentEl;
  if (success) {
    const { dot, sameAs } = screenshots[index];
    if (dot) {
      graphContentEl = <GraphvizDot dot={dot} exerciseId={exerciseId} index={index}></GraphvizDot>;
    }
    else if (sameAs !== undefined) {
      const originIndex = getSameAsOrigin(screenshots, index);
      graphContentEl = <h1 className="mt-4 text-center">
        Graph same as {originIndex}
        <button className="mx-4 p-2" onClick={() => setIndex(originIndex)}>Go</button>
      </h1>;
    }
    else {
      throw new Error(`Invalid screenshot missing "dot" or "sameAs", ${JSON.stringify(screenshots[index])}`);
    }
  }
  else {
    graphContentEl = <>
      <h1 className="mt-4 text-center">{renderData.failedReason}</h1>
      <pre className="">{renderData.error}</pre>
    </>;
  }

  // paginationEl
  let paginationEl;
  if (success) {
    paginationEl = <div className="d-flex flex-row">
      <button className="mx-1 p-2" onClick={() => setIndex(index - 1)} disabled={index === 0}>&laquo;</button>
      {screenshots.map((v, i) => {
        return <button key={i} className={"mx-1 p-2" + ((i === index) ? " active" : "")} onClick={() => setIndex(i)}>{i}</button>;
      })}
      <button className="mx-1 p-2" onClick={() => setIndex(index + 1)} disabled={index === screenshots.length - 1}>&raquo;</button>
    </div>;
  }
  else {
    paginationEl = null;
  }
  const previousPdgId = graphs.getPreviousId(pdgId);
  const nextPdgId = graphs.getNextId(pdgId);

  return <>
    <div className="container">
      <h1 className="my-2">
        <PDGLink title="Previous exercise" pdgId={previousPdgId}>
          <button className="p-2" disabled={!previousPdgId}>&laquo;</button>
        </PDGLink>
        <PDGLink title="Next exercise" pdgId={nextPdgId}>
          <button className="mx-4 p-2" disabled={!nextPdgId}>&raquo;</button>
        </PDGLink>
        {renderData.ddgTitle}
      </h1>
      <p>
        Chapter: {chapterGroup}/{chapter}
      </p>
      {linksEl}
      {paginationEl}
    </div>

    <div className="mt-3 vh-100 overflow-hidden border border-white" key={index}>
      {graphContentEl}
    </div>
  </>;
}
