import UserEventContainer from './UserEventContainer';

const Containers = [
  UserEventContainer
];

export async function initContainers(db) {
  return Promise.all(Containers.map(ContClazz => {
    const container = new ContClazz(db);
    return container.init();
  }));
}