/* eslint-disable max-len */
import { env, Uri } from 'vscode';
import { showHelp } from '../help';
import DialogNodeKind from '../dialogLib/DialogNodeKind';

const introMessage = `We prepared some example code (with a bug in it) for people to play around with Dbux's features. Do you want to try that?

WARNING: Sometimes these tutorial messages might disappear!
In that case, use the "Show Notifications" command, or the little notification bell (usually in the bottom right of VSCode) to bring it back up.
You can restart the tutorial from "Dbux" -> "Applications" -> "?" (help button).`;

const expressMessage1 = `(1) Inside the Dbux sidebar, under "Practice", 
(2) open the "Express" node, then
(3) press the ▶️ play button (next to the first bug)

(You need to hover over the bug, for the button to show up. That is a VSCode limitation.)`;

const expressMessage2 = `During the first run, it might spend a few minutes:
- downloading (cloning) express and 
- installing dependencies.

Once installation finished, it will run the bug and you will see:
(1) the test result and probably some (optional) verbose Dbux output (in Terminal)
(2) the buggy test file (in Editor)
... just like in the video!

Do you want to watch the video that guides you through this first bug or do you want to try it on your own?`;

const tutorial1 = {
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

    // start: {
    //   kind: DialogNodeKind.Message,
    //   text: 'Hi! You have recently installed Dbux. Do you need some help?',
    //   edges: [
    //     {
    //       text: 'Yes',
    //       node: 'bug10'
    //     },
    //     {
    //       text: 'No. Please don\'t bother me.',
    //       node: 'end'
    //     }
    //   ]
    // },

    start: {
      kind: DialogNodeKind.Modal,
      text: introMessage,
      edges: [
        {
          text: 'Ok',
          node: 'bug11'
        }
      ]
    },

    bug11: {
      dontSave: true,
      kind: DialogNodeKind.Modal,
      text: `To run the buggy sample code: ${expressMessage1}`,
      async enter() {
        // TODO: render projectViewController treeview
      },
      edges: [
        {
          text: 'Try to "run" the first experiment',
          node: 'bug12'
        }
      ]
    },

    bug12: {
      dontSave: true,
      kind: DialogNodeKind.Message,
      text: `Try to find and run the first bug: ${expressMessage1}
⚠️WARNING⚠️: If this message disappears, remember you can use the notification bell or the "Show Notifications" command to bring it back up.`,
      async enter() {
        // TODO: render projectViewController treeview
      },
      edges: [
        {
          text: 'Found the bug!',
          node: 'bug13'
        },
        {
          text: 'Can\'t find it',
          node: 'bug11'
        }
      ]
    },

    bug13: {
      dontSave: true,
      kind: DialogNodeKind.Modal,
      text: expressMessage2,
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
          node: 'bug14'
        }
      ]
    },

    bug14: {
      dontSave: true,
      kind: DialogNodeKind.Modal,
      text: `If you want, you can try to solve the bug (with the help of Dbux and the tutorial video).`,
      edges: [
        {
          text: 'I\'ll try! (Finish Tutorial)',
          node: 'end'
        },
        {
          text: 'Video? Can you repeat that part?',
          node: 'bug13'
        },
        {
          text: 'Restart Tutorial',
          node: 'bug10'
        },
        {
          text: 'Maybe later',
          node: 'bugWait'
        }
      ]
    },

    bugWait: {
      kind: DialogNodeKind.Message,
      text: introMessage,
      async enter(graphState, stack, { waitAtMost, goTo }) {
        const delay = 24 * 60 * 60;  // wait a day
        const resumeState = await waitAtMost(delay);
        if (resumeState) {
          goTo(resumeState);
        }
      },
      edges: [
        {
          text: 'I\'ll try that!',
          node: 'bug11'
        }
      ]
    },

    // ###########################################################################
    // end
    // ###########################################################################

    end: {
      end: true,
      kind: DialogNodeKind.Message,
      text: 'Have fun! (Btw: You can press ESC to hide these notifications)'
    },
    endSilent: {
      end: true,
      kind: DialogNodeKind.None
    },
    cancel: {
      end: true,
      kind: DialogNodeKind.Message,
      text: 'Tutorial cancelled.'
    }
  }
};

export default tutorial1;