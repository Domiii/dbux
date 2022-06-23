import graphs from '../data/gallery/pdg/graphs';

export { graphs };
export const pdgById = new Map();

// hackfix: parse `pdgId` here to make sure it is globally unique easily
let lastPdgId = 0;
for (const chapterGroup of graphs.chapterGroups) {
  for (const chapter of chapterGroup.chapters) {
    for (const exercise of chapter.exercises) {
      if (!Array.isArray(exercise.ddgs)) {
        // console.error(`ddgs is not array`, exercise.ddgs);
        continue;
      }
      for (const renderData of exercise.ddgs) {
        const { uniqueId, ...otherProps } = renderData;
        const id = ++lastPdgId;
        renderData.id = id;
        pdgById.set(renderData.id, {
          chapterGroup: chapterGroup.name,
          chapter: chapter.name,
          exerciseId: exercise.id,
          renderData: otherProps,
        });
      }
    }
  }
}

export default function useGraphs({ pdgId } = {}) {
  if (pdgId) {
    return pdgById.get(pdgId);
  }
  else {
    return graphs;
  }
}
