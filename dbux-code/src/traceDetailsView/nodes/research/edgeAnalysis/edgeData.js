const EdgeDataFileName = 'edgeAnnotations.json';

export function getExperimentDataFilePath(experimentId) {
  const root = this.research.getExperimentFolder(experimentId);
  return pathResolve(root, EdgeDataFileName);
}