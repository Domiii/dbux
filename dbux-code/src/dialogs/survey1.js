/* eslint-disable max-len */
import { env, Uri, window } from 'vscode';
import { showHelp } from '../help';
import DialogNodeKind from '../dialog/DialogNodeKind';
import { startDialog } from '../dialog/dialog';
import { showInformationMessage } from '../codeUtil/codeModals';


const survey1 = {
  name: 'survey1',

  defaultEdges: [
    {
      text: '(Why? What happens to my data?)',
      async click() {
        const msg = `Dbux is the object of research for a doctoral dissertation at National Taiwan University. For more questions, feel free to ask us on Discord.
In order to help evaluate Dbux's feasability and efficacy, we record your responses to these questions (and your progress on the tutorial bug) anonymously under a randomly generated id. If you are concerned about your data or want your data to be deleted, feel free to contact us on Discord.`;
        const btns = {
          async 'Contact us on Discord'() {
            return env.openExternal(Uri.parse('https://discord.gg/jWN356W'));
          },
          async 'Help!'() {
            return showHelp();
          }
        };
        return showInformationMessage(msg, btns, { modal: true });
      }
    },
    {
      text: '(Continue Later)',
      node: 'continueLater'
    },
    {
      text: '(Stop Survey)',
      node: 'end'
    }
  ],

  nodes: {
    start: {
      kind: DialogNodeKind.Modal,
      text: `Can we ask you 5 short questions (on your first impressions of Dbux)?`,
      edges: [
        {
          text: 'Ok',
          node: 'q1'
        }
      ]
    },

    q1: {
      kind: DialogNodeKind.Modal,
      text: ``,
      edges: [

      ]
    },

    q2: {
      kind: DialogNodeKind.Modal,
      text: `I would like to have the following `,
      edges: [
        {
          text: ``,
          node: `q4`
        }
      ]
    },

    q3: {
      kind: DialogNodeKind.Modal,
      text: `Based on first impressions, I believe that Dbux can help me better understand how my programs work and what they do (if Dbux can work flawlessly used in my own projects).`,
      edges: [
        {
          text: 'Strongly Agree',
          node: 'q3'
        },
        {
          text: 'Agree',
          node: 'q3'
        },
        {
          text: 'Disagree',
          node: 'q3'
        },
        {
          text: 'Strongly Disagree',
          node: 'q3'
        }
      ]
    },

    q4: {

    },

    q5: {
      kind: DialogNodeKind.Modal,
      text: `How would you assess your programming skills?`,
      edges: [
        {
          text: 'Beginner Learner',
          node: 'interlude1'
        },
        {
          text: 'Intermediate Learner (I can build small things)',
          node: 'interlude1'
        },
        {
          text: 'Developer - Junior level',
          node: 'interlude1'
        },
        {
          text: 'Developer - Mid level',
          node: 'interlude1'
        },
        {
          text: 'Developer - Senior level',
          node: 'interlude1'
        }
      ]
    },

    interlude1: {
      kind: DialogNodeKind.Modal,
      text: `Thank you so much for all your feedback! If you are interested in this project, feel free to leave your email.`,
      edges: [
        {
          text: 'Subscribe by email',
          node: 'enterEmail'
        },
        {
          text: `I'm Done`,
          node: 'end'
        }
      ]
    },

    emailEnter: {
      kind: DialogNodeKind.Modal,
      async enter({ data }) {
        data.email = await window.showQuickPick([], { 
          placeHolder: 'Enter email (we will hopefully send updates every few weeks)'
        });
      },
      text({ data }) {
        return `Is this your email? (${data.email || ''})`;
      },
      edges: [
        {
          text: `Yes`,
          node: 'end'
        },
        {
          text: `No`,
          node: 'emailEnter'
        }
      ]
    },

    continueLater: {
      text: `Do you want to continue our survey? (You are almost done)`,
      async enter(currentState, stack, goTo) {
        const waitTime = 24 * 60 * 60;
        await waitAtMost(currentState, waitTime);

        const previousState = stack[stack.length - 1];
        if (!previousState) {
          goTo('start');
        }
      },
      async edges(currentState, stack) {
        const previousState = stack[stack.length - 1];
        return [
          {
            text: `Ok`,
            node: previousState.nodeName
          }
        ];
      }
    },

    // ###########################################################################
    // end
    // ###########################################################################

    end: {
      end: true,
      kind: DialogNodeKind.Message,
      text: 'Thank you for trying out our survey! (Btw: You can press ESC to close this message)'
    }
  }
};

export default function startSurvey1(startState) {
  startDialog(survey1, startState);
}