const amqp = require("amqplib");

const EXCHANGE_NAME = "edunotes_exchange";
const ROUTING_KEY = "note.added";

let channel = null;

/**
 * Initialise a persistent RabbitMQ channel.
 * Retries with exponential back-off if RabbitMQ is not yet ready.
 */
const initRabbitMQ = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
      console.log("[notes-service] RabbitMQ connected – publisher ready.");
      return;
    } catch (err) {
      console.warn(
        `[notes-service] RabbitMQ not ready (attempt ${i + 1}/${retries}): ${err.message}`
      );
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  console.error("[notes-service] Could not connect to RabbitMQ. Notifications disabled.");
};

/**
 * Publish a note.added event to the exchange.
 * @param {object} payload
 */
const publishNoteAdded = async (payload) => {
  if (!channel) {
    console.warn("[notes-service] RabbitMQ channel not available. Skipping publish.");
    return;
  }

  try {
    const message = JSON.stringify({ event: "note.added", data: payload, timestamp: new Date().toISOString() });
    channel.publish(EXCHANGE_NAME, ROUTING_KEY, Buffer.from(message), {
      persistent: true,
      contentType: "application/json",
    });
    console.log("[notes-service] Published note.added event:", payload);
  } catch (err) {
    console.error("[notes-service] Failed to publish event:", err.message);
  }
};

module.exports = { initRabbitMQ, publishNoteAdded };
