import {
  Disposable,
  workspace,
  window
} from '@types/vscode/index.d.ts';

const ExtensionName : string = 'dbux-code';

/**
 * For VSCode Extension API samples, @see https://github.com/Microsoft/vscode-extension-samples/blob/master/configuration-sample/src/extension.ts
 * @param resource usually `document.uri`
 */
export function getConfig(resource) {
  const settings = workspace.getConfiguration(ExtensionName, resource);
}