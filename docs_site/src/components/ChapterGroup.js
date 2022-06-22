import React from 'react';
import Chapter from './Chapter';

export default function ChapterGroup(props) {
  const { chapterGroup } = props;
  const { name, chapters } = chapterGroup;
  return <>
    <h2>{name}</h2>
    {chapters.map(chapter => {
      return <Chapter key={chapter.name} chapter={chapter}></Chapter>;
    })}
  </>;
}
