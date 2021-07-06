import ClassMethod from './ClassMethod';

/**
 * 
 */
export default class ClassPrivateMethod extends ClassMethod {
  get isPublic() {
    return false;
  }
}