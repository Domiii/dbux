export default function ({ types: t }) {
  const before = t.expressionStatement(t.stringLiteral('before'));
  const after = t.expressionStatement(t.stringLiteral('after'));

  return {
    visitor: {
      Program() {
        console.log('[PLUGIN]', 'dbux');
      },
      Function(path) {
        const { node } = path;
        const line = node.loc?.start?.line;

        if (!line) {
          // this node has been dynamically emitted; not part of the original source code
          return;
        }
        path.get('body').unshiftContainer('body', before);
        path.get('body').pushContainer('body', after);
      }
    }
  };
}