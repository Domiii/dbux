import React from 'react';
import Chapter from './Chapter';

export default function ChapterGroup(props) {
  const { chapterGroup } = props;
  const { name, chapters } = chapterGroup;
  return <div className="container">
    <h2>{name}</h2>
    <div className="row">
      {chapters.map(chapter => {
        return <div key={chapter.name} className="col-6">
          <Chapter chapterGroup={name} chapter={chapter}></Chapter>
        </div>;
      })}
    </div>
  </div>;
}
