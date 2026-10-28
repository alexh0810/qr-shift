import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "../src/lib/firebase-admin";
import { hashPin } from "../src/lib/pin-hash";

function printAdminCredentialHelp() {
  console.error("");
  console.error("This script needs Firebase Admin credentials.");
  console.error("Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY");
  console.error("in your .env.local file, or authenticate with Google application default credentials.");
}

async function main() {
  const snapshot = await adminDb.collection("stores").get();
  const storesToMigrate = snapshot.docs.filter((document) => typeof document.data().pin === "string");

  if (storesToMigrate.length === 0) {
    console.log("No plaintext store PINs found.");
    return;
  }

  console.log(`Migrating ${storesToMigrate.length} store PINs...`);

  let migrated = 0;
  let batch = adminDb.batch();
  let batchCount = 0;

  for (const document of storesToMigrate) {
    const pin = document.data().pin as string;
    const pinHash = await hashPin(pin);

    batch.update(document.ref, {
      pin_hash: pinHash,
      pin: FieldValue.delete(),
    });

    batchCount += 1;
    migrated += 1;

    if (batchCount === 400) {
      await batch.commit();
      batch = adminDb.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Migrated ${migrated} store PINs.`);
}

main().catch((error) => {
  console.error("PIN migration failed.");
  console.error(error);

  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("Could not load the default credentials") ||
    message.includes("Unable to detect a Project Id")
  ) {
    printAdminCredentialHelp();
  }

  process.exit(1);
});
