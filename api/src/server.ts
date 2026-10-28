import { buildApp } from "./app.js";
import { connect } from "./db/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const app = buildApp({ db: connect(databaseUrl) });
await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 8080) });
