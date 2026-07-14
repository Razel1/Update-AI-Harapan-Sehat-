from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import litellm
import os

# --- PENGATURAN AMAN: Mengambil Key dari Environment Variable ---
# Di server (Render/Vercel), kita akan isi ini lewat dashboard mereka.
api_key = os.getenv("GROQ_API_KEY")

print(f"DEBUG: API Key detected? {'YES' if api_key else 'NO'}")
if api_key:
    print(f"DEBUG: API Key length is {len(api_key)}")

app = FastAPI()

# Konfigurasi CORS agar bisa diakses dari web/frontend
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

@app.post("/konsultasi")
async def konsultasi(request: Request):
    try:
        data = await request.json()
        raw_messages = data.get("messages", []) 

        # --- LANGKAH 1: Penerjemah Role ---
        clean_messages = [{"role": "assistant" if msg["role"] == "doctor" else "user", "content": msg["content"]} for msg in raw_messages]

        # --- LANGKAH 2: REFLECTION (AI Berpikir) ---
        thought_prompt = {
            "role": "system",
            "content": "Kamu adalah asisten medis yang super teliti. Analisis gejala pasien: identifikasi potensi risiko, pikirkan pertolongan pertama yang aman, dan pastikan tidak ada saran berbahaya. Jangan jawab pasien sekarang, cukup tuliskan analisis berpikirmu saja secara internal."
        }
        
        thought_response = litellm.completion(
            model="groq/llama-3.3-70b-versatile",
            messages=[thought_prompt] + clean_messages,
            api_key=api_key
        )
        thought = thought_response.choices[0].message.content

        # --- LANGKAH 3: RESPONDING (AI Menjawab dengan rapi) ---
        final_prompt = {
            "role": "system",
            "content": f"""Kamu adalah Dr. Andi, Dokter Umum di Klinik Harapan Sehat. Analisis gejala pasien dan berikan saran pencegahan. 

ATURAN UTAMA:
Jawab dengan SANGAT SINGKAT, PADAT, dan JELAS. Langsung ke intinya (*to the point*). Jangan gunakan paragraf panjang.

BATASAN MEDIS:
1. Hanya sarankan obat bebas (Paracetamol, dll) atau perawatan alami. JANGAN resepkan obat keras.
2. Jika gejalanya gawat darurat (sesak napas, nyeri dada berat, pendarahan), hentikan analisis dan perintahkan pasien SEGERA ke IGD!

FORMAT JAWABAN (WAJIB DIIKUTI):
1. Kemungkinan: (Tulis 1 kalimat tebakan kondisi awalnya).
2. Lakukan ini: (Berikan 2-3 poin singkat cara meredakan/mencegah makin parah).
3. Peringatan: (Tulis 1 kalimat peringatan untuk periksa ke Klinik Harapan Sehat jika tidak membaik dalam X hari)."""
        }
        
        final_response = litellm.completion(
            model="groq/llama-3.3-70b-versatile",
            messages=[final_prompt] + clean_messages,
            api_key=api_key
        )
        
        return {"pesan": final_response.choices[0].message.content}

    except Exception as e:
        print(f"Error terjadi: {e}")
        return {"pesan": "Maaf, sistem sedang sibuk. Silakan coba kirim ulang ya."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
