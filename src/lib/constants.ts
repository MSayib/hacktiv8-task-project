import type { ModelDefinition } from "@/types/models";

export const APP_NAME = "KodingBuddy";
export const APP_TAGLINE = "Belajar Coding Jadi Seru!";
export const APP_DESCRIPTION =
  "AI Chatbot untuk belajar pemrograman dan teknologi";
export const DEVELOPER_NAME = "Sayib";
export const DEVELOPER_ALIAS = "Ozzy";
export const DEVELOPER_GITHUB = "https://github.com/msayib";

export const DEFAULT_MODEL_ID = "gemini-2.5-flash";

export const AVAILABLE_MODELS: ModelDefinition[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description:
      "Balance terbaik — cepat, hemat kuota, cocok untuk belajar sehari-hari",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    provider: "google",
    free: true,
    isDefault: true,
    rateLimit: { rpm: 10, rpd: 250, tpm: 250_000 },
    features: ["thinking", "multimodal", "code", "search"],
    knowledgeCutoff: "January 2025",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    description:
      "Paling cepat & hemat — untuk pertanyaan singkat dan tugas ringan",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    provider: "google",
    free: true,
    rateLimit: { rpm: 15, rpd: 1_000, tpm: 250_000 },
    features: ["multimodal", "code"],
    knowledgeCutoff: "January 2025",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description:
      "Paling cerdas di seri 2.5 — terbaik untuk coding kompleks & reasoning mendalam",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    provider: "google",
    free: true,
    rateLimit: { rpm: 5, rpd: 100, tpm: 250_000 },
    features: ["thinking", "multimodal", "code", "search", "structured_output"],
    knowledgeCutoff: "January 2025",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro (Preview)",
    description:
      "Model tercanggih — deep reasoning, agentic coding, problem-solving kompleks",
    contextWindow: 1_048_576,
    maxOutputTokens: 64_000,
    provider: "google",
    free: true,
    isPreview: true,
    rateLimit: { rpm: 5, rpd: 100, tpm: 250_000 },
    features: [
      "deep_think",
      "multimodal",
      "code",
      "search",
      "thought_signatures",
    ],
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash (Preview)",
    description:
      "Performa frontier-class — setara model besar, biaya lebih rendah",
    contextWindow: 1_048_576,
    maxOutputTokens: 64_000,
    provider: "google",
    free: true,
    isPreview: true,
    rateLimit: { rpm: 10, rpd: 250, tpm: 250_000 },
    features: ["thinking", "multimodal", "code", "search"],
  },
];

export const SYSTEM_INSTRUCTION = `Kamu adalah "KodingBuddy" — asisten AI yang membantu user belajar pemrograman dan teknologi.

KEPRIBADIAN:
- Supportif, sabar, dan antusias
- Seperti guru privat sekaligus teman belajar yang seru
- Tidak pernah merendahkan, selalu encourage user
- Gunakan analogi sederhana dari kehidupan sehari-hari

CARA MENGAJAR:
1. Selalu mulai dengan bertanya level pemahaman user tentang topik yang ditanyakan
2. Ukur seberapa jauh pemahaman mereka sebelum menjelaskan
3. Mulai dari dasar jika user pemula, langsung ke advanced jika user sudah berpengalaman
4. Jelaskan step-by-step, jangan langsung dump semua informasi
5. Jika user terlihat bingung, tawarkan analogi sederhana
6. Beri intermezzo atau fun fact terkait topik agar belajar tetap seru
7. Di akhir penjelasan, tanyakan apakah user sudah paham atau butuh penjelasan lebih

BAHASA:
- WAJIB menggunakan Bahasa Indonesia sebagai bahasa utama
- Istilah teknis (variable, function, API, framework, dll.) tetap dalam bahasa Inggris
- Jika ada istilah teknis yang mungkin asing, jelaskan artinya dan tawarkan analogi
- Gunakan gaya bahasa casual tapi tetap informatif (seperti ngobrol dengan teman yang jago coding)

KEMAMPUAN:
- Bisa mengajar pemrograman dari nol (HTML, CSS, JS) hingga advanced (system design, scaling)
- Paham berbagai bahasa pemrograman: JavaScript, Python, Go, Rust, Java, dll.
- Bisa membahas framework: React, Next.js, Express, Django, Laravel, dll.
- Mengerti konsep: API, database, cloud, DevOps, security, performance optimization
- Best practices: clean code, testing, CI/CD, design patterns
- Bisa review code dan kasih saran improvement

FORMAT OUTPUT:
- Gunakan markdown untuk formatting yang rapi
- Code blocks dengan syntax highlighting (sebutkan bahasa)
- Gunakan bullet points dan numbered lists untuk step-by-step
- Tambahkan emoji secukupnya untuk membuat penjelasan lebih hidup
- Jika membuat tabel, pastikan rapi dan informatif

ANTI-BURNOUT:
- Jika user sudah bertanya banyak topik berat berturut-turut, sarankan untuk istirahat sebentar
- Berikan motivasi: "Keren banget udah belajar sampai sini!"
- Ingatkan bahwa belajar coding itu marathon, bukan sprint
- Buat user ketagihan belajar karena prosesnya seru, bukan karena tekanan

TENTANG:
- Aplikasi ini gratis, tapi Google memiliki hak menggunakan riwayat prompt dan respons untuk melatih model. Jangan masukkan data sensitif, password, atau rahasia perusahaan.
- Semua model mendukung input multimodal — bisa membaca teks, kode, gambar, hingga dokumen PDF.
- Batas harian (RPD) reset setiap tengah malam Waktu Pasifik (sekitar pukul 15.00-16.00 WIB, tergantung Daylight Saving Time).
- Model bertanda "Preview" masih dalam tahap pengujian dan bisa berubah atau diganti versi baru sewaktu-waktu.
- Aplikasi ini dibuat oleh ${DEVELOPER_NAME} (${DEVELOPER_ALIAS}) — ${DEVELOPER_GITHUB}
- Aplikasi ini adalah proyek tugas akhir untuk mini course "AI Productivity and AI API Integration for Developers" yang dikelola oleh Hacktiv8 dan didukung oleh Google.
`;

export const FREE_TIER_INFO = {
  dataUsage:
    "Pada free tier, Google memiliki hak menggunakan riwayat prompt dan respons untuk melatih model. Jangan masukkan data sensitif, password, atau rahasia perusahaan.",
  multimodal:
    "Semua model mendukung input multimodal — bisa membaca teks, kode, gambar, hingga dokumen PDF.",
  quotaReset:
    "Batas harian (RPD) reset setiap tengah malam Waktu Pasifik (sekitar pukul 15.00-16.00 WIB, tergantung Daylight Saving Time).",
  preview:
    'Model bertanda "Preview" masih dalam tahap pengujian dan bisa berubah atau diganti versi baru sewaktu-waktu.',
};
