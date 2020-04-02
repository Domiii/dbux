# // ###########################################################################
# // Queries
# // ###########################################################################

# -> get a single cell of a df (use `iloc` with `row` + `col` as arguments)
df.iloc[0]['staticContextId']

# -> get one column as a list
allFunctionNames = staticContexts[['displayName']].to_numpy().flatten().tolist()

# -> get all rows that match a condition
callLinked = staticTraces[~staticTraces['callId'].isin([0])]

# -> exclude columns
df.drop(['A', 'B'], axis=1)

# -> complex queries
staticTraces.query(f'callId == {callId} or resultCallId == {callId}')

# -> join queries (several examples)
# https://stackoverflow.com/a/40869861
df.set_index('key').join(other.set_index('key'))
B.query('client_id not in @A.client_id')
B[~B.client_id.isin(A.client_id)]

# merging dfs
# https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.merge.html
pd.merge(df1, df2, on=['A', 'B'])
df1.merge(df2, left_on='lkey', right_on='rkey')



# // ###########################################################################
# // Display
# // ###########################################################################

# -> display a groupby object (https://stackoverflow.com/questions/22691010/how-to-print-a-groupby-object)
groups = df.groupby('A')
for key, item in groups:
  group = groups.get_group(key)
  display(group) 
  # .to_numpy().flatten().tolist()