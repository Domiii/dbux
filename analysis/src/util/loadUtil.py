import pandas as pd
import json

def loadDbuxFile(fpath):
  fpath = f'../__data__/{fpath}'
  with open(fpath) as file:
    rawData = json.load(file)
  return rawData


def collectionDf(rawData: {}, name):
  rawCollections = rawData['collections']
  if not name in rawCollections:
    raise Exception(f'collection does not exist: {name} - available collections: {list(rawCollections.keys())}')
  rawArr = rawCollections[name]
  if rawArr[0] == None:
    # DFs don't like ill-formated entries
    del rawArr[0]
    # rawData['collections']['executionContexts'][0] = { 'contextId': 0 }

  df = pd.DataFrame(rawArr)

  # convert all NaN to 0
  df = df.fillna(0)

  return df