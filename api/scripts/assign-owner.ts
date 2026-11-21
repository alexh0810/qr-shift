import { connect } from "../src/db/client.js";
import { assignOwnerToAllStores } from "../src/db/repo.js";

const email = process.env.OWNER_EMAIL?.trim();
const databaseUrl = process.env.DATABASE_URL;
if (!email || !email.includes("@")) {
  throw new Error("OWNER_EMAIL is required");
}
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const count = await assignOwnerToAllStores(connect(databaseUrl), email);
console.log(`${email.toLowerCase()} is now owner of ${count} ${count === 1 ? "store" : "stores"} on ${new URL(databaseUrl).host}.`);
process.exit(0);
