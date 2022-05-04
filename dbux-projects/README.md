`@dbux/projects` currently serves as a sort of "mixed bag" "Debugger Frontend" library to Dbux.

It houses the following features:

1. Dbux Projects - a bunch of prepared (and somewhat curated) exercises in form of open source projects and bugs, which are picked up by Dbux's frontend application (i.e. currently only [dbux-code](../dbux-code)) to allow users to start exploring and debugging open source projects and bugs at the tip of a button.
2. Dbux Practice - helps record and visualize user behavior as they use Dbux.
3. Any other misc "debugger frontend" stuff that does not depend on VSCode (and thus should not be in `dbux-code`).
   * NOTE: `dbux-code` is currently the only Dbux implementation, but should only house code that depends on VSCode.
