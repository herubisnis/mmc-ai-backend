import admin from 'firebase-admin';
import { GenerativeModel } from '@google-generative-ai/api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Inisialisasi Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: 'googleapis.com',
    }),
  });
}

const db = admin.firestore();

// Inisialisasi model Gemini
const model = new GenerativeModel({
  model: 'gemini-1.5-flash', // Sesuaikan model
  apiKey: process.env.API_KEY,
});

// Fungsi untuk memulai listener Firestore
export const startFirestoreListener = () => {
  db.collection('gemini_requests')
    .where('status', '==', 'pending')
    .onSnapshot(async (snapshot) => {
      snapshot.forEach(async (doc) => {
        const data = doc.data();
        const { name, age, education, goal } = data;

        try {
          const inputData = `
            Nama: ${name}
            Umur: ${age}
            Pendidikan: ${education}
            Cita-cita: ${goal}
          `;

          const response = await model.generateMessage({
            prompt: `Tulis ulang biodata ini dan berikan saran terbaik: ${inputData}`,
          });

          const content = response.candidates?.[0]?.text || 'Tidak ada respons dari AI';

          await doc.ref.update({
            status: 'completed',
            result: content,
          });
        } catch (error) {
          await doc.ref.update({
            status: 'error',
            error: error.message,
          });
        }
      });
    });
};
