import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const keyPath = path.resolve(__dirname, "./serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();


const users = JSON.parse(fs.readFileSync("./scripts/seed/users.json", "utf8"));

async function seed() {
  for (const [index, u] of users.entries()) {
    const docRef = db.collection("users").doc();
    await docRef.set({
      firstName: u.firstName,
      lastName: u.lastName,
      displayName: `${u.firstName} ${u.lastName}`.trim(),
      username: u.username,
      email: u.email,
      dateOfBirth: u.birthdate, // For age calculation
      birthdate: u.birthdate,   // Backward compatibility
      ageCategory: u.ageCategory,
      countryCode: u.countryCode,
      gender: u.gender,
      language: u.language,
      city: u.city,
      bio: u.bio,
      introScript: u.introScript,
      replyScript: u.replyScript,
      photoURL: `https://litit-chat-cdn.b-cdn.net/seed/profiles/${u.photo}`,
      photoUrl: `https://litit-chat-cdn.b-cdn.net/seed/profiles/${u.photo}`, // backward compatibility
      location: {
        city: u.city,
        country: getCountryName(u.countryCode),
      },
      status: 'online',
      stars: 0,
      tier: 'free',
      verified: true,
      isAI: true,           // internal flag (do NOT expose on client)
      aiPersonality: getPersonalityFromBio(u.bio),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Seeded user ${index + 1}: ${u.username}`);
  }
}

// Helper to get country name from code
function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    'US': 'United States',
    'PH': 'Philippines',
    'TH': 'Thailand',
    'MY': 'Malaysia',
    'KH': 'Cambodia',
    'VN': 'Vietnam',
    'ID': 'Indonesia',
    'SG': 'Singapore',
  };
  return countries[code] || code;
}

// Helper to determine personality from bio
function getPersonalityFromBio(bio: string): string {
  const lowerBio = bio.toLowerCase();
  if (lowerBio.includes('fun') || lowerBio.includes('chaos') || lowerBio.includes('crazy')) return 'fun';
  if (lowerBio.includes('flirt') || lowerBio.includes('cute') || lowerBio.includes('charm')) return 'flirty';
  if (lowerBio.includes('support') || lowerBio.includes('listen') || lowerBio.includes('friend')) return 'supportive';
  if (lowerBio.includes('art') || lowerBio.includes('creative') || lowerBio.includes('design')) return 'creative';
  return 'fun'; // default
}
seed();
