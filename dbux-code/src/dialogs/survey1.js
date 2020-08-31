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
          async 'Ask on Discord'() {
            return env.openExternal(Uri.parse('https://discord.gg/jWN356W'));
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
      text: `Can we ask you 5 short questions on your first impressions of Dbux?`,
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
      text: `Based on first impressions, I believe that Dbux can help me better understand how my programs work and what they do.`,
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
    
    q3: {
      kind: DialogNodeKind.Modal,
      text: ``,
      edges: [
        
      ]
    },

    q4: {
      kind: DialogNodeKind.Modal,
      text: `How would you assess your programming skills?`,
      edges: [
        {
          text: 'Beginner Learner',
          node: 'interlude1'
        },
        {
          text: 'Intermediate Learner (I can build a few small things)',
          node: 'interlude1'
        },
        {
          text: 'Developer (Junior level)',
          node: 'interlude1'
        },
        {
          text: 'Developer (Mid level)',
          node: 'interlude1'
        },
        {
          text: 'Developer (Senior level)',
          node: 'interlude1'
        }
      ]
    },
    
    q5: {
      kind: DialogNodeKind.Modal,
      text: ``,
      edges: [
        {
          async click() {
            const email = await window.showQuickPick([], { placeHolder: 'Enter your email so we can reach out to you' });
            // TODO: store email
          }
        }
      ]
    },
    
    interlude1: {
      kind: DialogNodeKind.Modal,
      text: `Thank you so much for all your feedback! If you have the time and motivation, we have 5 more questions.`,
      edges: [
        {
          // TODO: re-design this somehow
          text: 'I can answer 5 more questions (but not more than that!)',
          node: 'q1'
        },
        {
          text: `I'm Done`,
          node: 'q1'
        }
      ]
    },

    continueLater: {
      text: ``,
      async enter() {
        // TODO
      },
      edges: [

      ]
    },
    
    // ###########################################################################
    // end
    // ###########################################################################

    end: {
      kind: DialogNodeKind.Message,
      text: 'Thank you for trying our survey! (Btw: You can press ESC to close this message)'
    }
  }
};

export default function startSurvey1(startState) {
  startDialog(survey1, startState);
}