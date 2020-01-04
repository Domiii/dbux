import { logInternalError } from '../../log/logger';

let _instance;

/**
 * Keeps track of `StaticExpression` objects that contain static code information
 */
class StaticExpressionCollection {
  /**
   * @type {[]}
   */
  _staticExpressions = [null];

  addExpressions(programId, list) {
    // make sure, array is pre-allocated
    for (let i = this._staticExpressions.length; i <= programId; ++i) {
      this._staticExpressions.push(null);
    }

    // add program static expressions
    this._staticExpressions[programId] = list;

    for (let i = 1; i < list.length; ++i) {
      if (list[i].expressionId !== i) {
        logInternalError(programId, 'Invalid expressionId !== its own index:', list[i].expressionId, '!==', i);
      }
    }
  }

  getExpressions(programId) {
    return this._staticExpressions[programId];
  }

  getExpression(programId, staticExpresssionId) {
    const expressions = this.getExpressions(programId);
    if (!expressions) {
      logInternalError("Invalid programId has no registered static expressions:", programId);
      return null;
    }
    return expressions[staticExpresssionId];
  }
}

const staticProgramContextCollection = new StaticExpressionCollection();
export default staticProgramContextCollection;