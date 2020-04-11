import Project from '@/projectLib/Project';
import ExpressInstaller from './Installer';

export default class ExpressProject extends Project {
  static Installer = ExpressInstaller;

  constructor() {
    super('BugsJsExpress');
  }
}