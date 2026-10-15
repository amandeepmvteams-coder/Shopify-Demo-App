import "dotenv/config";
import shopify from "../shopify.js";
import { startProductSyncWorker } from "./product-sync.worker.js";

const worker = startProductSyncWorker(shopify);

async function shutdown() {
  console.log("Shutting down product sync worker...");

  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

