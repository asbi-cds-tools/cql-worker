// Need to call this from your code:
// (see: https://github.com/webpack-contrib/worker-loader)
// import Worker from "../../node_modules/cql-worker/src/cql.worker.js";
// import { initialzieCqlWorker } from 'cql-worker';
// const cqlWorker = new Worker();
// let [setupExecution, sendPatientBundle, evaluateExpression] = initialzieCqlWorker(cqlWorker);
export function initialzieCqlWorker(cqlWorker) {

  // Define an array to keep track of the expression messages sent to the Web Worker
  let messageArray = [
    {
      expr: 'PLACEHOLDER', 
      resolver: {}
    }
  ];

  // Define an event handler for when cqlWorker sends results back
  cqlWorker.onmessage = function(event) {
    // Unpack the message in the event
    let expression = event.data.expression;
    let result = event.data.result;

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

  // Send the cqlWorker an initial message containing the ELM JSON representation of the CQL expressions
  let setupExecution = function(elmJson, valueSetJson, cqlParameters) {
    cqlWorker.postMessage({elmJson: elmJson, valueSetJson: valueSetJson, parameters: cqlParameters});
  };

  // Send the cqlWorker a message containing the patient bundle of FHIR resources.
  let sendPatientBundle = function(patientBundle) {
    cqlWorker.postMessage({patientBundle: patientBundle});
  };

  /**
   * Sends an expression to the webworker for evaluation.
   * @param {string} expression - The name of a CQL expression.
   * @returns {boolean} - A dummy return value.
   */
  let evaluateExpression = function(expression) {
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
    }
  };

  return [
    setupExecution,
    sendPatientBundle,
    evaluateExpression
  ];
}