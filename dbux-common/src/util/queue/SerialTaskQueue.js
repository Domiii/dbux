
export default class SerialTaskQueue {


  
  /**
   * Takes given function and returns a new function that is wrapped s.t.
   * when called, it adds itself as task and executes synchronously with this queue.
   * Returns a promise that is resolved once it has finished execution with it's original return value.
   */
  synchronizedFunction(fn) {
    
  }
}