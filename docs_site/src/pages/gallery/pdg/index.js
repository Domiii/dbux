import React from 'react';
import graphs from '../../../data/gallery/pdg/graphs';
import ChapterGroup from '../../../components/ChapterGroup';

export default function App() {
  return <>
    <h1>PDG graphs</h1>
    {graphs.chapterGroups.map(chapterGroup => {
      return <ChapterGroup key={chapterGroup.name} chapterGroup={chapterGroup}></ChapterGroup>;
    })}
  </>;
}
