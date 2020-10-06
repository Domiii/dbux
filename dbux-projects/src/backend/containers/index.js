import UserEventContainer from './UserEventContainer';
import Survey1Container from './Survey1Container';

const NormalContainerClasses = [
  Survey1Container,
];

const LoginContainerClasses = [
  UserEventContainer,
];

async function initContainers(db, ContainerClasses) {
  let containers = [];

  await Promise.all(ContainerClasses.map(ContainerClass => {
    let container = new ContainerClass(db);
    containers.push(container);
    return container.init();
  }));

  return containers;
}

export async function initNormalContainers(db) {
  return initContainers(db, NormalContainerClasses);
}

export async function initLoginContainers(db) {
  return initContainers(db, LoginContainerClasses);
}