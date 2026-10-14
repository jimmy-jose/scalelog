import { defineStartupLevel, changesFor } from "./authoring";

export const level013 = defineStartupLevel({
  "levelNumber": 13,
  "title": "The Receipt Holds the Checkout",
  "description": "When a customer taps 'Pay Now,' their browser spinner spins for 3.5 seconds. Performance traces show that saving the order to PostgreSQL only takes 40 milliseconds, but the web request then synchronously renders a PDF invoice and waits for an external SendGrid email API call before returning an HTTP 200 to the shopper.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Why is a paying customer sitting there waiting for SendGrid to send an email? Commit the order to the database, hand off the PDF generation and email sending to a background job queue, and return a fast 'Order Confirmed' screen immediately."
      }
  ],
  "metrics": [
    {
      "label": "Checkout p95",
      "value": "3.4 s",
      "severity": "critical"
    },
    {
      "label": "Order transaction p95",
      "value": "90 ms",
      "severity": "normal"
    },
    {
      "label": "Invoice + email span",
      "value": "2.9 s",
      "severity": "critical"
    }
  ],
  "choices": [
    {
      "id": "013-measured",
      "label": "Queue invoices and receipts",
      "description": "Commit the order first, enqueue a durable job, and return the order ID. Reconcile orders missing a job until a transactional handoff is introduced; keep payment authorization synchronous.",
      "cost": 4500,
      "tone": "recommended",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 24000,
        "monthlyBurn": 3500,
        "engineers": 0,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 180,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Checkout no longer waits for PDF or mail work; workers scale separately.",
        "downside": "A commit/publish gap remains under reconciliation, and workers need retry and duplicate handling.",
        "jimmyExplanation": "Moving receipt generation and email delivery to a persistent message queue (like Redis BullMQ or RabbitMQ) decouples checkout latency from external network calls. The customer gets an instant confirmation in 50ms, while background worker processes handle PDF generation and email dispatch asynchronously.",
        "effectReasons": {
          "upfrontCost": "$2,800 covers message queue infrastructure setup, worker process deployment, and durable job serialization.",
          "monthlyBurn": "Running background worker instances and queue storage adds $1,800/month.",
          "reliability": "Isolates the checkout flow from third-party email API slowdowns and outages.",
          "customerTrust": "Shoppers see instantaneous purchase confirmations, eliminating confusion and accidental double-clicks.",
          "complexity": "The team now manages background worker pools, job concurrency, and queue monitoring."
        }
      },
      "architectureChanges": changesFor("job-queue"),
      "outcomeTitle": "The receipt leaves the critical path.",
      "outcomeDialogue": "Checkout response times dropped from 3.5 seconds to 45 milliseconds! Shoppers get instant confirmation, and our background workers chew through the email backlog reliably.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Move deferrable work behind a durable handoff; asynchronous does not mean unreliable. Next pressure: At-least-once delivery will expose duplicate execution; a crash between commit and publish will later expose a dual-write gap."
    },
    {
      "id": "013-bounded",
      "label": "Keep synchronous work with a strict deadline",
      "description": "Keep receipts inline with provider timeouts and a persisted reconciliation task for deferred failures.",
      "cost": 2025,
      "tone": "neutral",
      "effects": {
        "users": 42000,
        "monthlyRevenue": 16800,
        "monthlyBurn": 2975,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 90,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "Less infrastructure and bounded request time can work at modest volume.",
        "downside": "App slots still wait on I/O; the deadline does not make slow work finish faster.",
        "jimmyExplanation": "Setting an aggressive 800ms timeout on the email API call and generating a lightweight plain-text receipt keeps the work synchronous while reducing the worst-case delay. It avoids running a message queue today, but if SendGrid is down, customers won't get their receipts.",
        "effectReasons": {
          "upfrontCost": "$1,260 funds optimizing the synchronous receipt code and configuring strict HTTP timeouts.",
          "monthlyBurn": "Lightweight receipt generation and API timeout monitoring add $1,620/month.",
          "reliability": "Reduces the latency tail for checkouts, but third-party API stalls still directly degrade the web tier.",
          "customerTrust": "Shoppers experience faster checkouts, though occasional email timeouts still lead to support inquiries.",
          "complexity": "Zero queue infrastructure to operate; all work remains in the synchronous request-response cycle."
        }
      },
      "architectureChanges": changesFor("local-dispatch"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Checkout is faster and plain receipts work for now, but any email provider hiccup still delays checkout and drops receipts.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Move deferrable work behind a durable handoff; asynchronous does not mean unreliable. Next pressure: At-least-once delivery will expose duplicate execution; a crash between commit and publish will later expose a dual-write gap."
    },
    {
      "id": "013-shortcut",
      "label": "Spawn a process after returning HTTP 200",
      "description": "Fire off invoice work in local process memory with no durable job record.",
      "cost": 2925,
      "tone": "risky",
      "effects": {
        "users": 18000,
        "monthlyRevenue": 7200,
        "monthlyBurn": 4025,
        "engineers": 0,
        "reliability": -9,
        "customerTrust": -7,
        "complexity": 7,
        "xp": -30,
        "confidence": -12
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "The buyer sees a quick response with minimal implementation.",
        "downside": "Host termination or deploys can lose receipts; response success does not establish durable handoff.",
        "jimmyExplanation": "Spawning an unmonitored in-memory background thread or async process inside the web server is a recipe for data loss. If the web server restarts or crashes for a deployment 10 seconds later, that in-memory thread is killed, and the customer's receipt is lost forever.",
        "effectReasons": {
          "upfrontCost": "$1,820 is burned writing fragile in-memory background threading logic.",
          "monthlyBurn": "Server memory pressure from unmanaged in-memory threads adds $2,070/month.",
          "reliability": "In-memory jobs are volatile: any server reboot, deploy, or crash permanently destroys pending jobs.",
          "customerTrust": "Lost order confirmation emails cause customer panic and damage merchant credibility.",
          "complexity": "Debugging silent thread deaths and missing receipts without audit logs consumes engineering hours."
        }
      },
      "architectureChanges": changesFor("volatile-jobs"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "In-memory threads felt fast until our afternoon deployment terminated 20 web servers, wiping out 150 unsent receipt emails. Customers are flooding support asking where their receipts went.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Move deferrable work behind a durable handoff; asynchronous does not mean unreliable. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Non-critical synchronous work extends the checkout critical path.",
    "Move deferrable work behind a durable handoff; asynchronous does not mean unreliable."
  ],
  "lesson": "Never make users wait on third-party APIs: commit the core transaction, hand off deferrable work to a durable background queue, and return a fast confirmation."
});
