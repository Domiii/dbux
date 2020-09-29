import UserEventContainer from './UserEventContainer';
import Survey1Container from './Survey1Container';

const ContainerClasses = [
  UserEventContainer,
  Survey1Container,
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