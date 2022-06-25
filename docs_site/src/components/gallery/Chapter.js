import React from 'react';
import Exercise from './Exercise';

export default function Chapter(props) {
  const { chapterGroup, chapter } = props;
  const { name, exercises } = chapter;
  return <div className="container">
    <h3>{name}</h3>
    <ul>
      {exercises.map(exercise => {
        return <li key={exercise.id}><Exercise chapterGroup={chapterGroup} chapter={name} key={exercise.id} exercise={exercise}></Exercise></li>;
      })}
    </ul>
  </div>;
}
