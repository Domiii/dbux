import React from 'react';
import DDGExercise from './DDGExercise';

export default function Chapter(props) {
  const { chapter } = props;
  const { name, exercises } = chapter;
  return <>
    <h2>{name}</h2>
    {exercises.map(exercise => {
      return <DDGExercise key={exercise.id} exercise={exercise}></DDGExercise>;
    })}
  </>;
}
