/* eslint-disable max-len */

import { env, Uri, window } from 'vscode';
import DialogNodeKind from '../dialogLib/DialogNodeKind';


const intro = {
  name: 'intro',
  displayName: 'Help',

  /**
   * These edges are added to all states, except for `start` and `end`.
   */
  defaultEdges: [
    {
      text: '(Don\'t show this again)',
      node: 'end'
    }
  ],

  nodes: {
    start: {
      kind: DialogNodeKind.Modal,
      text: `Welcome to Dbux! What do you need help with?`,
      edges: [
        {
          text: '(1) Basics',
          node: 'basics'
        },
        {
          text: '(2) ACG',
          node: 'acg'
        },
        {
          text: '(3) PDG',
          node: 'pdg'
        },
        {
          text: 'Ask on Discord',
          async click() {
            return env.openExternal(Uri.parse('https://discord.gg/jWN356W'));
          }
        },
        {
          text: 'Report Issue',
          async click() {
            return env.openExternal(Uri.parse('https://github.com/Domiii/dbux/issues'));
          }
        },
        {
          text: '(Ask Me Again Later)',
          node: null // dismiss → will come back again upon next restart
        }
      ]
    },
    
    basics: {
      kind: DialogNodeKind.Modal,
      text: 'Here are some resources to get you familiar with the Dbux basics:',
      edges: [
        {
          text: '↩ Go back',
          node: 'start'
        },
        {
          text: 'Watch the Intro Video',
          click() {
            return env.openExternal(Uri.parse('https://youtu.be/N9W6rhHMKbA?t=145'));
          }
        },
        {
          text: 'Read the Docs',
          async click() {
            return env.openExternal(Uri.parse('https://domiii.github.io/dbux'));
          }
        },
        {
          text: 'Tutorial',
          click() {
            return env.openExternal(Uri.parse('https://domiii.github.io/dbux/dbux-practice/tutorial'));
          }
        }
      ]
    },

    acg: {
      kind: DialogNodeKind.Modal,
      text: 'The ACG (Asynchronous Call Graph) allows investigating asynchronous concurrent control flow. Here are some relevant resources:',
      edges: [
        {
          text: '↩ Go back',
          node: 'start'
        },
        {
          text: 'ACG Documentation',
          click() {
            return env.openExternal(Uri.parse('https://domiii.github.io/dbux/acg'));
          }
        },
        {
          text: 'Video: Examples of the ACG',
          click() {
            return env.openExternal(Uri.parse('https://youtu.be/N9W6rhHMKbA?t=621'));
          }
        }
      ]
    },

    pdg: {
      kind: DialogNodeKind.Modal,
      text: 'The PDG (Program Dependency Graph) allows investigating program dependencies (specifically designed to help understand data structures and algorithms). Here are some relevant resources:',
      edges: [
        {
          text: '↩ Go back',
          node: 'start'
        },
        {
          text: 'PDG Documentation',
          click() {
            return env.openExternal(Uri.parse('https://domiii.github.io/dbux/pdg'));
          }
        },
        {
          text: 'Video: Examples of the PDG',
          click() {
            return env.openExternal(Uri.parse('https://www.youtube.com/watch?v=dgXj3VoQJZQ'));
          }
        }
      ]
    },

    // ###########################################################################
    // end
    // ###########################################################################

    end: {
      end: true,
      kind: DialogNodeKind.None
    }
  }
};

export default intro;