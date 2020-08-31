/* eslint-disable max-len */
import { env, Uri } from 'vscode';
import { showHelp } from '../help';
import TutorialNodeKind from './TutorialNodeKind';


const survey1 = {
  name: 'survey1',

  defaultEdges: [
    {
      text: '(Stop Survey)',
      node: 'end'
    }
  ],

  nodes: {
    q1: {
      text: `Do you think that Dbux' `,
      edges: [
        
      ]
    },
    
    q2: {
      text: ``,
      edges: [
        
      ]
    },
    
    q3: {
      text: ``,
      edges: [
        
      ]
    },

     
  }
};

export default function startSurvey1() {
  // TODO: startDialog(survey1);
}