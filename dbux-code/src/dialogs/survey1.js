/* eslint-disable max-len */
import { env, Uri, window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { showHelp } from '../help';
import DialogNodeKind from './DialogNodeKind';
import { getOrCreateProjectManager } from '../projectView/projectControl';
import { showInformationMessage } from '../codeUtil/codeModals';
import { renderValueAsJsonInEditor } from '../traceDetailsView/valueRender';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Dialog');

function nextNode(currentState, stack, actions, node) {
  return node.nextNode;
}

async function storeResults(data) {
  const backend = await getOrCreateProjectManager().getAndInitBackend();
  data = { installId: 'testId', ...data };
  log('storeResults', data);
  return backend.containers.survey1.storeSurveyResult(data);
}

async function clearResults() {
  return this.storeResults(null);
}

// ###########################################################################
// Some commonly used edges
// ###########################################################################

const whySurveyEdge =
{
  text: 'Why these questions? What happens to my data?',
  async click() {
    const msg = `Dbux is the object of research for the doctoral dissertation of Dominik Seifert.
If you agree to participating in this survey, we record your responses to these questions (and your progress on the tutorial bug) anonymously in order to evaluate Dbux's feasability and efficacy.

We will not share this data with anyone, and no third party will given access to the database contents. We will however use the data to publish research on Dbux.

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
};

const showRecordedDataEdge =
{
  text: 'I want to see the recorded data',
  async click(currentState, stack, { getRecordedData }) {
    const recordedData = getRecordedData();
    await showInformationMessage(`NOTE: This data will only be stored *once* at the end of the survey.`, { Ok() { } }, { modal: true });
    return renderValueAsJsonInEditor(recordedData);
  }
};

const survey1 = {
  name: 'survey1',

  // ###########################################################################
  // defaultEdges
  // ###########################################################################

  defaultEdges: [
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
      text: '(Continue Later)',
      node: 'continueLater'
    },
    {
      text: '(Stop Survey)',
      node: 'cancel'
    },
    {
      text: 'save data',
      click() {
        return storeResults({ test: 123 });
      }
    },
    {
      text: 'clear data',
      click() {
        return clearResults();
      }
    }
  ],

  // ###########################################################################
  // survey dialog nodes
  // ###########################################################################

  nodes: {
    start: {
      kind: DialogNodeKind.Modal,
      text: `Can we ask you 5 short questions (related to Debugging and your first impressions of Dbux)?`,
      edges: [
        {
          text: 'Ok',
          node: nextNode
        },
        whySurveyEdge
      ]
    },

    q1: {
      nextNode: 'q2',
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
      nextNode: 'q3',
      kind: DialogNodeKind.Modal,
      text: `[2/5] I believe, that if my debugger had some (or all) of these features, debugging could be a lot easier or faster:

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
      nextNode: 'q4',
      kind: DialogNodeKind.Modal,
      text: `[3/5] Based on first impressions, I believe that Dbux can help me better understand how my programs work and what they do (given (1) I am familiar with Dbux and (2) I can properly integrate Dbux into my programs).`,
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
      nextNode: 'q5',
      kind: DialogNodeKind.Modal,
      text: `[4/5] What is your programming skill or background?`,
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
      nextNode: 'interlude1',
      kind: DialogNodeKind.Modal,
      text: `[5/5] Debugging is a crucial programming skill. I want to be more strategic and efficient when debugging. I am willing to invest time to learn and practice in order develop better strategies to find bugs faster.`,
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
          text: `I'm Done`,
          node: 'end'
        },
        {
          text: 'Let us know what you think',
          node: 'feedbackEnter'
        },
        {
          text: 'Subscribe by email',
          node: 'emailEnter'
        },
        {
          text: 'Join Discord',
          async click() {
            return env.openExternal(Uri.parse('https://discord.gg/jWN356W'));
          }
        },
        whySurveyEdge
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
        return `Your feedback:

${data.feedback || ''}`;
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
          prompt: 'Enter email to stay updated on Dbux (we will hopefully have updates every few weeks)'
        });
      },
      text({ data }) {
        return `Your email:

${data.email || ''}`;
      },
      edges: [
        {
          text: `Ok`,
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
        // const waitTime = 24 * 60 * 60;
        const waitTime = 30;
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
          },
          whySurveyEdge,
          showRecordedDataEdge
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
      async enter(currentState, stack, { serializeSurveyResult }) {
        // store to backend
        // const backend = await getOrCreateProjectManager().getAndInitBackend();
        const data = await serializeSurveyResult();
        log('survey result', data);
        // return backend.containers.survey1.storeSurveyResult(data);
      },
      edges: [
        whySurveyEdge,
        showRecordedDataEdge
      ]
    },

    cancel: {
      enter() {

      }
    }
  },

  async onEnd(recordedData) {
    // TODO: store remotely
  }
};

export default survey1;