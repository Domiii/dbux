/* eslint-disable max-len */

import { env, Uri, window } from 'vscode';
import { showHelp } from '../help';
import DialogNodeKind from '../dialogLib/DialogNodeKind';


const intro = {
  name: 'intro',
  displayName: 'the Introduction',

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
      text: `Welcome to Dbux! Do you need help?`,
      edges: [
        {
          text: 'Maybe later',
          node: null // dismiss → will come back again upon next restart
        },
        {
          text: 'No. Don\'t ask me again.',
          node: 'end'
        },
        {
          text: 'No. Don\'t ask me again.',
          node: 'end'
        }
      ]
    },
    
    basics: {
      kind: DialogNodeKind.Modal,
      text: 'TODO',
      edges: [
        {
          text: 'Watch the intro video',
          node: 'basics',
          click() {

          }
          // https://youtu.be/N9W6rhHMKbA?t=145
        },
        {
          text: 'Read the Docs',
          node: 'basics',
          async click() {
            return env.openExternal(Uri.parse('https://domiii.github.io/dbux'));
          }
        },
        {
          text: 'Ask on Discord',
          async click() {
            return env.openExternal(Uri.parse('https://discord.gg/jWN356W'));
          }
        },
        {
          text: 'Go back',
          node: 'start'
        }
      ]
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