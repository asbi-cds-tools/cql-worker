# cql-worker
A library for executing Clinical Quality Language (CQL) expressions asynchronously via Web Workers. This allows web applications to evaluate CQL expressions in a non-blocking manner. For examples where this can be useful, see the Alcohol Screening and Brief Intervention (ASBI) Clinical Decision Support (CDS) [Screening](https://github.com/asbi-cds-tools/asbi-screening-app) and [Intervention](https://github.com/asbi-cds-tools/asbi-intervention-app) apps.

## Underlying Technologies

### CQL Execution Engine
All CQL calculations are executed using the [CQL Execution Engine](https://github.com/cqframework/cql-execution), an open source library that implements the CQL standard.

### FHIRHelpers
[FHIRHelpers](https://github.com/cqframework/clinical_quality_language/wiki/FHIRHelpers) is a library that defines functions for converting between FHIR and CQL data types. `cql-worker` includes version `4.0.1` of FHIRHelpers, which is available under an Apache 2.0 License, Copyright 2014 The MITRE Corporation. Other versions of FHIRHelpers can be found [here](https://github.com/cqframework/clinical_quality_language/tree/master/Src/java/quick/src/main/resources/org/hl7/fhir).

### CQL Execution FHIR Data Source
The [`cql-exec-fhir`](https://github.com/cqframework/cql-exec-fhir) is used to provide a FHIR-based data source for use with the CQL Execution Engine.

### Web Workers
[Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) provide a means to offload CQL expression calculations to a separate thread. 

## Current Limitations
This library has only been tested with [Webpack 4](https://v4.webpack.js.org/).

### Potential Future Improvements
- [Webpack 5](https://webpack.js.org/) supposedly has better support for Web Workers but also includes several breaking changes when it comes to bundling Node.js applications for the web browser. It may be possible to expand `cql-workers` so that it can support both Webpack 4 and Webpack 5.
- Node.js now includes support for [Worker threads](https://nodejs.org/api/worker_threads.html), which are similar to Web Workers but run in the Node.js environment. A possible future improvement could be expanding `cql-workers` to support Node.js Worker threads.

## Example Usage
```javascript
// See: https://github.com/webpack-contrib/worker-loader
import Worker from "../../node_modules/cql-worker/src/cql.worker.js";
import { initialzieCqlWorker } from 'cql-worker';

// Define a web worker for evaluating CQL expressions
const cqlWorker = new Worker();

// Initialize the cql-worker
let [setupExecution, sendPatientBundle, evaluateExpression] = initialzieCqlWorker(cqlWorker);

// Define `elmJson`, `valueSetJson`, and `cqlParameters`

// Send the cqlWorker an initial message containing the ELM JSON representation of the CQL expressions
setupExecution(elmJson, valueSetJson, cqlParameters);

// Create `patientBundle` to hold the patient's FHIR resources

// Send the patient bundle to the CQL web worker
sendPatientBundle(patientBundle);

// Define `namedExpression`, a string containing the name of a CQL expression

let result = await evaluateExpression(namedExpression);
```

See the ASBI CDS [Screening](https://github.com/asbi-cds-tools/asbi-screening-app) and [Intervention](https://github.com/asbi-cds-tools/asbi-intervention-app) apps for additional information for how to configure Webpack to properly package `cql-worker`.

## License
(C) 2021 The MITRE Corporation. All Rights Reserved. Approved for Public Release: 20-0458. Distribution Unlimited.

Unless otherwise noted, this work is available under an Apache 2.0 license. It was produced by the MITRE Corporation for the National Center on Birth Defects and Developmental Disabilities, Centers for Disease Control and Prevention in accordance with the Statement of Work, contract number 75FCMC18D0047, task order number 75D30119F05691.
