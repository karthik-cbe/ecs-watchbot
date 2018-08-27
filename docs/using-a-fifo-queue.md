## Using a first-in-first-out (FIFO) queue

By default, Watchbot creates a standard SQS queue, in which the order of jobs is not guaranteed to match the order of messages. If your program requires more precise ordering, you can use [a first-in-first-out (FIFO) queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html), instead.

To use a FIFO queue, set the template option `fifo: true`.

A FIFO queue behaves differently and has some limitations, so you should read the AWS documentation and the details below if you are considering the switch.

### Triggering FIFO workers

With a standard queue, you trigger a Watchbot worker by sending an SNS message to the watcher's topic. With a FIFO queue, you will send a message directly to the watcher's FIFO queue, instead. Make sure you have read about the AWS documentation about the expected for these messages (for example, you need to include a `MessageGroupId`).

### Scaling FIFO workers

[Scaling behavior](./scaling-in-watchbot.md) in Watchbot is based on the total number of messages in the queue. If there are 50 messages, concurrent processing scales up to 50 (or the configured `maxSize`, if lower). In a FIFO queue, this scaling will not always make sense. For example, if your queue includes 50 messages but they only span 2 `MessageGroupId`s, then you will only be able to process 2 messages at a time and 48 worker machines will sit idle.

For this reason, it's important that you plan for the number of `MessageGroupId`s you will use and set the template option `maxSize` accordingly. If you are only going to use 2 `MessageGroupId`s, you should set `maxSize: 2`.
