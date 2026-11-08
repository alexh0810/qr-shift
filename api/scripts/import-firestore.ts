import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { connect } from "../src/db/client.js";
import { diffRows, readAll, replaceAll, toRows, type FirestoreDoc } from "../src/import/firestore-import.js";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

initializeApp({
  credential: cert({
    projectId: requireEnv("FIREBASE_ADMIN_PROJECT_ID"),
    clientEmail: requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL"),
    privateKey: requireEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
});
const firestore = getFirestore();

async function readCollection(name: string): Promise<FirestoreDoc[]> {
  const snapshot = await firestore.collection(name).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

const rows = toRows({
  stores: await readCollection("stores"),
  employees: await readCollection("employees"),
  timelogs: await readCollection("timelogs"),
});
const db = connect(requireEnv("DATABASE_URL"));

await replaceAll(db, rows);
const differences = diffRows(rows, await readAll(db));
console.log(`Imported ${rows.stores.length} stores, ${rows.employees.length} employees, ${rows.timelogs.length} timelogs.`);
if (differences.length > 0) {
  console.error(`Parity check failed:\n${differences.join("\n")}`);
  process.exit(1);
}
console.log("Parity check passed: every Postgres row matches the rows mapped from Firestore.");
process.exit(0);
