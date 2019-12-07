import fsPath from 'path';

export default function ({ types: t }) {
  const before = t.expressionStatement(t.stringLiteral('before'));
  const after = t.expressionStatement(t.stringLiteral('after'));

  return {
    visitor: {
      Program(path, state) {
        console.log('[FILE]', fsPath.relative(state.cwd, state.filename));
      },
      Function(path, state) {
        // console.log('FUNCTION @', state.filename);

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