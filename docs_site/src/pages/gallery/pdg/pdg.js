import React, { useEffect, useState } from 'react';
import { useLocation } from '@docusaurus/router';
import PDG from '@comp/gallery/PDG';
// import useGraphs from '@src/hooks/useGraphs';

/**
 * @see https://getbootstrap.com/docs/5.2/getting-started/contents/#css-files
 */
import 'bootstrap/dist/css/bootstrap-grid.css';
import 'bootstrap/dist/css/bootstrap-utilities.css';

export default function pdg() {
  const pdgId = useLocation().hash.substring(1);
  // const graphs = useGraphs();
  // const renderData = graphs.getById(pdgId);
  const [sampleData, setSampleData] = useState(null);

  useEffect(() => {
    (async () => {
      const chapterGroup = 'sorting';
      const chapter = 'bubble-sort';
      const exerciseId = 'javascript-algorithms#31';
      const rawData = await import(`../../../data/gallery/pdg/${chapterGroup}/${chapter}/${exerciseId}/pdgData.json`);
      setSampleData({
        chapterGroup: chapterGroup,
        chapter: chapter,
        exerciseId,
        renderData: rawData.default[0],
      });
    })();
  }, []);

  if (!sampleData) {
    return 'loading...';
  }

  console.log('renderData', sampleData);

  return <PDG {...sampleData}></PDG>;
}
