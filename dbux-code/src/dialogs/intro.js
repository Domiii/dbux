/* eslint-disable max-len */
import { env, Uri } from 'vscode';
import { showHelp } from '../help';
import DialogNodeKind from '../dialogLib/DialogNodeKind';


const intro = {
  name: 'intro',

  /**
   * These edges are added to all states, except for `start` and `end`.
   */
  defaultEdges: [
    {
      text: '(Help)',
      async click() {
        return showHelp();
      }
    },
    {
      text: '(Don\'t show this again)',
      node: 'end'
    }
  ],

  nodes: {
    start: {
      kind: DialogNodeKind.Modal,
      text: `Welcome to Dbux! Here are some pointers:\n\n1. TODO`,
      edges: [
        {
          text: 'Ok',
          node: 'start2'
        }
      ]
    },
    
    start2: {
      kind: DialogNodeKind.Modal,
      text: 'TODO'
    },

    // ###########################################################################
    // end
    // ###########################################################################

    end: {
      end: true,
      kind: DialogNodeKind.Message,
      text: 'That\'s it. Have fun!'
    },
    endSilent: {
      end: true,
      kind: DialogNodeKind.None
    },
    cancel: {
      end: true,
      kind: DialogNodeKind.Message,
      text: 'Introduction cancelled. Have fun!'
    }
  }
};

export default intro;