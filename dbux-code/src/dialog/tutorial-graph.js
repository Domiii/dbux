/* eslint-disable max-len */
import { env, Uri } from 'vscode';
import { showHelp } from '../help';
import DialogNodeKind from './DialogNodeKind';

const tutorialGraph = {
  name: 'dbux.tutorial',

  /**
   * These edges are added to all states, except for `start` and `end`.
   */
  defaultEdges: [
    {
      text: 'Help!',
      async click() {
        return showHelp();
      }
    },
    {
      text: 'Stop Tutorial!',
      node: 'end'
    }
  ],

  nodes: {
    start: {
      kind: DialogNodeKind.Message,
      text: 'Hi! You have recently installed Dbux. Do you need some help?',
      edges: [
        {
          text: 'Yes',
          node: 'tutorial1'
        },
        {
          text: 'No. Please don\'t bother me...',
          node: 'end'
        }
      ]
    },

    tutorial1: {
      kind: DialogNodeKind.Modal,
      text: 'We have example code (with a bug in it) for you to try Dbux out on.',
      edges: [
        {
          text: 'I\'ll try that!',
          node: 'startBug11'
        }
      ]
    },

    startBug11: {
      kind: DialogNodeKind.Modal,
      text: 'To run the buggy sample code: (1) Inside the Dbux sidebar, under "Practice", (2) open the "Express" node, and (3) then press the ▶️ play button next to the first bug. \n(You need to hover over the bug, for the button to show up. That is a VSCode problem.)',
      async enter() {
        // TODO: render projectViewController treeview
      },
      edges: [
        {
          text: 'Ok',
          node: 'startBug12'
        }
      ]
    },

    startBug12: {
      dontSave: true,
      kind: DialogNodeKind.Modal,
      text: 'During the first run, dependencies need to be installed, which might take a minute or two.\nDo you want to watch a video that guides you through this first bug?',
      async enter() {
      },
      edges: [
        {
          text: 'Watch tutorial video',
          async click() {
            return env.openExternal(Uri.parse('https://youtu.be/m1ANEuZJFT8?t=428'));
          }
        }
      ]
    },

    end: {
      kind: DialogNodeKind.Message,
      text: 'Have fun! (Btw: You can press ESC to close this message)'
    }
  }
};

export default tutorialGraph;