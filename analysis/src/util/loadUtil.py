import pandas as pd
import json
# from math import isnan
import numpy as np

# NOTE: math.isnan only works for floats
# see https://stackoverflow.com/a/44154660
def isnan(x):
    return (x is np.nan or x != x)

def loadDbuxFile(fpath):
  fpath = f'../__data__/{fpath}'
  with open(fpath) as file:
    rawData = json.load(file)
  return rawData


def collectionDf(rawData: {}, name):
  rawCollections = rawData['collections']
  if not name in rawCollections:
    raise Exception(f'collection does not exist: {name} - available collections: {list(rawCollections.keys())}')
  rows = rawCollections[name]

  # get rid of empty first element
  if rows[0] == None:
    # DFs don't like ill-formated entries
    del rows[0]
    # rawData['collections']['executionContexts'][0] = { 'contextId': 0 }

  # create df
  df = pd.DataFrame(rows)

  # NOTE: Pandas actually converts any JSON `null` to `None` or `NaN`; and any column containing `NaN` to `float`
  # so here, we get rid of those by converting them all to 0's, and then convert back to `int`
  for colName in df:
    col = df[colName]
    if col.dtype == 'float64':
      try:
        df[colName] = col.fillna(0).astype('int32')
      except Exception as err:
        print('could not convert col: ', colName, col)
        raise err

  # convert all NaN to 0
  df = df.fillna(0)

  return df