import fs from 'fs';
import moduleAlias from 'module-alias';

export default function linkDependencies(deps) {
  // console.debug('[DBUX linkDependencies]', deps.map(([alias, target]) => `"${alias}" -> "${target}"`));
  for (let [alias, target] of deps) {
    target = fs.realpathSync(target);
    moduleAlias.addAlias(alias, target);
    // console.debug(alias, '<-', fs.realpathSync(require.resolve(alias)));
    // require(alias);
  }
}