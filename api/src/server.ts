import { buildApp } from "./app.js";
import { connect } from "./db/client.js";
import { firebaseAuth } from "./firebase-auth.js";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const app = buildApp({
  db: connect(requireEnv("DATABASE_URL")),
  auth: firebaseAuth(requireEnv("FIREBASE_PROJECT_ID")),
});
await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 8080) });
