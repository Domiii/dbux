/* eslint-disable max-len */
import { env, Uri, window } from 'vscode';
import { showHelp } from '../help';
import DialogNodeKind from '../dialog/DialogNodeKind';
import { Dialog } from '../dialog/Dialog';
import { showInformationMessage } from '../codeUtil/codeModals';
import { renderValueAsJsonInEditor } from '../traceDetailsView/valueRender';

function nextNode(currentState, stack, actions, node) {
  return node.nextNode;
}

async function serializeSurveyResult() {
  // TODO: get install id (random uuid that we generate and store in memento on first activate)
  const installId = null;

  // TODO: get survey result
  const surveyResult = null;

  // TODO: get tutorial result
  const tutorialResult = null;

  // TODO: get first bug result
  
}

const survey1 = {
  name: 'survey1',

  defaultEdges: [
    {
      text: '(Continue Later)',
      node: 'continueLater'
    },
    function (currentState, stack, actions, node) {
      if (!node.nextNode) {
        return null;
      }
      return {
        text: '(Skip this Question)',
        node: node.nextNode
      };
    },
    {
      text: '(Stop Survey)',
      node: 'end'
    }
  ],

  nodes: {
    start: {
      kind: DialogNodeKind.Modal,
      text: `Can we ask you 5 short questions (related to Debugging and your first impressions of Dbux)?`,
      edges: [
        {
          text: 'Ok',
          node: nextNode
        },
        {
          text: 'Why? What happens to my data?',
          async click() {
            const msg = `Dbux is the object of research for the doctoral dissertation of Dominik Seifert.
If you agree to participating in this survey, we record your responses to these questions (and your progress on the tutorial bug) anonymously under a randomly generated id, in order to help evaluate Dbux's feasability and efficacy, .

If you are concerned about your data or want your data to be deleted, just contact us on Discord.`;
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
      ]
    },

    q1: {
      nextnode: 'q2',
      kind: DialogNodeKind.Modal,
      text: `Thank you for taking the time!
How much do you agree with the following statement?

[1/5] (Without Dbux!) I am very satisfied with traditional debugging tools (such as the traditional real-time debugger, console.log etc.) and their ability to help me quickly locate functional (not performance-related) bugs.`,
      edges: [
        {
          text: 'Strongly Agree',
          node: nextNode
        },
        {
          text: 'Agree',
          node: nextNode
        },
        {
          text: 'Disagree',
          node: nextNode
        },
        {
          text: 'Strongly Disagree',
          node: nextNode
        }
      ]
    },

    q2: {
      nextnode: 'q3',
      kind: DialogNodeKind.Modal,
      text: `[2/5] I believe, that if my debugger had some (or all) of these features, debugging could be *a lot* easier:

- Navigation: Move forward+backward in time; skip non-function calls; jump to beginning/end of function
- Values: Show all executions and result values of any piece of code
- Object Tracking: Show all places where some object was used
- Dynamic Call Graph: Show and allow exploring all of my program's execution paths
- Decorate Executed Code in editor: So I can see what executed and what did not`,
      edges: [
        {
          text: 'Strongly Agree',
          node: nextNode
        },
        {
          text: 'Agree',
          node: nextNode
        },
        {
          text: 'Disagree',
          node: nextNode
        },
        {
          text: 'Strongly Disagree',
          node: nextNode
        }
      ]
    },

    q3: {
      nextnode: 'q4',
      kind: DialogNodeKind.Modal,
      text: `Based on first impressions, I believe that Dbux can help me better understand how my programs work and what they do (given (1) I am familiar with Dbux and (2) I can properly integrate Dbux into my programs).`,
      edges: [
        {
          text: 'Strongly Agree',
          node: nextNode
        },
        {
          text: 'Agree',
          node: nextNode
        },
        {
          text: 'Disagree',
          node: nextNode
        },
        {
          text: 'Strongly Disagree',
          node: nextNode
        }
      ]
    },

    q4: {
      nextnode: 'q5',
      kind: DialogNodeKind.Modal,
      text: `What is your programming skill or background?`,
      edges: [
        {
          text: 'Beginner Learner',
          node: nextNode
        },
        {
          text: 'Intermediate Learner (I can build small things)',
          node: nextNode
        },
        {
          text: 'Developer - Junior level',
          node: nextNode
        },
        {
          text: 'Developer - Mid level',
          node: nextNode
        },
        {
          text: 'Developer - Senior level',
          node: nextNode
        }
      ]
    },

    q5: {
      nextnode: 'interlude1',
      kind: DialogNodeKind.Modal,
      text: `I want to be more strategic and efficient when debugging. I am willing to invest time to learn and practice in order develop better strategies to find bugs faster.`,
      edges: [
        {
          text: 'Strongly Agree',
          node: nextNode
        },
        {
          text: 'Agree',
          node: nextNode
        },
        {
          text: 'Disagree',
          node: nextNode
        },
        {
          text: 'Strongly Disagree',
          node: nextNode
        }
      ]
    },

    interlude1: {
      kind: DialogNodeKind.Modal,
      text: `Thank you so much for your feedback!
If you like, you can tell us a little about your opinion on Debugging in general, or on Dbux.
Also, if you are interested in this project or in practicing debugging skills, feel free to leave your email.`,
      edges: [
        {
          text: 'Give Opinion',
          node: 'feedbackEnter'
        },
        {
          text: 'Subscribe by email',
          node: 'emailEnter'
        },
        {
          text: `I'm Done`,
          node: 'end'
        }
      ]
    },

    feedbackEnter: {
      kind: DialogNodeKind.Modal,
      async enter({ data }) {
        data.feedback = await window.showInputBox({
          placeHolder: 'Your feedback',
          value: data.feedback || '',
          prompt: 'Tell us what you think about Debugging in general, or about Dbux'
        });
      },
      text({ data }) {
        return `yes? (${data.email || ''})`;
      },
      edges: [
        {
          text: `Ok`,
          node: 'interlude1'
        },
        {
          text: `Edit`,
          node: 'feedbackEnter'
        }
      ]
    },

    emailEnter: {
      kind: DialogNodeKind.Modal,
      async enter({ data }) {
        data.email = await window.showInputBox({
          placeHolder: 'Your email',
          value: data.email || '',
          prompt: 'Enter email (we will hopefully send updates every few weeks)'
        });
      },
      text({ data }) {
        return `Is this your email? (${data.email || ''})`;
      },
      edges: [
        {
          text: `Yes`,
          node: 'interlude1'
        },
        {
          text: `No`,
          node: 'emailEnter'
        }
      ]
    },

    continueLater: {
      text: `Do you want to continue our survey? (You are almost done)`,
      async enter(currentState, stack, { goTo, waitAtMost }) {
        const waitTime = 24 * 60 * 60;
        await waitAtMost(waitTime);

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
      text: 'Thank you for trying out our survey! (Btw: You can press ESC to close this message)',
      edges: [
        {
          text: 'I want to see the data that is being stored!',
          async click(currentState, stack, { getRecordedData }) {
            const recordedData = getRecordedData();
            return renderValueAsJsonInEditor(recordedData);
          }
        }
      ]
    }
  },

  async onEnd(recordedData) {
    // TODO: store remotely
  }
};

let surveyDialog;

export default function startSurvey1(startState) {
  if (!surveyDialog) {
    surveyDialog = new Dialog(survey1);
  }
  surveyDialog.start(startState);
}