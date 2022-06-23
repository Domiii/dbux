import React from 'react';
import { useLocation } from '@docusaurus/router';
import PDG from '@comp/gallery/PDG';
import graphs from '@src/data/gallery/pdg/graphs';


// import 'bootstrap';
import 'bootstrap/dist/css/bootstrap-grid.css';
import 'bootstrap/dist/css/bootstrap-utilities.css';

const pdgById = new Map();
for (const chapterGroup of graphs.chapterGroups) {
  for (const chapter of chapterGroup.chapters) {
    for (const exercise of chapter.exercises) {
      for (const renderData of exercise.ddgs) {
        const { uniqueId, ...otherProps } = renderData;
        pdgById.set(renderData.id, {
          chapterGroup: chapterGroup.name,
          chapter: chapter.name,
          exerciseId: exercise.id,
          renderData: otherProps,
        });
      }
    }
  }
}

export default function pdg() {
  const pdgIdString = useLocation().hash.substring(1);
  const pdgId = parseInt(pdgIdString, 10);

  return <div className="container">
      <PDG {...pdgById.get(pdgId)}></PDG>
  </div>;
}
