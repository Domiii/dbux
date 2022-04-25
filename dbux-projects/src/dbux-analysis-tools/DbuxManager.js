export default class DbuxManager {

}

let manager;

// TODO: rewrite-as-plugin
export function initDbuxManager(_manager) {
  manager = _manager;
}

export function getDbuxManager() {
  return manager;
}
