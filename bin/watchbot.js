#!/usr/bin/env node

'use strict';

const Watcher = require('../lib/watcher');
const Logger = require('../lib/logger');

const main = async () => {
  const logger = Logger.create('watcher');
  const options = {
    queueUrl: process.env.QueueUrl,
    workerOptions: {}
  };

  if (process.argv[2] === 'listen') {
    options.workerOptions.command = process.argv.slice(3).join(' ');
    options.workerOptions.volumes = process.env.Volumes.split(',');
    options.fresh = process.env.fresh === 'true';
  } else if (process.argv[2] === 'lambda-listen') {
    options.workerOptions.lambda = process.argv[3];
    options.workerOptions.concurrency = process.argv[4] ? Number(process.argv[4]) : 1;
  } else {
    throw new Error(`Invalid arguments: ${process.argv.slice(2).join(' ')}`);
  }

  const watcher = Watcher.create(options);

  try {
    await watcher.listen();
  } catch (err) {
    logger.log(`[error] ${err.stack}`);
  }
};

module.exports = main;

if (require.main === module) main();
