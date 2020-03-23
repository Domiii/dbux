# 1. get one column as a list
allFunctionNames = staticContexts[['displayName']].to_numpy().flatten().tolist()

# 2. get all rows that match a condition
callLinked = staticTraces[~staticTraces['callId'].isin([0])]

# 3. exclude columns
df.drop(['A', 'B'], axis=1)

# 3. display a groupby object (https://stackoverflow.com/questions/22691010/how-to-print-a-groupby-object)
for key, item in df.groupby('A'):
  display(grouped_df.get_group(key))