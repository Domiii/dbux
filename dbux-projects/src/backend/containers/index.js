import UserEventContainer from './UserEventContainer';
import TestContainer from './testContainer';

const ContainerClasses = [
  UserEventContainer,
  TestContainer,
];

let containers = [];

export async function initContainers(db) {
  await Promise.all(ContainerClasses.map(ContainerClass => {
    let container = new ContainerClass(db);
    containers.push(container);
    return container.init();
  }));

  return containers;
}