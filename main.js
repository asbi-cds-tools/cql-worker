/**
 * Initialize either a web worker or a node worker thread to execute CQL ("CQL Worker").
 * @param {Object} cqlWorker - Created from `new Worker()`.
 * @param {boolean} isNodeJs - Boolean indicating whether to initialize for node or web.
 * @returns {Function[]} - An array of functions for using the initilized CQL Worker.
 */
export function initializeCqlWorker(cqlWorker, isNodeJs=false) {

  // Define an array to keep track of the expression messages sent to the Web Worker
  let messageArray = [
    {
      expr: 'PLACEHOLDER', 
      resolver: {}
    }
  ];

  // Define an event handler for when cqlWorker sends results back.
  // NOTE: Node service workers and web workers implement this differently.
  // - https://nodejs.org/api/worker_threads.html
  // - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
  const eventHandler = function(event) {
    // Unpack the message from the incoming event.
    let expression = isNodeJs ? event.expression : event.data.expression;
    let result = isNodeJs ? event.result : event.data.result;

    // If the response is that cqlWorker is still waiting on the patient bundle, 
    // wait 100 ms and resend.
    if (result == 'WAITING_FOR_PATIENT_BUNDLE') {
      setTimeout( () => cqlWorker.postMessage({expression: expression}), 100);
    } else {
      // Try to find this expression in the messageArray
      let executingExpressionIndex = messageArray.map((msg,idx) => {
        if (msg.expr == expression) return idx;
        else return -1; 
      }).reduce((a,b) => {
        if (a != -1) return a;
        else if (b != -1) return b;
        else return -1});

      // If the expression was found in the messageArray
      if (executingExpressionIndex != -1) {
        // Return the result by resolving the promise
        messageArray[executingExpressionIndex].resolver(result);
        // Remove the matching entry from the array
        messageArray.splice(executingExpressionIndex,1);
      }
    }
  };

  // Listen for incoming messages.
  // NOTE: Node service workers and web workers implement this differently.
  // - https://nodejs.org/api/worker_threads.html
  // - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
  if (isNodeJs) {
    cqlWorker.on('message', eventHandler);
  } else {
    cqlWorker.onmessage = eventHandler;
  }

  // Send the cqlWorker an initial message containing the ELM JSON representation of the CQL expressions
  const setupExecution = function(elmJson, valueSetJson, cqlParameters, elmJsonDependencies) { // TODO: Should have default parameter values here
    cqlWorker.postMessage({elmJson: elmJson, valueSetJson: valueSetJson, parameters: cqlParameters, elmJsonDependencies: elmJsonDependencies});
  };

  // Send the cqlWorker a message containing the patient bundle of FHIR resources.
  const sendPatientBundle = function(patientBundle) {
    cqlWorker.postMessage({patientBundle: patientBundle});
  };

  /**
   * Sends an expression to the webworker for evaluation.
   * @param {string} expression - The name of a CQL expression.
   * @returns {boolean} - A dummy return value.
   */
  const evaluateExpression = async function(expression) {
    // If this expression is already on the message stack, return its index.
    let executingExpressionIndex = messageArray.map((msg,idx) => {
      if (msg.expression == expression) return idx;
      else return -1;
    }).reduce((a,b) => {
      if (a != -1) return a;
      else if (b != -1) return b;
      else return -1});
    
    // If this expression was not found on the stack
    if (executingExpressionIndex == -1) {

      // Add an entry to the stack
      let n = messageArray.push({
        expr: expression, // The name of the expression
        resolver: null
      });
      
      // Send the entry to the Web Worker
      cqlWorker.postMessage({expression: expression});
      // Return a promise that can be resolved after the web worker returns the result
      return new Promise(resolve => messageArray[n-1].resolver = resolve);
    } else {
      return Promise.resolve(-1);
    }
  };

  return [
    setupExecution,
    sendPatientBundle,
    evaluateExpression
  ];
}

// Included for backwards compatibility, since the original releases included 
// this misspelled version of the main function. 
export function initialzieCqlWorker(cqlWorker, isNodeJs=false) {
  return initializeCqlWorker(cqlWorker, isNodeJs);
}