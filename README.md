# CQL Worker
A library for executing Clinical Quality Language (CQL) expressions asynchronously via Web Workers. This allows web applications to evaluate CQL expressions in a non-blocking manner. For examples where this can be useful, see the Alcohol Screening and Brief Intervention (ASBI) Clinical Decision Support (CDS) [Screening](https://github.com/asbi-cds-tools/asbi-screening-app) and [Intervention](https://github.com/asbi-cds-tools/asbi-intervention-app) apps.

## Underlying Technologies

### CQL Execution Engine
All CQL calculations are executed using the [CQL Execution Engine](https://github.com/cqframework/cql-execution), an open source library that implements the CQL standard.

### FHIRHelpers
[FHIRHelpers](https://github.com/cqframework/clinical_quality_language/wiki/FHIRHelpers) is a library that defines functions for converting between FHIR and CQL data types. `cql-worker` includes version `4.0.1` of FHIRHelpers, which is available under an Apache 2.0 License, Copyright 2014 The MITRE Corporation. Other versions of FHIRHelpers can be found [here](https://github.com/cqframework/clinical_quality_language/tree/master/Src/java/quick/src/main/resources/org/hl7/fhir).

### CQL Execution FHIR Data Source
The [`cql-exec-fhir`](https://github.com/cqframework/cql-exec-fhir) is used to provide a FHIR-based data source for use with the CQL Execution Engine.

### Web Workers
[Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) provide a means to offload CQL expression calculations to a separate thread from within the browser.

### Node Worker Threads
[Node Worker Threads](https://nodejs.org/api/worker_threads.html) are similar to Web Workers but are for use in the Node.js runtime environment.

### Current Limitations
CQL Workers has been tested with the following environments and build tools:
* [x] Browser with [Webpack 4](https://v4.webpack.js.org/) using [worker-loader](https://github.com/webpack-contrib/worker-loader).
* [ ] [Webpack 5](https://webpack.js.org/) supposedly has [better support for Web Workers](https://webpack.js.org/guides/web-workers/) but also includes several breaking changes when it comes to bundling Node.js applications for the web browser. CQL Worker *should* work with Webpack 5, but it has not been tested. Please open an issue if you run into any problems.
* [x] Node.js has been tested, but be sure to [set](./main.js#L7) the `isNodeJs` flag to `true`.

## Example Usage

### Browser with Webpack 4

```javascript
// See: https://github.com/webpack-contrib/worker-loader
import Worker from "<PATH-TO-NODE-MODULES>/cql-worker/src/cql.worker.js";
import { initialzieCqlWorker } from 'cql-worker';

// Define a web worker for evaluating CQL expressions
const cqlWorker = new Worker();

// Initialize the cql-worker
let [setupExecution, sendPatientBundle, evaluateExpression] = initialzieCqlWorker(cqlWorker);

// Define `elmJson`, `valueSetJson`, `cqlParameters`, and `elmJsonDependencies`

// Send the cqlWorker an initial message containing the ELM JSON representation of the CQL expressions
setupExecution(elmJson, valueSetJson, cqlParameters, elmJsonDependencies);

// Create `patientBundle` to hold the patient's FHIR resources

// Send the patient bundle to the CQL web worker
sendPatientBundle(patientBundle);

// Define `namedExpression`, a string containing the name of a CQL expression

let result = await evaluateExpression(namedExpression);
```

See the ASBI CDS [Screening](https://github.com/asbi-cds-tools/asbi-screening-app) and [Intervention](https://github.com/asbi-cds-tools/asbi-intervention-app) apps for additional information for how to configure Webpack to properly package `cql-worker`.

### Node.js
Using CQL Workers with Node.js requires enabling the [`--experimental-json-modules`](https://nodejs.org/api/esm.html#esm_experimental_json_modules) flag.

```javascript
import { Worker } from 'worker_threads';
import { initialzieCqlWorker } from 'cql-worker';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let cqlWorker = new Worker(require.resolve('cql-worker/src/cql-worker-thread.js'));
let [setupExecution, sendPatientBundle, evaluateExpression] = initialzieCqlWorker(cqlWorker, true);

// Define `elmJson`, `valueSetJson`, and `cqlParameters`

setupExecution(elmJson, valueSetJson, cqlParameters, elmJsonDependencies);

// Create `patientBundle` to hold the patient's FHIR resources

sendPatientBundle(patientBundle);

// Define `namedExpression`, a string containing the name of a CQL expression

let result = await evaluateExpression(namedExpression);
```

## License
(C) 2021 The MITRE Corporation. All Rights Reserved. Approved for Public Release: 20-0458. Distribution Unlimited.

Unless otherwise noted, this work is available under an Apache 2.0 license. It was produced by the MITRE Corporation for the National Center on Birth Defects and Developmental Disabilities, Centers for Disease Control and Prevention in accordance with the Statement of Work, contract number 75FCMC18D0047, task order number 75D30119F05691.
