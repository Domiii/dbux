import React, { useEffect, useState } from 'react';
import { useLocation } from '@docusaurus/router';
import PDG from '@comp/gallery/PDG';
// import useGraphs from '@src/hooks/useGraphs';

/**
 * @see https://getbootstrap.com/docs/5.2/getting-started/contents/#css-files
 */
import 'bootstrap/dist/css/bootstrap-grid.css';
import 'bootstrap/dist/css/bootstrap-utilities.css';
import { parsePdgLinkId } from '../../../pdgUtil';

export default function pdg() {
  const pdgLinkId = useLocation().hash.substring(1);
  // const graphs = useGraphs();
  // const renderData = graphs.getById(pdgId);
  const [sampleData, setSampleData] = useState(null);
  
  const linkData = parsePdgLinkId(decodeURIComponent(pdgLinkId));

  useEffect(() => {
    (async () => {
      // const chapterGroup = 'sorting';
      // const chapter = 'bubble-sort';
      // const exerciseId = 'javascript-algorithms#31';
      const {
        chapterGroup,
        chapter,
        exercise: exerciseId,
        ddgTitle
      } = linkData;
      const rawData = await import(`../../../data/gallery/pdg/${chapterGroup}/${chapter}/${exerciseId}/pdgData.json`);
      const selected = rawData.default.find(d => d.ddgTitle === ddgTitle);

      document.title = 'Dbux-PDG: ' + linkData.ddgTitle;
      
      setSampleData({
        chapterGroup: chapterGroup,
        chapter: chapter,
        exerciseId,
        ddgTitle,
        renderData: selected,
      });
    })();
  }, []);

  if (!linkData) {
    return <span className="danger">404 - invalid link: ${pdgLinkId}</span>;
  }

  if (!sampleData) {
    return 'loading...';
  }

  if (!sampleData.renderData) {
    return <span className="danger">404 - invalid link - could not find PDG of title "{linkData.ddgTitle}"</span>;
  }

  // console.log('renderData', sampleData);

  return <PDG {...sampleData}></PDG>;
}
