import React from 'react';
import useBaseUrl from '../hooks/useBaseUrl';

/**
 * future-work: automatically get heading id from heading text.
 * 
 * NOTE: they use slugger and some manual string replacement to generate slug from heading.
 * 
 * @see https://github.com/facebook/docusaurus/blob/b393700a613ee00b8e59d347283f68495acb68ba/packages/docusaurus/src/commands/writeHeadingIds.ts#L41
 */

// const acg = 'TODO';

// const AcgPath = 'runtime-analysis/asynchronous-call-graph';
const AcgPath = 'acg';

const DebuggingBackgroundPath = 'background/debugging';

const aliases = {
  cgrs: 'cgr',
  'call graph root': 'cgr',
  'call graph roots': 'cgr',

  aes: 'ae',
  'asynchronous event': 'ae',
  'asynchronous events': 'ae',
  
  'asynchronous call graph': 'acg'
};

const PathByTerm = {
  'call graph': 'runtime-analysis/call-graph',
  acg: AcgPath,
  cgr: AcgPath,
  ae: AcgPath,

  'dynamic runtime analysis': DebuggingBackgroundPath,
  idbe: DebuggingBackgroundPath
};

const AnchorsByTerm = {
  trace: 'trace',
  statictrace: 'trace',
  context: 'context',
  staticcontext: 'staticContext',

  'call graph': 'call-graph',
  acg: '',
  cgr: 'cgr',
  ae: 'ae',

  'dynamic runtime analysis': '',
  idbe: ''
};

const TerminologyPathDefault = 'advanced/terminology';

function makeTermSrc(term) {
  let lookupTerm = term.toLowerCase();
  lookupTerm = aliases[lookupTerm] || lookupTerm;

  const terminologyPath = PathByTerm[lookupTerm] || TerminologyPathDefault;
  let anchor = AnchorsByTerm[lookupTerm];
  if (anchor === undefined) {
    return null;
  }
  
  anchor = anchor ? `#${anchor}` : '';

  const baseUrl = useBaseUrl();

  return `${baseUrl}${terminologyPath}${anchor}`;
}

/**
 * Create link to terminology.
 * 
 * TODO: maybe use a proper plugin instead
 * @see https://gitlab.grnet.gr/terminology/docusaurus-terminology
 */
export default function Term({ term, children = term }) {
  const src = makeTermSrc(term, children);
  if (!src) {
    return (<>
      ${children}
      <span className="color-gray border-gray round" title={`(could not look up "${children}")`}>
        <sup>❓</sup>
      </span>
    </>);
  }
  return (
  <a href={src} title={`lookup term: "${term}"`}>
    {children}
    <sup>❔</sup>
  </a>);
}
