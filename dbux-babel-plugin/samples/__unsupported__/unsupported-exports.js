
// named exports with es6 argument destructuring is not supported yet.
// possibly solution: get relevant helpers to destructure from existing babel plugins.
export const [a, { x: c }, ...d] = [1, { x: 2 }, 3, 4, 5];