import React, { useEffect, useRef } from 'react';

/**
 * NOTE: there are some WASM problem while import jere.
 *  Instead we add the scripts in `docusaurus.config.js` to import.
 */
// import * as d3Graphviz from 'd3-graphviz';

/**
 * NOTE: Copied from @dbux/graph-client/src/ddg/DDGTimelineView.js
 * @see https://github.com/magjac/d3-graphviz#supported-options
 */
const GraphVizCfg = {
  /**
   * Performance tweaks.
   * @see https://github.com/magjac/d3-graphviz/issues/232#issuecomment-1156834744
   * @see https://github.com/magjac/d3-graphviz#performance
   * @see https://github.com/magjac/d3-graphviz#graphviz_tweenShapes
   */
  tweenShapes: false,
  tweenPaths: false,
  // tweenPrecision: 100, // NOTE: not necessary when tweening is disabled
  // convertEqualSidedPolygons: false // NOTE: not necessary when `tweenShapes` is disabled
};

export default function GraphvizDot(props) {
  const { dot, exerciseId, index } = props;
  const graphElRef = useRef(null);

  useEffect(() => {
    const graphviz = window.d3.select(graphElRef.current).graphviz({ ...GraphVizCfg });
    graphviz.renderDot(dot).on('end', () => {
      const svgEl = graphElRef.current.querySelector('svg');
      svgEl?.classList.add('h-100');
      svgEl?.classList.add('w-100');
    });
  });
  return <div key={`${exerciseId}_${index}`} className="h-100" ref={graphElRef}></div>;
}