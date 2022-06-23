import React from 'react';
import Exercise from './Exercise';

export default function Chapter(props) {
  const { chapter } = props;
  const { name, exercises } = chapter;
  return <>
    <h2>{name}</h2>
    {exercises.map(exercise => {
      return <Exercise key={exercise.id} exercise={exercise}></Exercise>;
    })}
  </>;
}
