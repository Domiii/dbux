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

/**
 * hackfix: hard-coded this since old data does not contain DDGSummaryMode data yet
 * @see @dbux/data/src/ddg/DDGSummaryMode.js
 */
const SummaryModeIcons = [
  '⛒',
  'ExpandSelf',
  '1️⃣',
  '2️⃣',
  '3️⃣',
  '4️⃣',
  'ExpandSubgraph',
];

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
      <JSALink loc={testLoc} target="_blank">Test file link</JSALink>
      <div className="space-1"></div>
      <JSALink loc={algoLoc} target="_blank">Algorithm link</JSALink>
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
      <button className="border-gray" onClick={() => setIndex(index - 1)} disabled={index === 0}>
        &lt;
      </button>
      <button className="border-gray" onClick={() => setIndex(index + 1)} disabled={index === screenshots.length - 1}>
        &gt;
      </button>

      {screenshots.map((v, i) => {
        return <button key={i} className={"mx-1 p-2" + ((i === index) ? " active" : "")} onClick={() => setIndex(i)}>{SummaryModeIcons[i]}</button>;
      })}
    </div>;
  }
  else {
    paginationEl = null;
  }
  const previousPdgId = graphs.getPreviousId(pdgId);
  const nextPdgId = graphs.getNextId(pdgId);

  return <>
    <div className="flex flex-col h-full">
      <div className="container">
        <h3 className="my-2">
          <PDGLink title="Previous exercise" pdgId={previousPdgId}>
            <button className="p-2" disabled={!previousPdgId}>&laquo;</button>
          </PDGLink>
          <PDGLink title="Next exercise" pdgId={nextPdgId}>
            <button className="p-2" disabled={!nextPdgId}>&raquo;</button>
          </PDGLink>
          <div className="space-1"></div>
          {chapterGroup}/{chapter} &gt; {renderData.ddgTitle}
        </h3>
        <div className="d-flex flex-row">
          {paginationEl}
          <div className="space-1"></div>
          {linksEl}
          <div className="space-1"></div>
        </div>
      </div>

      <div className="mt-3 border of-hidden border-white" key={index}>
        {graphContentEl}
      </div>
    </div>
  </>;
}
