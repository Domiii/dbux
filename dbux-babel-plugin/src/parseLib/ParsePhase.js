import Enum from '@dbux/common/src/util/Enum';


// eslint-disable-next-line import/no-mutable-exports
let ParsePhase = {
  Init: 1,
  /**
   * Visited as part of Babel's AST traversal `enter` phase: outer-to-inner.
   */
  Enter: 2,
  /**
   * Visited as part of Babel's AST traversal `exit` phase: inner-to-outer.
   * Generates `genTasks` in the same order.
   */
  Exit1: 3,

  /**
   * Called as pre-step to instrumentation on all `genTasks` in "Exit order": inner-to-outer.
   */
  Exit: 4,
  /**
   * Called after `Exit` in the same order.
   */
  Instrument1: 5,
  /**
   * Called after `Instrument1` in the same order.
   */
  Instrument: 6
};

ParsePhase = new Enum(ParsePhase);


export default ParsePhase;