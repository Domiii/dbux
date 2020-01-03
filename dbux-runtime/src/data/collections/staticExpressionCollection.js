let _instance;

/**
 * Keeps track of `StaticExpression` objects that contain static code information
 */
class StaticExpressionCollection {
  /**
   * @type {StaticProgramContext[]}
   */
  _expressions = [null];

  addAll(programData) {
    
  }

  getExpression(expressionId) {
    return this._expressions[expressionId];
  }
}

const staticProgramContextCollection = new StaticExpressionCollection();
export default staticProgramContextCollection;