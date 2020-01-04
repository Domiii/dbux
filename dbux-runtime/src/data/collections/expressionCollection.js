class Expression {
  static allocate() {
    // TODO: use object pooling
    return new Expression();
  }
}

class ExpressionCollection {
  _expressions = [];

  recordExpression(contextId, value, expressionId) {
    const expr = Expression.allocate();
    expr.contextId = contextId;
    expr.value = value;
    expr.expressionId = expressionId;

    this._expressions.push(expr);
    return expr;
  }
}

const expressionCollection = new ExpressionCollection();
export default expressionCollection;