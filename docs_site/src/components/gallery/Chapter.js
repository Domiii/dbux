import React from 'react';
import Exercise from './Exercise';

export default function Chapter(props) {
  const { chapter } = props;
  const { name, exercises } = chapter;
  return <div className="container">
    <h3>{name}</h3>
    {exercises.map(exercise => {
      return <Exercise key={exercise.id} exercise={exercise}></Exercise>;
    })}
  </div>;
}
