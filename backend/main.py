from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List
import openai
import os
import PyPDF2
import io

app = FastAPI()

# Set OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY", "your-api-key-here")

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/brief")
async def summarize_pdf(file: UploadFile = File(...)):
    try:
        # Read PDF file
        contents = await file.read()
        reader = PyPDF2.PdfReader(io.BytesIO(contents))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        if not text.strip():
            return {"summary": "No extractable text found in PDF."}
        # Truncate to 3000 tokens (about 12,000 chars) for GPT-4 Turbo
        text = text[:12000]
        # Call OpenAI GPT-4 Turbo
        response = openai.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are a military operations analyst. Summarize this mission document for a command staff in 5 bullet points."},
                {"role": "user", "content": text}
            ],
            max_tokens=400
        )
        summary = response.choices[0].message.content.strip()
        return {"summary": summary}
    except Exception as e:
        return {"summary": f"Error: {str(e)}"}

@app.post("/api/plan")
async def mission_plan(prompt: str = Form(...)):
    # Placeholder: In real app, call GPT
    return {"plan": f"[AI-generated plan for: '{prompt}']"}

@app.get("/api/logs")
async def get_logs():
    # Placeholder logs
    return {"logs": ["Mission started", "Intel received", "Evac initiated"]}

@app.get("/api/briefs")
async def get_briefs():
    # Placeholder briefs
    return {"briefs": ["SITREP: All clear", "CONOPS: Proceed to LZ"]}
