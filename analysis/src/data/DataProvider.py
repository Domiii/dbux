# import util
from util.loadUtil import loadDbuxFile, collectionDf

class Collections:
  def __init__(self, rawData):
    super().__init__()

    self.staticContexts = collectionDf(rawData, 'staticContexts')
    self.staticTraces = collectionDf(rawData, 'staticTraces')
    self.contexts = collectionDf(rawData, 'executionContexts')
    self.traces = collectionDf(rawData, 'traces')


class DataProvider:
  def __init__(self, fname):
    super().__init__()
    self.rawData = loadDbuxFile(fname)
    self.collections = Collections(self.rawData)

    # for some reason, some columns were loaded as `float` -> convert to `int`
    staticTraces = self.collections.staticTraces
    staticTraces['callId'] = staticTraces['callId'].astype(int) 
    staticTraces['resultCallId'] = staticTraces['resultCallId'].astype(int)

    # get all function names in program
    staticContexts = self.collections.staticContexts
    allFunctionNames = staticContexts[['displayName']].to_numpy().flatten().tolist()

  def displayCallTrees(self):
    staticTraces = self.collections.staticTraces
    # TODO: get unique callId + resultCallId, and group that way (will not be a `groupby` operation because of overlap)
    groups = staticTraces.groupby(lambda i: staticTraces.iloc[i]['callId'])
    for callId, item in groups:
      if callId > 0:
        grp = groups.get_group(callId)
        names = grp[['displayName']].to_numpy().flatten().tolist()
        result = staticTraces[staticTraces['resultCallId'] == callId].iloc[0]
        print(callId, names, result['displayName'])
