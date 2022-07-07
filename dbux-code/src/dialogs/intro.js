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
          text: 'I need help with the basics.',
          node: 'basics'
        },
        {
          text: 'I am interested in the ACG (Asynchronous Call Graph).',
          node: 'acg'
        },
        {
          text: 'I am interested in the PDG (Program Dependency Graph).',
          node: 'pdg'
        },
        {
          text: 'No. Don\'t ask me again.',
          node: 'end'
        }
      ]
    },
    
    basics: {
      // TODO: merge all this into `start`
      kind: DialogNodeKind.Modal,
      text: 'Here are some resources to get you familiar with the Dbux basics:',
      edges: [
        {
          text: 'Watch the Intro Video',
          node: 'basics',
          click() {
            return env.openExternal(Uri.parse('https://youtu.be/N9W6rhHMKbA?t=145'));
          }
        },
        {
          text: 'Read the Docs',
          node: 'basics',
          async click() {
            return env.openExternal(Uri.parse('https://domiii.github.io/dbux'));
          }
        },
        {
          text: 'Tutorial',
          node: 'basics',
          click() {
            return env.openExternal(Uri.parse('https://domiii.github.io/dbux/dbux-practice/tutorial'));
          }
        },
        {
          text: 'Ask on Discord',
          async click() {
            return env.openExternal(Uri.parse('https://discord.gg/jWN356W'));
          }
        },
        {
          text: '↩ Go back',
          node: 'start'
        }
      ]
    },

    acg: {
      kind: DialogNodeKind.Modal,
      text: 'Here are some resources to get you familiar with the Dbux basics:',
      edges: [
      ]
    },

    pdg: {
      kind: DialogNodeKind.Modal,
      text: 'Here are some resources to get you familiar with the Dbux basics:',
      edges: [
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