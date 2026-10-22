import { persistItemsToDB } from "../youtube-sentinel-storage.js";
import { initApiDatabase } from "../db.js";
import { scanYoutube } from "@empire/batteries-world-monitor";
import { YoutubeSentinelItemModel } from "@empire/batteries-base";

async function main() {
  initApiDatabase();
  console.log("Running scan...");
  const scan = await scanYoutube({ query: "dukun santet", limit: 5 });
  console.log("Scanned:", scan.items.length);
  await persistItemsToDB(scan.items, scan.crawlerMode);
  const count = await YoutubeSentinelItemModel.query().count("* as count");
  console.log("Total items in DB now:", count[0]);
  process.exit(0);
}

void main();
