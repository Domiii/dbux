# Contributing

import Img from '@src/components/Img';

## Code of Conduct

TODO

## Development + Contributing: Getting Started

### Prerequisites

* `bash`
   * On Windows, you can get this via cygwin or `git` (which also installs cygwin)
* [Volta](https://docs.volta.sh/guide/getting-started)
  * `Volta`, unlike `n` and `nvm`, is fully cross-platform.
  * We recommend using volta to manage `node`, `npm` and `yarn`. It is a breeze to work with, and makes version management child's play.
  * Make sure to delete `node`, `yarn` (and possibly `n` and `nvm` if you have it) first
  * Use `volta` to install `node` and `yarn`
    * node
       * we recommend `node@16` or higher for better support of source maps (node source map support used to be very slow before `node@16`).
    * yarn


### Setup

```sh
git clone https://github.com/Domiii/dbux.git
cd dbux
code dbux.code-workspace # open project in vscode
yarn install && yarn i # install dependencies
```

Finally, you might want to enable Dbux auto start by default:

<Img src="screens/dbux-auto-start-workspace-setting.png" />


If dependencies bug out, sometimes running the (very aggressive) clean-up command can help: `npm run dbux-reinstall` (of course we don't recommend this).


### Start development

1. Open project + start webpack
   ```sh
   code dbux.code-workspace # open project in vscode
   npm start # start webpack development build of all projects in watch mode
   ```
1. Go to your debug tab, select the `dbux-code` configuration and press F5 (runs dbux-code (VSCode extension) in debug mode)
1. Inside of the new window, you can then use the development version of `dbux-code`


### Adding dependencies

We use Lerna with Yarn workspaces, so instead of `npm i pkg`, we can do the following:

* Adding `pkg` to `@dbux/something` (where `dbux-something` is the folder containing the package `@dbux/something`):
   `npx lerna add --scope=@dbux/something pkg`
   `npx lerna add --scope=@dbux/common pkg`
   `npx lerna add --scope=dbux-code pkg      # note: dbux-code's package name has a dash (-), not a slash (/)!`


* Adding `pkg` as devDependency to the root:
   `yarn add --dev -W pkg`


### Using Dbux Local Development Build

If you want to use the local development build of Dbux in other folders, make sure to hard-link them.

E.g. on Windows:

```ps
mkdir ..\..\node_modules\@dbux
mklink /J ..\..\node_modules\@dbux\babel-plugin ..\..\..\dbux\dbux-babel-plugin
mklink /J ..\..\node_modules\@dbux\runtime ..\..\..\dbux\dbux-runtime
```


## Joining the Community

While you can certainly try to get started on your own, you probably make your life a lot easier by [join the dev team on Discord](https://discord.gg/8kR2a7h) first :)


## VSCode extension development

### Adding a command/button

(VSCode's buttons are representation of commands, you must add a command before adding a button)

1. Register command in `contributes.commands` section of package.json as following(title and icon are optional):

    ``` json
    {
      "commands": [
        {
          "command": "<COMMAND_ID>",
          "title": "<TITLE>",
          "icon": {
            "light": "<PATH_TO_YOUR_ICON>",
            "dark": "<PATH_TO_YOUR_ICON>"
          }
        }
      ]
    }
    ```

1. Bind the command with a callback function in js file:

    ``` js
    import { registerCommand } from './commands/commandUtil';
    registerCommand(context, '<COMMAND_ID>', callback);
    ```

1. Depends on whether the command should be shown in command palette, add the following to `contributes.menus.commandPalette` section in package.json:

    Show command in command palette
    (use `"when": "!dbux.context.activated"` instead if you want show it before dbux has been activated)

    ``` json
    {
      "commantPalette": [
        {
          "command": "<COMMAND_ID>",
          "when": "dbux.context.activated"
        }
      ]
    }
    ```

    Hide command from command palette

    ``` json
    {
      "commantPalette": [
        {
          "command": "<COMMAND_ID>",
          "when": "false"
        }
      ]
    }
    ```

1. Finally, configure where the button should be shown(skip this step if you don't want a button):

    To show button in...

    - navigation bar(upper-right corner), add the following to `contributes.menus.editor/title`
    
    ``` json
    {
      "editor/title": [
        {
          "command": "<COMMAND_ID>",
          "when": "dbux.context.activated",
          "group": "navigation"
        } 
      ] 
    }
    ```

    - tree view title, add the following to `contributes.menus.view/title`
      ( `<VIEW_ID>` is defined in `contributes.views.dbuxViewContainer` section)

    ``` json
    {
      "view/title": [
        {
          "command": "<COMMAND_ID>",
          "when": "view == <VIEW_ID>",
          "group": "navigation"
        } 
      ] 
    }
    ```

    - tree view item, add the following to `contributes.menus.view/item/context`
      ( `<VIEW_ID>` is defined in `contributes.views.dbuxViewContainer` section and `<NODE_CONTEXT_ID>` is defined programmatically in `TreeItem.contextValue` )

    ``` json
    {
      "view/item/context": [
        {
          "command": "<COMMAND_ID>",
          "when": "view == <VIEW_ID> && viewItem == <NODE_CONTEXT_ID>",
          "group": "inline"
        }
      ]
    }
    ```

    NOTES:

    - You can sort buttons by adding suffix `@<number>` to `group` property. e.g. `"group": "inline@5"`
    - If you remove `"group": "navigation"` , the button will be listed in a dropdown menu, see [Sorting of groups](https://code.visualstudio.com/api/references/contribution-points#Sorting-of-groups) for more information
    - The `when` property defines when should the button be visible, see ['when' clause contexts](https://code.visualstudio.com/docs/getstarted/keybindings#_when-clause-contexts) for more available condition

TODO: more to be said here in the future (consider https://gist.github.com/PurpleBooth/b24679402957c63ec426)





## Joining the Community

While you can certainly try to get started on your own, you probably make your life a lot easier by joining the dev team on [DISCORD](https://discord.gg/8kR2a7h) first :)
