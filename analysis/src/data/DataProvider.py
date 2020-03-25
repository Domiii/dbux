# import util
from util.loadUtil import loadDbuxFile, collectionDf

class Collections:
  def __init__(self, rawData):
    super().__init__()

    self.staticContexts = collectionDf(rawData, 'staticContexts')
    self.staticTraces = collectionDf(rawData, 'staticTraces')
    self.contexts = collectionDf(rawData, 'executionContexts')
    self.traces = collectionDf(rawData, 'traces')
  
  def getUniqueColumnValues(self, collectionName, columnName):
    collection = getattr(self, collectionName)
    return collection[columnName].unique().flatten().tolist()


class DataProvider:
  def __init__(self, fname):
    super().__init__()
    self.rawData = loadDbuxFile(fname)
    self.collections = Collections(self.rawData)

    # for some reason, some columns were loaded as `float` -> convert to `int`
    staticTraces = self.collections.staticTraces

    # get all function names in program
    staticContexts = self.collections.staticContexts
    allFunctionNames = staticContexts[['displayName']].to_numpy().flatten().tolist()


  def getCollection(self, collectionName):
    return getattr(self.collections, collectionName)
    

  def getUniqueStaticCallIds(self):
    s = set((
      *self.collections.getUniqueColumnValues('staticTraces', 'callId'),
      *self.collections.getUniqueColumnValues('staticTraces', 'resultCallId')
    ))
    s.remove(0)       # remove 0
    return sorted(list(s))


  def getStaticCallTrees(self):
    callIds = self.getUniqueStaticCallIds()
    staticTraces = self.collections.staticTraces
    for callId in callIds:
      # grp = staticTraces.query(f'callId == {callId} or resultCallId == {callId}')
      grp = staticTraces.query(f'callId == {callId}')
      result = staticTraces.query(f'resultCallId == {callId}').iloc[0]
      names = grp[['displayName']].to_numpy().flatten().tolist()
      yield (callId, names, result)
