import ClassMethod from './ClassMethod';

/**
 * 
 */
export default class ClassPrivateMethod extends ClassMethod {
  static children = [
    'key',
    'params',
    'body'
  ];
  static plugins = [
    'Function',
    'StaticContext'
  ];
}