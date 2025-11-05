// Firebase Messaging Service Worker
// This file must be served from the root of the domain

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase configuration - these values should match your Firebase project
// Note: Service workers can't access environment variables, so we use the actual values
// For staging/production, these should be injected at build time or fetched from an API
firebase.initializeApp({
  apiKey: "AIzaSyDsbnAk1OxQlbVkOx5QGpJgZpUWyCOj0nY",
  authDomain: "litit-chat.firebaseapp.com",
  projectId: "litit-chat",
  messagingSenderId: "1032753364723",
  appId: "1:1032753364723:web:cd636694bc9613d7430186",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("🔕 Received background message", payload);
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icons/icon-192x192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

