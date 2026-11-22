import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";
import { Todo, Project } from "@/types";

interface ChatRequestBody {
  message: string;
  history?: { role: "user" | "model"; content: string }[];
  workspaceName?: string;
  tasks?: Todo[];
  projects?: Project[];
}

export async function POST(req: Request) {
  try {
    const body: ChatRequestBody = await req.json();
    const { message, history = [], workspaceName = "Workspace", tasks = [], projects = [] } = body;

    // Build task context string
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const taskContextSummary = tasks.length > 0
      ? tasks.map((t) => {
          const projectName = projectMap.get(t.project_id) ?? "Umum";
          const subtaskStatus = t.subtasks && t.subtasks.length > 0
            ? ` (${t.subtasks.filter((s) => s.is_done).length}/${t.subtasks.length} checklist)`
            : "";
          return `- [${t.status.toUpperCase()}] "${t.title}" | Proyek: ${projectName} | Prioritas: ${t.priority.toUpperCase()} | Deadline: ${t.due_date ?? "Tidak ada"}${subtaskStatus}`;
        }).join("\n")
      : "Belum ada task di workspace ini.";

    // Current date reference
    const now = new Date();
    const todayDateStr = now.toISOString().split("T")[0];
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayDayName = dayNames[now.getDay()];

    const systemPrompt = `Kamu adalah TaskFlow AI Assistant.
Tugas utamamu adalah membantu pengguna dalam mengelola produktivitas, tugas, jadwal, dan proyek secara efisien.

WAKTU SISTEM SAAT INI:
- Hari & Tanggal Hari Ini: ${todayDayName}, ${todayDateStr}

KONTEKS WORKSPACE PENGGUNA:
- Nama Workspace: "${workspaceName}"
- Total Tugas: ${tasks.length}
- Rincian Tugas Saat Ini:
${taskContextSummary}

PANDUAN FORMAT (SANGAT PENTING):
1. DILARANG menggunakan emoji atau emotikon apapun dalam teks biasa. Jawaban harus bersih tanpa ikon visual seperti api, grafik, tangan, jam, roket, dll.
2. JANGAN gunakan format simbol berlebihan seperti tanda bintang ganda **, tanda pagar ###, atau bintang miring ganda. Tulis dalam teks biasa yang bersih dan mudah dibaca.
3. Jika membuat daftar atau poin, gunakan nomor urut sederhana (1., 2., 3.) atau tanda strip (-) biasa.
4. Tulis jawaban dengan gaya profesional, ringkas, jelas, dan langsung ke inti permasalahan dalam Bahasa Indonesia.

FITUR UTAMA: PEMBUATAN TUGAS & JADWAL OTOMATIS DARI CURHAT PENGGUNA
Jika pengguna bermaksud membuat tugas baru, mencatat kegiatan/ujian/kumpul tugas, atau curhat mengenai hal yang harus dikerjakan:
1. Berikan respon berupa tanggapan atau saran singkat yang bersahabat dalam teks biasa.
2. Di bagian PALING BAWAH pesanmu, sertakan blok JSON usulan tugas persis seperti ini:
\`\`\`json:task_proposal
{
  "title": "Judul tugas yang ringkas dan jelas",
  "description": "Deskripsi atau rincian kegiatan",
  "priority": "low" | "medium" | "high",
  "due_date": "YYYY-MM-DD",
  "subtasks": ["Langkah 1", "Langkah 2", "Langkah 3"]
}
\`\`\`
Perhitungan tanggal due_date (berdasarkan referensi hari ini ${todayDateStr}):
- Jika pengguna menyebut 'hari ini', due_date adalah ${todayDateStr}.
- Jika menyebut 'besok', hitung H+1.
- Jika menyebut 'lusa', hitung H+2.
- Jika menyebut hari tertentu (misal 'senin', 'rabu'), hitung tanggal hari tersebut ke depan.
- DILARANG menggunakan tanggal sebelum hari ini (${todayDateStr}). Jika pengguna menyebut hari kemarin atau tanggal lampau, selalu gunakan tanggal hari ini (${todayDateStr}) atau tanggal ke depan.
- Jika tidak ada tenggat waktu tertentu, gunakan estimasi wajar 2-3 hari ke depan atau null.
JANGAN sertakan blok json:task_proposal jika pengguna hanya bertanya umum tanpa maksud mencatat atau menjadwalkan tugas.`;

    // 1. Prioritize Groq API for ultra-fast, high-quality responses
    if (groq) {
      try {
        const groqMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: systemPrompt },
          ...history.map((h) => ({
            role: (h.role === "model" ? "assistant" : "user") as "user" | "assistant",
            content: h.content,
          })),
          { role: "user", content: message },
        ];

        const chatCompletion = await groq.chat.completions.create({
          messages: groqMessages,
          model: "qwen/qwen3.8-27b",
          temperature: 0.6,
          max_tokens: 1024,
        });

        const reply = chatCompletion.choices[0]?.message?.content || "";
        return NextResponse.json({
          reply,
          source: "groq-qwen3.8-27b",
        });
      } catch (groqError) {
        console.warn("Groq API call encountered an issue, activating fallback:", groqError);
      }
    }

    // 2. Intelligent local rule-based fallback
    const lower = message.toLowerCase();
    let reply = "";

    const highPriorityTodos = tasks.filter((t) => t.priority === "high" && t.status !== "done");
    const pendingTodos = tasks.filter((t) => t.status !== "done");
    const doneTodos = tasks.filter((t) => t.status === "done");

    if (
      lower.includes("buat") ||
      lower.includes("jadwal") ||
      lower.includes("kumpul") ||
      lower.includes("ulangan") ||
      lower.includes("pr") ||
      lower.includes("ingetin") ||
      lower.includes("catat")
    ) {
      // Hitung due date
      const targetDate = new Date(now);
      if (lower.includes("lusa")) {
        targetDate.setDate(targetDate.getDate() + 2);
      } else if (lower.includes("besok")) {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (lower.includes("minggu depan")) {
        targetDate.setDate(targetDate.getDate() + 7);
      } else if (!lower.includes("hari ini")) {
        targetDate.setDate(targetDate.getDate() + 2);
      }
      const dueDateFormatted = targetDate.toISOString().split("T")[0];

      // Tentukan judul dari pesan
      let taskTitle = message.replace(/(tolong|bantu|buatkan|jadwalkan|catat|ingetin|saya|aku)\s+/gi, "").trim();
      if (taskTitle.length > 50) {
        taskTitle = taskTitle.slice(0, 50) + "...";
      }
      taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);

      const isHighPriority = lower.includes("penting") || lower.includes("mendesak") || lower.includes("segera") || lower.includes("ulangan") || lower.includes("ujian");

      reply = `Saya telah mencatat rencana tugasmu. Berikut usulan tugas dan jadwal yang telah disiapkan:\n\n` +
        `Judul: ${taskTitle}\n` +
        `Prioritas: ${isHighPriority ? "Tinggi (High)" : "Menengah (Medium)"}\n` +
        `Tenggat Waktu: ${dueDateFormatted}\n\n` +
        `Silakan klik tombol Simpan ke Board & Kalender pada kartu di bawah ini untuk memasukkannya ke workspace "${workspaceName}".\n\n` +
        `\`\`\`json:task_proposal\n` +
        JSON.stringify(
          {
            title: taskTitle,
            description: message,
            priority: isHighPriority ? "high" : "medium",
            due_date: dueDateFormatted,
            subtasks: [
              "Pelajari materi dan kumpulkan bahan referensi",
              "Selesaikan pengerjaan utama",
              "Review dan cek kelengkapan tugas"
            ],
          },
          null,
          2
        ) +
        `\n\`\`\``;
    } else if (lower.includes("prioritas") || lower.includes("dulu") || lower.includes("hari ini")) {
      if (highPriorityTodos.length > 0) {
        reply = `Berdasarkan analisis tugas di workspace "${workspaceName}", berikut urutan prioritas yang disarankan hari ini:\n\n` +
          highPriorityTodos.map((t, idx) => `${idx + 1}. ${t.title} (Prioritas: Tinggi)\n   Proyek: ${projectMap.get(t.project_id) ?? "Umum"} | Tenggat: ${t.due_date ?? "Segera"}\n   Alasan: Tugas ini memiliki dampak terbesar terhadap progres saat ini.`).join("\n\n") +
          `\n\nSaran: Selesaikan satu tugas prioritas utama di atas terlebih dahulu sebelum beralih ke tugas lain.`;
      } else if (pendingTodos.length > 0) {
        reply = `Saat ini tidak ada tugas dengan prioritas tinggi yang tertunda di workspace "${workspaceName}".\n\nKamu dapat melanjutkan tugas yang sedang berjalan berikut:\n\n` +
          pendingTodos.slice(0, 3).map((t, idx) => `${idx + 1}. ${t.title} (${t.status})`).join("\n");
      } else {
        reply = `Semua tugas di workspace "${workspaceName}" telah selesai dikerjakan. Kamu dapat mulai merencanakan tugas berikutnya melalui tombol Tambah Task.`;
      }
    } else if (lower.includes("breakdown") || lower.includes("subtask") || lower.includes("langkah")) {
      const targetTodo = highPriorityTodos[0] ?? pendingTodos[0];
      if (targetTodo) {
        reply = `Rincian langkah pengerjaan untuk tugas "${targetTodo.title}":\n\n` +
          `1. Analisis Kebutuhan: Identifikasi target utama dan spesifikasi yang diperlukan.\n` +
          `2. Kerangka Kerja: Buat struktur awal atau fondasi dasar pekerjaan.\n` +
          `3. Implementasi Inti: Kerjakan bagian fungsional yang paling krusial.\n` +
          `4. Pengujian dan Validasi: Periksa kembali hasil kerja untuk memastikan tidak ada kendala.\n` +
          `5. Finalisasi: Rapikan checklist dan perbarui status di Kanban board.\n\n` +
          `Langkah-langkah di atas dapat kamu masukkan langsung sebagai checklist subtask.`;
      } else {
        reply = `Belum ada tugas aktif untuk diuraikan. Silakan buat tugas baru terlebih dahulu.`;
      }
    } else if (lower.includes("jadwal") || lower.includes("deadline") || lower.includes("minggu")) {
      reply = `Analisis beban kerja dan tenggat waktu di "${workspaceName}":\n\n` +
        `- Total tugas aktif: ${pendingTodos.length} tugas\n` +
        `- Selesai dikerjakan: ${doneTodos.length} tugas\n` +
        `- Tugas prioritas tinggi: ${highPriorityTodos.length} tugas\n\n` +
        `Rekomendasi alokasi waktu:\n` +
        `1. Pagi (08:00 - 11:30): Fokus penuh pada tugas prioritas tinggi yang butuh konsentrasi mendalam.\n` +
        `2. Siang (13:00 - 15:30): Lanjutkan tugas menengah, checklist subtask, atau koordinasi tim.\n` +
        `3. Sore (16:00 - 17:00): Evaluasi progres harian dan perbarui status tugas ke Done.`;
    } else {
      reply = `Halo, saya Assistant TaskFlow. Saya dapat membantu mengelola produktivitas di workspace "${workspaceName}".\n\nBerikut beberapa hal yang bisa kamu tanyakan:\n\n` +
        `- Tugas mana yang paling mendesak hari ini?\n` +
        `- Bantu buatkan rincian langkah kerja untuk tugas saya\n` +
        `- Analisis beban kerja dan tenggat waktu minggu ini\n` +
        `- Rekomendasi pembagian waktu kerja yang optimal\n\n` +
        `Silakan ketik pertanyaanmu di bawah atau pilih salah satu kartu rekomendasi di atas.`;
    }

    return NextResponse.json({
      reply,
      source: "local-intelligent-fallback",
    });
  } catch (error) {
    console.error("AI Chat Route Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pesan AI. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
