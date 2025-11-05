import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Load your service account key
const keyPath = path.resolve(__dirname, "./serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function setAIOnline() {
  const usersSnap = await db.collection("users").where("isAI", "==", true).get();

  if (usersSnap.empty) {
    console.log("No AI users found.");
    return;
  }

  const updates = usersSnap.docs.map(async (doc) => {
    await doc.ref.update({ status: "online", lastSeen: new Date() });
    console.log(`✅ ${doc.data().username} marked online`);
  });

  await Promise.all(updates);
  console.log("🎉 All AI profiles set to online");
  process.exit(0);
}

setAIOnline().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
