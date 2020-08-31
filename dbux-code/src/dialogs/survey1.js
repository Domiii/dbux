/* eslint-disable max-len */
import { env, Uri } from 'vscode';
import { showHelp } from '../help';
import DialogNodeKind from '../dialog/DialogNodeKind';
import { startDialog } from '../dialog/dialog';
import { showInformationMessage } from '../codeUtil/codeModals';


const survey1 = {
  name: 'survey1',

  defaultEdges: [
    {
      text: '(Why? And what happens to my data?)',
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
      text: '(Stop Survey)',
      node: 'end'
    }
  ],

  nodes: {
    start: {
      text: `This is a short survey to help evaluate Dbux's feasability and efficacy, containing 5 short questions. Are you ready?`,
      edges: [
        {
          text: 'Ok',
          node: 'q1'
        }
      ]
    },
    
    q1: {
      text: ``,
      edges: [
        
      ]
    },
    
    q2: {
      text: `I believe that Dbux can help me better understand how my programs work and what they do`,
      edges: [
        {
          text: 'Ok',
          node: 'q3'
        }
      ]
    },
    
    q3: {
      text: ``,
      edges: [
        
      ]
    },
    
    q4: {
      text: ``,
      edges: [
        
      ]
    },

    q5: {
      text: ``,
      edges: [
        
      ]
    },
    
    tail1: {
      text: `Do you want to learn more about Dbux and receive updates about its progress? (at most once a week)`,
      edges: [
        {
          text: 'Yes',
          node: 'q1'
        },
        {
          text: 'No',
          node: 'q1'
        }
      ]
    },

     
  }
};

export default function startSurvey1() {
  startDialog(survey1);
}