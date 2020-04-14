import Project from '../../projectLib/Project';
import ExpressRunner from './Runner';

export default class ExpressProject extends Project {
  static Installer = ExpressRunner;
  folderName = 'express';
}