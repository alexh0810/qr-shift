import { App, applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { loadEnvConfig } from "@next/env";

let envLoaded = false;

function loadServerEnv() {
  if (envLoaded) {
    return;
  }

  try {
    loadEnvConfig(process.cwd());
  } catch {
    // Next loads env automatically for app routes; standalone scripts may not have @next/env available.
  }

  envLoaded = true;
}

loadServerEnv();

function getAdminCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  return applicationDefault();
}

function createAdminApp(): App {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT;

  return initializeApp({
    credential: getAdminCredential(),
    projectId,
  });
}

const adminApp = getApps()[0] ?? createAdminApp();

export const adminDb: Firestore = getFirestore(adminApp);
