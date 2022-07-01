import rawGraphs from '../data/gallery/pdg/graphs';

class Graphs {
  _lastId;

  constructor(graphsData) {
    this._lastId = 0;
    this._pdgById = new Map();
    this._all = [];
    this.chapterGroups = graphsData.chapterGroups;
    // hackfix: parse `pdgId` here to make sure it is globally unique easily
    for (const chapterGroup of graphsData.chapterGroups) {
      for (const chapter of chapterGroup.chapters) {
        for (const exercise of chapter.exercises) {
          if (!Array.isArray(exercise.pdgs)) {
            continue;
          }
          for (const rawRenderData of exercise.pdgs) {
            const { uniqueId, ...otherProps } = rawRenderData;
            const id = this.makePdgId(rawRenderData);
            rawRenderData.id = id;
            const pdgData = {
              id,
              chapterGroup: chapterGroup.name,
              chapter: chapter.name,
              exerciseId: exercise.id,
              renderData: otherProps,
            };
            this._pdgById.set(id, pdgData);
            this._all.push(pdgData);
          }
        }
      }
    }
  }

  makePdgId(renderData) {
    // TODO: make this unambiguous between multiple PDGs of same title
    // TODO: don't ENCODE ids, unless you are building a URL!
    return encodeURIComponent(`${renderData.pdgTitle}`);
  }

  getById(pdgId) {
    // TODO: fix this
    if (pdgId.includes(encodeURIComponent('#'))) {
      // eslint-disable-next-line prefer-destructuring
      pdgId = pdgId.split(encodeURIComponent('#'), 1)[0];
    }
    return this._pdgById.get(pdgId);
  }

  getPreviousId(pdgId) {
    return this._all[this._all.findIndex(pdg => pdg.id === pdgId) - 1]?.id;
  }

  getNextId(pdgId) {
    return this._all[this._all.findIndex(pdg => pdg.id === pdgId) + 1]?.id;
  }
}

const graphs = new Graphs(rawGraphs);

export default function useGraphs() {
  return graphs;
}
