export { CalculationService } from "./calculationService";
export { InvCalculationService } from "./invCalculationService";
export * from "./dataService";
/*
 * `hypixelService` used to be re-exported here. It fetched
 * api.skyshards.com/skyshards/profile/<username> and is gone: that origin sends
 * no CORS headers, so the call only ever worked behind the Vite dev proxy and
 * was dead in any built site. Its replacement is `src/shards/profileImport.ts`,
 * which reads api.hypixel.net directly with the player's own key.
 */
