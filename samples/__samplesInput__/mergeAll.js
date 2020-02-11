function mergeAll(allRootContexts) {
  let indexPointers = Array(allRootContexts.length).fill(0);
  let contextCount = allRootContexts.reduce((sum, arr) => sum + arr.length, 0);
  const result = [];

  for (let i = 0; i < contextCount; i++) {
    let earliestContext = allRootContexts[0][indexPointers[0]];
    let earliestApplicationIndex = 0;
    for (let j = 1; j < allRootContexts.length; j++) {
      const context = allRootContexts[j][indexPointers[j]];
      if (context.createdAt < earliestContext) {
        earliestContext = context;
        earliestApplicationIndex = j;
      }
    }
    indexPointers[earliestApplicationIndex] += 1;
    result.push(earliestContext);
  }

  console.log(result);
}


const rootContexts = [
  [
    {
      "contextType": 1,
      "runId": 1,
      "parentContextId": null,
      "contextId": 1,
      "staticContextId": 1,
      "orderId": 1,
      "createdAt": 1581184728049,
      "schedulerTraceId": null,
      "applicationId": 1
    },
    {
      "contextType": 2,
      "runId": 2,
      "parentContextId": null,
      "contextId": 18,
      "staticContextId": 4,
      "orderId": 3,
      "createdAt": 1581184730073,
      "schedulerTraceId": 12,
      "applicationId": 1
    },
    {
      "contextType": 2,
      "runId": 4,
      "parentContextId": null,
      "contextId": 20,
      "staticContextId": 4,
      "orderId": 4,
      "createdAt": 1581184730084,
      "schedulerTraceId": 28,
      "applicationId": 1
    },
    {
      "contextType": 2,
      "runId": 6,
      "parentContextId": null,
      "contextId": 34,
      "staticContextId": 4,
      "orderId": 6,
      "createdAt": 1581184732096,
      "schedulerTraceId": 64,
      "applicationId": 1
    },
    {
      "contextType": 2,
      "runId": 8,
      "parentContextId": null,
      "contextId": 43,
      "staticContextId": 4,
      "orderId": 8,
      "createdAt": 1581184734107,
      "schedulerTraceId": 95,
      "applicationId": 1
    },
    {
      "contextType": 2,
      "runId": 10,
      "parentContextId": null,
      "contextId": 54,
      "staticContextId": 4,
      "orderId": 10,
      "createdAt": 1581184736119,
      "schedulerTraceId": 121,
      "applicationId": 1
    }
  ],
  [
    {
      "contextType": 1,
      "runId": 1,
      "parentContextId": null,
      "contextId": 1,
      "staticContextId": 1,
      "orderId": 1,
      "createdAt": 1581184754960,
      "schedulerTraceId": null,
      "applicationId": 2
    }
  ]
]
mergeAll(rootContexts);