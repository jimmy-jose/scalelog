import { defineStartupLevel, changesFor } from "./authoring";

export const level023 = defineStartupLevel({
  "levelNumber": 23,
  "title": "A Column Becomes an Outage",
  "description": "An enterprise feature adds and backfills a field on a 600-million-row order/audit dataset. A deployment combines a locking schema change, a full-table update and removal of the old API field.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "CPU is fine; everyone is waiting for locks. Keep old and new code compatible while we change the data in steps we can stop."
    },
    {
      "character": "jimmy",
      "emotion": "normal",
      "text": "This month’s operating plan adds 2 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
    }
  ],
  "metrics": [
    {
      "label": "Lock wait p99",
      "value": "11 s",
      "severity": "critical"
    },
    {
      "label": "DB CPU",
      "value": "49%",
      "severity": "normal"
    },
    {
      "label": "App versions live",
      "value": "old + new",
      "severity": "warning"
    },
    {
      "label": "Backfill transaction",
      "value": "45 min",
      "severity": "critical"
    }
  ],
  "choices": [
    {
      "id": "023-measured",
      "label": "Expand, backfill, then contract",
      "description": "Add compatible nullable fields, deploy dual-compatible readers/writers, backfill in checkpointed batches with lock/statement timeouts, build indexes concurrently where supported, then remove old fields after all consumers migrate.",
      "cost": 14000,
      "tone": "recommended",
      "effects": {
        "users": 180000,
        "monthlyRevenue": 70000,
        "monthlyBurn": 16000,
        "engineers": 2,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -2,
        "xp": 200,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Short controlled steps preserve mixed-version operation and allow rollback.",
        "downside": "The migration spans releases; concurrent index builds still consume I/O and need validation.",
        "jimmyExplanation": "Short controlled steps preserve mixed-version operation and allow rollback. The migration spans releases; concurrent index builds still consume I/O and need validation.",
        "effectReasons": {
          "upfrontCost": "$14,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+16,000, including 2 hires and the operating costs of this response.",
          "reliability": "The migration spans releases; concurrent index builds still consume I/O and need validation.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("safe-migrations"),
      "outcomeTitle": "The schema changes in safe steps.",
      "outcomeDialogue": "Short controlled steps preserve mixed-version operation and allow rollback. The migration spans releases; concurrent index builds still consume I/O and need validation.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Evolve schemas with overlapping compatibility and bounded migrations. Next pressure: New enterprise catalogue requirements exceed the search semantics of ordinary order indexes."
    },
    {
      "id": "023-bounded",
      "label": "Book an enterprise maintenance window",
      "description": "Pause writes, take a recovery point, run a rehearsed migration and reopen after validation.",
      "cost": 6300,
      "tone": "neutral",
      "effects": {
        "users": 126000,
        "monthlyRevenue": 49000,
        "monthlyBurn": 13600,
        "engineers": 2,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 100,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A declared downtime window can simplify a rare incompatible change.",
        "downside": "The enterprise availability commitment and global merchant schedules make the window expensive.",
        "jimmyExplanation": "A declared downtime window can simplify a rare incompatible change. The enterprise availability commitment and global merchant schedules make the window expensive.",
        "effectReasons": {
          "upfrontCost": "$6,300 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+13,600, including 2 hires and the operating costs of this response.",
          "reliability": "The enterprise availability commitment and global merchant schedules make the window expensive.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("safe-migrations", "maintenance-window"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A declared downtime window can simplify a rare incompatible change. The enterprise availability commitment and global merchant schedules make the window expensive.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Evolve schemas with overlapping compatibility and bounded migrations. Next pressure: New enterprise catalogue requirements exceed the search semantics of ordinary order indexes."
    },
    {
      "id": "023-shortcut",
      "label": "Increase lock timeout and run one transaction",
      "description": "Let the deployment wait longer and backfill the whole table atomically.",
      "cost": 9100,
      "tone": "risky",
      "effects": {
        "users": 54000,
        "monthlyRevenue": 21000,
        "monthlyBurn": 18400,
        "engineers": 2,
        "reliability": -9,
        "customerTrust": -7,
        "complexity": 7,
        "xp": -30,
        "confidence": -12
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "One transaction offers a simple rollback boundary.",
        "downside": "Locks and WAL remain unbounded for the user journey and mixed-version clients still break.",
        "jimmyExplanation": "One transaction offers a simple rollback boundary. Locks and WAL remain unbounded for the user journey and mixed-version clients still break.",
        "effectReasons": {
          "upfrontCost": "$9,100 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+18,400, including 2 hires and the operating costs of this response.",
          "reliability": "Locks and WAL remain unbounded for the user journey and mixed-version clients still break.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("blocking-migration"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "One transaction offers a simple rollback boundary. Locks and WAL remain unbounded for the user journey and mixed-version clients still break.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Evolve schemas with overlapping compatibility and bounded migrations. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Long transactions and incompatible rolling changes block concurrent work; raw capacity is not the main limit.",
    "Evolve schemas with overlapping compatibility and bounded migrations."
  ],
  "lesson": "Evolve schemas with overlapping compatibility and bounded migrations."
});
