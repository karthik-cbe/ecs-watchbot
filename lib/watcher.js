'use strict';

const events = require('events');
const Messages = require('./messages');
const Worker = require('./worker');
const LambdaWorker = require('./lambda-worker');

class Watcher {
  /**
   * @name Watcher
   * @param {Object} options - configuration
   * @param {Object} options.workerOptions - options object to pass to underlying Worker object
   * @param {String} options.queueUrl - the SQS queue URL
   */
  constructor(options = {}) {
    if (!options.workerOptions)
      throw new Error('Missing options: workerOptions');
    if (!options.queueUrl) throw new Error('Missing options: queueUrl');

    this.workerOptions = options.workerOptions;
    this.queueUrl = options.queueUrl;
    this.messages = Messages.create({ queueUrl: options.queueUrl });
    this.freshMode = options.fresh;

    this.concurrency = this.workerOptions.lambda && this.workerOptions.concurrency
      ? this.workerOptions.concurrency
      : 1;

    this.spawnWorker = this.workerOptions.lambda
      ? LambdaWorker.create
      : Worker.create;

    this.pending = 0;
    this.waiter = new events.EventEmitter();
  }

  listen() {
    return new Promise(async (resolve) => {
      const loop = async () => {
        if (this.stop) return resolve();

        const max = this.concurrency - this.pending;
        if (max < 1) return this.waiter.once('free', () => {
          if (this.freshMode) return resolve();
          loop();
        });

        const messages = await this.messages.waitFor(max);

        messages.forEach((message) => {
          this.spawnWorker(message, this.workerOptions)
            .waitFor()
            .then(() => this.pending--)
            .then(() => this.waiter.emit('free'));

          this.pending++;
        });

        setImmediate(loop);
      };
      setImmediate(loop);
    });
  }

  static create(options) {
    return new Watcher(options);
  }
}

module.exports = Watcher;
