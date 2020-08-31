/* eslint-disable max-len */
import { env, Uri } from 'vscode';
import sleep from '@dbux/common/src/util/sleep';
import { showHelp } from '../help';
import TutorialNodeKind from './TutorialNodeKind';
import startSurvey1 from './survey1';


async function waitAtMost({ stateStartTime }, delaySeconds) {
  const delay = delaySeconds * 1000;
  const timePassed = Date.now() - stateStartTime;
  return sleep(delay - timePassed);
}

const tutorial = {
  name: 'tutorial',

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
      text: '(Stop Tutorial)',
      node: 'end'
    }
  ],

  nodes: {

    // ###########################################################################
    // tutorial
    // ###########################################################################

    start: {
      kind: TutorialNodeKind.Message,
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

    bug10: {
      kind: TutorialNodeKind.Modal,
      text: `For our simple tutorial, we prepared example code (with a bug in it) for you to try out some of Dbux's features.`,
      edges: [
        {
          text: 'I\'ll try that!',
          node: 'bug11'
        }
      ]
    },

    bug11: {
      kind: TutorialNodeKind.Message,
      text: `To run the buggy sample code: (1) Inside the Dbux sidebar, under "Practice", (2) open the "Express" node, and (3) then press the ▶️ play button next to the first bug.
(You need to hover over the bug, for the button to show up. That is a VSCode problem.)`,
      async enter() {
        // TODO: render projectViewController treeview
      },
      edges: [
        {
          text: 'Found it!',
          node: 'bug12'
        }
      ]
    },

    bug12: {
      dontSave: true,
      kind: TutorialNodeKind.Message,
      text: `During the first run, it might spend a few minutes:
- downloading (cloning) express and 
- installing dependencies.

Once installation finished, it will run the bug and you will see:
(1) the test result and 
(2) the buggy test file
... just like in the video!

Do you want to watch the video that guides you through this first bug?`,
      async enter() {
      },
      edges: [
        {
          text: 'Watch tutorial video',
          async click() {
            return env.openExternal(Uri.parse('https://youtu.be/m1ANEuZJFT8?t=428'));
          }
        },
        {
          text: 'Next',
          node: 'bug13'
        }
      ]
    },

    bug13: {
      dontSave: true,
      kind: TutorialNodeKind.Modal,
      text: `If you want, you can try to solve the bug (with the help of Dbux and the tutorial video).`,
      edges: [
        {
          text: 'I\'ll try',
          node: 'bugFeedbackQuery'
        },
        {
          text: 'Maybe later',
          node: 'bugWait'
        },
        {
          text: 'Bug? Video? Can you repeat that part?',
          node: 'bug10'
        }
      ]
    },

    bugWait: {
      kind: TutorialNodeKind.Message,
      text: `For our simple tutorial, we prepared example code (with a bug in it) for you to try out some of Dbux's features.`,
      async enter(graphState) {
        const delay = 24 * 60 * 60;  // wait a day
        return waitAtMost(graphState, delay);
      },
      edges: [
        {
          text: 'I\'ll try that!',
          node: 'bug11'
        }
      ]
    },

    // ###########################################################################
    // feedback
    // ###########################################################################

    bugFeedbackQuery: {
      kind: TutorialNodeKind.Message,
      async enter(graphState) {
        return Promise.race([
          waitUntilBugFinished(),
          waitAtMost(graphState, 20 * 60)
        ]);
      },
      async text() {
        return `Can we ask you three short questions for an anonymous survey?`;
      },
      edges: [
        {
          text: 'Ok, but hurry!',
          async enter() {
            startSurvey1();
          },
          node: 'end'
        }
      ]
    },

    // ###########################################################################
    // end
    // ###########################################################################

    end: {
      kind: TutorialNodeKind.Message,
      text: 'Have fun! (Btw: You can press ESC to close this message)'
    }
  }
};


export default function startTutorial() {
  // TODO: startDialog(tutorial);
}