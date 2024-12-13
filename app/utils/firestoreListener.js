import admin from 'firebase-admin';
import { GenerativeModel } from '@google-generative-ai/api'; // Pastikan ini adalah library yang benar

// Inisialisasi Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'if22dx-22312004',
      clientEmail: 'herubisnis40865@gmail.com',
      privateKey: 'AIzaSyAcz9ZIIqrXWosFFcxBpsafDTjEyqgETBo'.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// Inisialisasi model Gemini
const model = new GenerativeModel({
  model: 'gemini-1.5-flash', // Sesuaikan model
  apiKey: 'AIzaSyANXT8yWyVRXa99ypFSpN_nGBWqii2tGtw', // Ganti dengan API Key Anda
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
          // Format input untuk Gemini
          const inputData = `
            Nama: ${name}
            Umur: ${age}
            Pendidikan: ${education}
            Cita-cita: ${goal}
          `;

          // Panggil API Gemini menggunakan library
          const response = await model.generateMessage({
            prompt: `Tulis ulang biodata ini dan berikan saran terbaik: ${inputData}`,
          });

          const content = response.candidates?.[0]?.text || 'Tidak ada respons dari AI';

          // Perbarui status dan hasil di Firestore
          await doc.ref.update({
            status: 'completed',
            result: content,
          });
        } catch (error) {
          // Perbarui status dengan error jika terjadi kegagalan
          await doc.ref.update({
            status: 'error',
            error: error.message,
          });
        }
      });
    });
};
