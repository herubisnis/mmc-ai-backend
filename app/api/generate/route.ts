import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { startFirestoreListener } from '../../utils/firestoreListener';

let listenerStarted = false;

// Inisialisasi Google Generative AI dengan API Key
const genAI = new GoogleGenerativeAI("AIzaSyANXT8yWyVRXa99ypFSpN_nGBWqii2tGtw");

// Konfigurasi model yang digunakan
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(request: Request) {
    if (!listenerStarted) {
        startFirestoreListener();
        listenerStarted = true; // Pastikan listener hanya dijalankan sekali
        console.log('Firestore Listener Started');
      }
  try {
    // Ambil data dari body request
    const body = await request.json();
    const { name, age, education, goal } = body;

    // Format input untuk Gemini
    const inputData = `
      Nama: ${name},
      Umur: ${age},
      Pendidikan: ${education},
      Cita-cita: ${goal}
    `;

    // Generate respons dari Gemini
    const result = await model.generateContent(
      `Tulis ulang biodata berikut dan berikan saran terbaik untuk meraih cita-cita: ${inputData}`
    );

    // Ambil teks respons
    const content = result.response?.text() || "Tidak ada respons dari Gemini";

    // Kirim respons ke client
    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    // Tangani error dengan memastikan tipe error sebagai Error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("Terjadi kesalahan:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
