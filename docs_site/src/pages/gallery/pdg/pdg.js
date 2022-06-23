import React from 'react';
import { useLocation } from '@docusaurus/router';
import PDG from '@comp/gallery/PDG';
import useGraphs from '@src/hooks/useGraphs';

/**
 * @see https://getbootstrap.com/docs/5.2/getting-started/contents/#css-files
 */
import 'bootstrap/dist/css/bootstrap-grid.css';
import 'bootstrap/dist/css/bootstrap-utilities.css';

export default function pdg() {
  const pdgIdString = useLocation().hash.substring(1);
  const pdgId = parseInt(pdgIdString, 10);
  const renderData = useGraphs({ pdgId });

  return <div className="container">
    <PDG {...renderData}></PDG>
  </div>;
}
