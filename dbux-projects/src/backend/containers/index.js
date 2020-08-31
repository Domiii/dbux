import UserEventContainer from './UserEventContainer';

const ContainerClasses = [
  UserEventContainer
];

let containers;

export function createContainers(db) {
  return containers = ContainerClasses.map(ContClazz => {
    return new ContClazz(db);
  });
}

export async function initContainers(db) {
  if (!containers) {
    createContainers(db);
  }
  return Promise.all(containers.map(container => {
    return container.init();
  }));
}