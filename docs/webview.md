## Add a new Component "C"

1. Add new `C.js` to `dbux-graph-host/src/graph`
1. Add new `C.js` to `dbux-graph-client/src/graph`
   1. add `createEl`
   1. add `update` (optional)
1. Add to `_hostRegistry.js` and `_clientRegistry.js`


## Add "C" as child to some component "d"

1. `d.children.createComponent('C', { initialState })`


## Listen and re-render on data events (on `host`)

```js
init() {
  this.addDisposable(
    allApplications.selection.onApplicationsChanged(() => {
      // applications changed
      this._resubscribeOnData();
    })
  );

  this._resubscribeOnData();
}

_resubscribeOnData() {
  // unsubscribe old
  this._unsubscribeOnNewData.forEach(f => f());
  this._unsubscribeOnNewData = [];

  // subscribe new
  for (const app of allApplications.selection.getAll()) {
    const { dataProvider: dp } = app;
    const unsubscribes = [
      dp.onData('staticProgramContexts',
        this._handleAddFiles.bind(this, app)
      ),
      dp.onData('executionContexts',
        this._handleAddExecutionContexts.bind(this, app)
      ),
      dp.queryImpl.statsByContext.subscribe()
    ];

    // unsubscribe on refresh
    this._unsubscribeOnNewData.push(...unsubscribes);

    // also when application is deselected
    allApplications.selection.subscribe(...unsubscribes);

    // also when node is disposed
    this.addDisposable(...unsubscribes);
  }
}
```