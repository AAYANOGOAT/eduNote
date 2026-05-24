const amqp = require("amqplib");

const EXCHANGE_NAME = "edunotes_exchange";
const QUEUE_NAME = "notification_queue";
const BINDING_KEY = "note.added";

/**
 * Start consuming note.added events from RabbitMQ.
 * Retries with back-off if broker is not yet available.
 */
const startConsumer = async (retries = 10, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await connection.createChannel();

      // Declare same exchange as publisher (idempotent)
      await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

      // Declare a durable queue
      const q = await channel.assertQueue(QUEUE_NAME, { durable: true });

      // Bind queue to exchange with routing key
      await channel.bindQueue(q.queue, EXCHANGE_NAME, BINDING_KEY);

      // Process one message at a time
      channel.prefetch(1);

      console.log(
        `[notification-service] ✅ Listening for "${BINDING_KEY}" events on queue "${QUEUE_NAME}"…`
      );

      channel.consume(q.queue, (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            handleNoteAdded(content);
            channel.ack(msg);
          } catch (parseErr) {
            console.error("[notification-service] Failed to parse message:", parseErr.message);
            channel.nack(msg, false, false); // Discard malformed message
          }
        }
      });

      // Handle connection close gracefully
      connection.on("close", () => {
        console.warn("[notification-service] RabbitMQ connection closed. Reconnecting…");
        setTimeout(() => startConsumer(retries, delay), delay);
      });

      return; // Successfully connected
    } catch (err) {
      console.warn(
        `[notification-service] RabbitMQ not ready (attempt ${i + 1}/${retries}): ${err.message}`
      );
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  console.error("[notification-service] Could not connect to RabbitMQ after all retries.");
};

/**
 * Handle a note.added event.
 * In a real system, this would send an email/SMS.
 * Here it logs a structured notification.
 */
const handleNoteAdded = (message) => {
  const { data, timestamp } = message;
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║      📬  NOUVELLE NOTE AJOUTÉE           ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Stagiaire  : ${(data.stagiaireName || data.stagiaireId).padEnd(26)}║`);
  console.log(`║  Module     : ${data.module.padEnd(26)}║`);
  console.log(`║  Note       : ${String(data.note).padEnd(26)}║`);
  console.log(`║  Formateur  : ${(data.formateurName || data.formateurId).padEnd(26)}║`);
  console.log(`║  Date       : ${new Date(timestamp).toLocaleString("fr-FR").padEnd(26)}║`);
  console.log("╚══════════════════════════════════════════╝\n");
};

module.exports = { startConsumer };
