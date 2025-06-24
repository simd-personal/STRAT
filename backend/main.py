from fastapi import FastAPI, File, UploadFile, Form, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List
import openai
import os
from dotenv import load_dotenv
import PyPDF2
import io
import re
import datetime

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Set OpenAI API key from environment variable
openai_api_key = os.getenv("OPENAI_API_KEY", "your-api-key-here")
client = openai.OpenAI(api_key=openai_api_key)

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory log store (replace with DB for production)
mission_logs = []

def log_event(event_type, message, details=None):
    mission_logs.append({
        "timestamp": datetime.datetime.utcnow().isoformat() + 'Z',
        "event_type": event_type,
        "message": message,
        "details": details or {}
    })

@app.post("/api/brief")
async def summarize_pdf(file: UploadFile = File(...)):
    try:
        # Read PDF file
        contents = await file.read()
        reader = PyPDF2.PdfReader(io.BytesIO(contents))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        if not text.strip():
            log_event("Intel", "PDF upload failed: No extractable text", {})
            return {"summary": "No extractable text found in PDF."}
        
        # Truncate to 3000 tokens (about 12,000 chars) for GPT-4 Turbo
        text = text[:12000]
        
        # Improved system prompt for better summary
        system_prompt = (
            """
            You are a senior military operations analyst. Summarize the following mission document for a command staff in exactly 5 bullet points with bolded categories. Use concise, high-level military language. Format each bullet as:
            
            **CATEGORY:** Key information
            
            Categories to use: OBJECTIVE, ASSETS, PHASES, INTEL, CONTINGENCIES
            """
        )
        
        # Get summary from OpenAI (new API)
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            max_tokens=500,
            temperature=0.3
        )
        
        summary = response.choices[0].message.content.strip()
        
        # Extract coordinates from the PDF text
        lat, lng = extract_coordinates(text)
        # Extract location name (e.g., after 'Location:' or 'LZ')
        location_name = extract_location_name(text)
        # Extract city and country if present
        city, country = extract_city_country(text)
        log_event("Intel", "PDF summarized and location extracted", {
            "summary": summary,
            "lat": lat, "lng": lng, "location_name": location_name, "city": city, "country": country
        })
        return {
            "summary": summary,
            "lat": lat,
            "lng": lng,
            "location_name": location_name,
            "city": city,
            "country": country
        }
        
    except Exception as e:
        log_event("System", f"Error processing PDF: {str(e)}")
        return {"summary": f"Error processing PDF: {str(e)}"}

def extract_coordinates(text):
    """
    Extract latitude and longitude from text using various coordinate formats.
    Returns (lat, lng) tuple or (None, None) if not found.
    """
    # Pattern 1: Decimal degrees with degree symbol and direction (e.g., 55.7569° N, 37.6151° E)
    dd_deg_dir_pattern = r'([+-]?\d+\.\d+)\s*[°º]?\s*([NSns]),?\s*([+-]?\d+\.\d+)\s*[°º]?\s*([EWew])'
    match = re.search(dd_deg_dir_pattern, text)
    if match:
        lat_val = float(match.group(1))
        lat_dir = match.group(2).upper()
        lng_val = float(match.group(3))
        lng_dir = match.group(4).upper()
        lat = lat_val if lat_dir == 'N' else -lat_val
        lng = lng_val if lng_dir == 'E' else -lng_val
        return lat, lng
    # Pattern 2: Decimal degrees without direction (assume N/E)
    dd_simple = r'([+-]?\d+\.\d+)[,\s]+([+-]?\d+\.\d+)'
    match = re.search(dd_simple, text)
    if match:
        lat = float(match.group(1))
        lng = float(match.group(2))
        if -90 <= lat <= 90 and -180 <= lng <= 180:
            return lat, lng
    # Pattern 3: Degrees, Minutes, Seconds (DMS)
    dms_pattern = r"(\d+)°(\d+)'(\d+)\"([NSns]),?\s*(\d+)°(\d+)'(\d+)\"([EWew])"
    match = re.search(dms_pattern, text)
    if match:
        lat_deg = int(match.group(1))
        lat_min = int(match.group(2))
        lat_sec = int(match.group(3))
        lat_dir = match.group(4).upper()
        lng_deg = int(match.group(5))
        lng_min = int(match.group(6))
        lng_sec = int(match.group(7))
        lng_dir = match.group(8).upper()
        lat = lat_deg + lat_min/60 + lat_sec/3600
        lat = lat if lat_dir == 'N' else -lat
        lng = lng_deg + lng_min/60 + lng_sec/3600
        lng = lng if lng_dir == 'E' else -lng
        return lat, lng
    # Pattern 4: Military Grid Reference System (MGRS) - basic extraction
    mgrs_pattern = r'(\d{1,2}[A-Z])\s+([A-Z]{2})\s+(\d{4})\s+(\d{4})'
    match = re.search(mgrs_pattern, text)
    if match:
        return 39.8283, -98.5795  # Default to US center
    return None, None

def extract_location_name(text):
    # Try to extract after 'Location:' or 'Location**:' or 'LZ' (case-insensitive)
    match = re.search(r'Location[:\s\*]*([A-Za-z0-9 ,\-\(\)]+)', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    match = re.search(r'LZ\s+([A-Za-z0-9]+)', text)
    if match:
        return 'LZ ' + match.group(1).strip()
    return None

def extract_city_country(text):
    """
    Try to extract city and country names from the text using common patterns.
    Returns (city, country) or (None, None) if not found.
    """
    # Look for patterns like 'City, Country' or 'in City, Country'
    match = re.search(r'([A-Z][a-zA-Z\- ]+),\s*([A-Z][a-zA-Z\- ]+)', text)
    if match:
        city = match.group(1).strip()
        country = match.group(2).strip()
        return city, country
    # Look for 'City' or 'Country' after keywords
    match = re.search(r'City[:\s\*]*([A-Za-z0-9 ,\-\(\)]+)', text, re.IGNORECASE)
    city = match.group(1).strip() if match else None
    match = re.search(r'Country[:\s\*]*([A-Za-z0-9 ,\-\(\)]+)', text, re.IGNORECASE)
    country = match.group(1).strip() if match else None
    if city or country:
        return city, country
    return None, None

@app.post("/api/plan")
async def mission_plan(prompt: str = Form(...)):
    # Placeholder: In real app, call GPT
    log_event("Command", "Mission plan requested", {"prompt": prompt})
    return {"plan": f"[AI-generated plan for: '{prompt}']"}

@app.get("/api/logs")
async def get_logs(event_type: str = None, limit: int = 100):
    # Return logs, optionally filtered by event_type and limited
    filtered = mission_logs
    if event_type:
        filtered = [log for log in mission_logs if log["event_type"] == event_type]
    return {"logs": filtered[-limit:]}

@app.post("/api/log")
async def add_log(request: Request, body: dict = Body(...)):
    # Allow frontend to log arbitrary events
    event_type = body.get("event_type", "User")
    message = body.get("message", "")
    details = body.get("details", {})
    log_event(event_type, message, details)
    return {"status": "ok"}

@app.get("/api/briefs")
async def get_briefs():
    # Placeholder briefs
    return {"briefs": ["SITREP: All clear", "CONOPS: Proceed to LZ"]}
