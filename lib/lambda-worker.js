'use strict';

const AWS = require('aws-sdk');
const Worker = require('./worker');

class LambdaWorker extends Worker {
  constructor(message = {}, options = {}) {
    super(message, { command: 'bogus' }); // bogus command allows Worker constructor to pass

    if (!options.functionName) throw new Error('Missing options: functionName');

    this.functionName = options.functionName;
    this.client = new AWS.Lambda(); // region set in ECS environment
  }

  async waitFor() {
    const options = {
      FunctionName: this.functionName,
      InvocationType: 'RequestResponse',
      Payload: Object.assign({}, process.env, this.message.env)
    };

    const start = Date.now();

    try {
      const data = await this.client.invoke(options).promise();
      const duration = Date.now() - start;

      const results = { duration };

      if (data.FunctionError && data.FunctionError === 'Unhandled')
        throw new Error(data.Payload);

      if (data.FunctionError) {
        results.code = JSON.parse(data.Payload).code;
      } else {
        results.code = 0;
      }

      if (results.code === 0) return await this.success(results);
      if (results.code === 3) return await this.ignore(results);
      if (results.code === 4) return await this.noop(results);

      throw new Error(data.Payload);
    } catch (err) {
      this.logger.workerError(err);
      return await this.message.retry();
    }
  }

  static create(message, options) {
    return new LambdaWorker(message, options);
  }
}

module.exports = LambdaWorker;
