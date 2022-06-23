import React from 'react';
import ChapterGroup from '@comp/gallery/ChapterGroup';
import useGraphs from '@src/hooks/useGraphs';

/**
 * @see https://getbootstrap.com/docs/5.2/getting-started/contents/#css-files
 */
import 'bootstrap/dist/css/bootstrap-grid.css';
import 'bootstrap/dist/css/bootstrap-utilities.css';

export default function App() {
  const graphs = useGraphs();

  return <div className="container">
    <h1>PDG graphs</h1>
    {graphs.chapterGroups.map(chapterGroup => {
      return <ChapterGroup key={chapterGroup.name} chapterGroup={chapterGroup}></ChapterGroup>;
    })}
  </div>;
}
