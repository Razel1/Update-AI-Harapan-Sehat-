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
            "content": f"""Kamu adalah Dr. Anda, dokter umum senior di Klinik Harapan Sehat.
            
            Ini adalah hasil analisis medis internalmu: {thought}.
            
            INSTRUKSI FORMATTING (WAJIB DIIKUTI):
            1. Sampaikan saran kepada pasien berdasarkan hasil analisis tadi dengan bahasa yang empatik, profesional, dan menenangkan.
            2. FORMAT TAMPILAN:
               - Gunakan bullet points (-) untuk setiap daftar poin saran.
               - WAJIB berikan DUA KALI ENTER (spasi kosong) setelah setiap paragraf atau poin agar tidak menumpuk.
               - Gunakan bold (**) untuk poin penting.
            3. Ingatkan pasien untuk segera ke klinik jika kondisinya serius."""
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