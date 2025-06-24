from fastapi import FastAPI, File, UploadFile, Form, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import openai
import os
from dotenv import load_dotenv
import PyPDF2
import io
import re
import datetime
import asyncio
import json
import random
from enum import Enum

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Set OpenAI API key from environment variable
openai_api_key = os.getenv("OPENAI_API_KEY", "your-api-key-here")
print(f"[DEBUG] OpenAI API Key loaded: {openai_api_key[:8]}... (length: {len(openai_api_key)})")
client = openai.OpenAI(api_key=openai_api_key)

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Simulation Engine State ---
class SimulationStatus(Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"

class EventType(Enum):
    MISSION_START = "mission_start"
    ASSET_MOVEMENT = "asset_movement"
    THREAT_DETECTED = "threat_detected"
    ENGAGEMENT = "engagement"
    WEATHER_CHANGE = "weather_change"
    COMMS_UPDATE = "comms_update"
    EXTRACTION = "extraction"
    CASUALTY = "casualty"
    OBJECTIVE_COMPLETE = "objective_complete"
    USER_INJECTED = "user_injected"

# Simulation state
simulation_state = {
    "status": SimulationStatus.IDLE,
    "current_time": "0600",
    "mission_duration": 0,  # minutes
    "assets": {},  # {asset_id: {type, position, status, fuel, ammo}}
    "threats": {},  # {threat_id: {type, position, status, detected}}
    "weather": {
        "condition": "clear",
        "visibility": "good",
        "wind_speed": 5,
        "temperature": 72
    },
    "comms_status": "operational",
    "objectives": [],
    "timeline": [],  # List of simulation events
    "user_injections": []  # User-requested events
}

# In-memory log store (replace with DB for production)
mission_logs = []

# --- Mission Plan State ---
current_plan = {
    "content": "",
    "updated_at": None,
    "updated_by": None
}
plan_history = []  # List of {content, timestamp, label}
master_plan = None  # {content, timestamp, label}

# --- SITREP / CONOPS State ---
sitrep_state = {
    "content": "",
    "status": "draft",  # 'draft' or 'approved'
    "version": 1,
    "history": []  # List of {content, version, status, date}
}
conops_state = {
    "content": "",
    "status": "draft",
    "version": 1,
    "history": []
}

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
    """
    Generate a detailed, actionable mission plan using OpenAI GPT-4 Turbo.
    """
    try:
        system_prompt = (
            """
            You are a senior military operations planner. Given the following mission planning prompt, generate a detailed, actionable, and in-depth mission plan suitable for a real-world operation. Use clear structure, bullet points, and military terminology. Include objectives, phases, assets, contingencies, and any relevant details. Do not include commentary—return only the plan.
            """
        )
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=900,
            temperature=0.3
        )
        plan = response.choices[0].message.content.strip()
        log_event("Command", "Mission plan generated with AI", {"prompt": prompt, "plan": plan})
        return {"plan": plan}
    except Exception as e:
        log_event("System", f"Error generating plan: {str(e)}")
        return {"plan": f"Error generating plan: {str(e)}"}

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

@app.get("/api/plan/current")
def get_current_plan():
    return {"plan": current_plan}

@app.post("/api/plan/current")
async def update_current_plan(body: dict = Body(...)):
    plan = body.get("plan", "")
    user = body.get("user", "system")
    current_plan["content"] = plan
    current_plan["updated_at"] = datetime.datetime.utcnow().isoformat() + 'Z'
    current_plan["updated_by"] = user
    log_event("Command", "Current plan updated", {"by": user, "plan": plan})
    return {"status": "ok"}

@app.post("/api/plan/archive")
async def archive_plan(body: dict = Body(...)):
    label = body.get("label")
    plan_snapshot = {
        "content": current_plan["content"],
        "timestamp": datetime.datetime.utcnow().isoformat() + 'Z',
        "label": label or f"Archive {len(plan_history)+1}"
    }
    plan_history.append(plan_snapshot)
    log_event("Command", "Plan archived", plan_snapshot)
    return {"status": "ok", "archive": plan_snapshot}

@app.get("/api/plan/history")
def get_plan_history():
    return {"history": plan_history}

@app.post("/api/plan/restore")
async def restore_plan(body: dict = Body(...)):
    idx = body.get("index")
    if idx is not None and 0 <= idx < len(plan_history):
        restored = plan_history[idx]
        current_plan["content"] = restored["content"]
        current_plan["updated_at"] = datetime.datetime.utcnow().isoformat() + 'Z'
        current_plan["updated_by"] = body.get("user", "system")
        log_event("Command", "Plan restored from archive", {"index": idx, "label": restored["label"]})
        return {"status": "ok", "plan": current_plan}
    return {"status": "error", "error": "Invalid index"}

@app.post("/api/plan/master")
async def set_master_plan():
    global master_plan
    master_plan = {
        "content": current_plan["content"],
        "timestamp": datetime.datetime.utcnow().isoformat() + 'Z',
        "label": "Master Plan"
    }
    log_event("Command", "Master plan set", master_plan)
    return {"status": "ok", "master": master_plan}

@app.get("/api/plan/master")
def get_master_plan():
    return {"master": master_plan}

@app.post("/api/plan/refine")
async def refine_plan(plan: str = Form(...), prompt: str = Form(...)):
    """
    Refine the given mission plan using the provided prompt (e.g., 'Add more detail to phase 2').
    Uses OpenAI to improve the plan and returns the new version.
    """
    try:
        system_prompt = (
            """
            You are a senior military operations planner. Refine and improve the following mission plan based on the user's instruction. 
            Keep the plan clear, concise, and actionable. If the user asks for more detail, add it. If the user asks for changes, make them. 
            Return only the improved plan, not commentary.
            """
        )
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Current plan:\n{plan}\n\nRefinement instruction: {prompt}"}
            ],
            max_tokens=800,
            temperature=0.3
        )
        improved_plan = response.choices[0].message.content.strip()
        log_event("Command", "Mission plan refined with AI", {"prompt": prompt, "old_plan": plan, "new_plan": improved_plan})
        return {"plan": improved_plan}
    except Exception as e:
        log_event("System", f"Error refining plan: {str(e)}")
        return {"plan": f"Error refining plan: {str(e)}"}

@app.get("/api/sitrep")
async def get_sitrep():
    return sitrep_state

@app.post("/api/sitrep")
async def update_sitrep(body: dict = Body(...)):
    content = body.get("content", "")
    sitrep_state["content"] = content
    sitrep_state["status"] = "draft"
    log_event("SITREP", "SITREP updated (draft)", {"content": content})
    return {"status": "ok"}

@app.post("/api/sitrep/approve")
async def approve_sitrep():
    sitrep_state["status"] = "approved"
    sitrep_state["history"].append({
        "content": sitrep_state["content"],
        "version": sitrep_state["version"],
        "status": "approved",
        "date": datetime.datetime.utcnow().isoformat() + 'Z'
    })
    sitrep_state["version"] += 1
    log_event("SITREP", "SITREP approved", {"content": sitrep_state["content"], "version": sitrep_state["version"]-1})
    return {"status": "ok"}

@app.post("/api/sitrep/share")
async def share_sitrep():
    log_event("SITREP", "SITREP shared with team", {"content": sitrep_state["content"], "version": sitrep_state["version"]-1})
    return {"status": "ok", "message": "SITREP shared (placeholder)"}

@app.get("/api/conops")
async def get_conops():
    return conops_state

@app.post("/api/conops")
async def update_conops(body: dict = Body(...)):
    content = body.get("content", "")
    conops_state["content"] = content
    conops_state["status"] = "draft"
    log_event("CONOPS", "CONOPS updated (draft)", {"content": content})
    return {"status": "ok"}

@app.post("/api/conops/approve")
async def approve_conops():
    conops_state["status"] = "approved"
    conops_state["history"].append({
        "content": conops_state["content"],
        "version": conops_state["version"],
        "status": "approved",
        "date": datetime.datetime.utcnow().isoformat() + 'Z'
    })
    conops_state["version"] += 1
    log_event("CONOPS", "CONOPS approved", {"content": conops_state["content"], "version": conops_state["version"]-1})
    return {"status": "ok"}

@app.post("/api/conops/share")
async def share_conops():
    log_event("CONOPS", "CONOPS shared with team", {"content": conops_state["content"], "version": conops_state["version"]-1})
    return {"status": "ok", "message": "CONOPS shared (placeholder)"}

# --- Simulation Engine Functions ---

def parse_time(time_str: str) -> int:
    """Convert time string (HHMM) to minutes since midnight"""
    hours = int(time_str[:2])
    minutes = int(time_str[2:])
    return hours * 60 + minutes

def format_time(minutes: int) -> str:
    """Convert minutes since midnight to time string (HHMM)"""
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours:02d}{mins:02d}"

def calculate_distance(pos1: Dict[str, float], pos2: Dict[str, float]) -> float:
    """Calculate distance between two positions (simplified)"""
    lat_diff = pos1["lat"] - pos2["lat"]
    lng_diff = pos1["lng"] - pos2["lng"]
    return (lat_diff**2 + lng_diff**2)**0.5

def generate_ai_narrative(event_type: EventType, context: Dict[str, Any]) -> str:
    """Generate AI-powered narrative for simulation events"""
    
    system_prompt = """You are a military operations narrator for a real-time mission simulation. 
    Generate concise, realistic military-style narrative for the given event. 
    Use military time format (HHMM), technical terminology, and maintain operational realism.
    Keep responses under 100 words and focus on actionable information."""
    
    event_prompts = {
        EventType.MISSION_START: "Mission insertion team has lifted off from base. Generate a brief status update.",
        EventType.ASSET_MOVEMENT: f"Asset {context.get('asset_id', 'UNKNOWN')} is moving to new position. Generate movement update.",
        EventType.THREAT_DETECTED: f"Threat detected at position. Type: {context.get('threat_type', 'UNKNOWN')}. Generate threat assessment.",
        EventType.ENGAGEMENT: f"Engagement initiated. Generate combat status update.",
        EventType.WEATHER_CHANGE: f"Weather conditions changing. Generate weather update.",
        EventType.COMMS_UPDATE: f"Communications status update. Generate comms report.",
        EventType.EXTRACTION: "Extraction team deployed. Generate extraction status.",
        EventType.CASUALTY: "Casualty reported. Generate casualty report.",
        EventType.OBJECTIVE_COMPLETE: "Objective completed. Generate objective status.",
        EventType.USER_INJECTED: f"User-injected event: {context.get('description', 'UNKNOWN')}. Generate narrative."
    }
    
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": event_prompts.get(event_type, "Generate mission update.")}
            ],
            max_tokens=150,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Simulation event: {event_type.value} at {context.get('time', 'UNKNOWN')}"

def create_simulation_event(event_type: EventType, time: str, details: Dict[str, Any]) -> Dict[str, Any]:
    """Create a simulation event with AI-generated narrative"""
    narrative = generate_ai_narrative(event_type, {**details, "time": time})
    
    return {
        "id": f"event_{len(simulation_state['timeline'])}",
        "type": event_type.value,
        "time": time,
        "narrative": narrative,
        "details": details,
        "timestamp": datetime.datetime.utcnow().isoformat() + 'Z'
    }

def initialize_mission_assets(mission_plan: str) -> Dict[str, Any]:
    """Initialize assets based on mission plan content"""
    assets = {}
    
    # Extract asset information from mission plan using AI
    system_prompt = """Extract military assets from the mission plan. 
    Return a JSON object with assets in format:
    {
        "asset_id": {
            "type": "helicopter|vehicle|team",
            "position": {"lat": float, "lng": float},
            "status": "ready|deployed|engaged",
            "fuel": 100,
            "ammo": 100
        }
    }"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": mission_plan}
            ],
            max_tokens=500,
            temperature=0.3
        )
        
        assets_text = response.choices[0].message.content.strip()
        # Try to parse JSON, fallback to default assets if parsing fails
        try:
            assets = json.loads(assets_text)
        except:
            # Default assets if AI parsing fails
            assets = {
                "insertion_team": {
                    "type": "team",
                    "position": {"lat": 39.8283, "lng": -98.5795},
                    "status": "ready",
                    "fuel": 100,
                    "ammo": 100
                },
                "extraction_team": {
                    "type": "team", 
                    "position": {"lat": 39.8283, "lng": -98.5795},
                    "status": "ready",
                    "fuel": 100,
                    "ammo": 100
                }
            }
    except Exception as e:
        # Fallback to default assets
        assets = {
            "insertion_team": {
                "type": "team",
                "position": {"lat": 39.8283, "lng": -98.5795},
                "status": "ready",
                "fuel": 100,
                "ammo": 100
            }
        }
    
    return assets

def initialize_threats(mission_plan: str) -> Dict[str, Any]:
    """Initialize threats based on mission plan content"""
    threats = {}
    
    # Extract threat information from mission plan using AI
    system_prompt = """Extract potential threats from the mission plan.
    Return a JSON object with threats in format:
    {
        "threat_id": {
            "type": "ied|sniper|ambush|vehicle",
            "position": {"lat": float, "lng": float},
            "status": "active|neutralized|detected",
            "detected": false
        }
    }"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": mission_plan}
            ],
            max_tokens=500,
            temperature=0.3
        )
        
        threats_text = response.choices[0].message.content.strip()
        try:
            threats = json.loads(threats_text)
        except:
            # Default threats if AI parsing fails
            threats = {
                "threat_1": {
                    "type": "ied",
                    "position": {"lat": 39.8300, "lng": -98.5800},
                    "status": "active",
                    "detected": False
                }
            }
    except Exception as e:
        # Fallback to default threats
        threats = {
            "threat_1": {
                "type": "ied",
                "position": {"lat": 39.8300, "lng": -98.5800},
                "status": "active",
                "detected": False
            }
        }
    
    return threats

async def run_simulation_step():
    """Execute one step of the simulation (TEST MODE: always generate events)"""
    print("[DEBUG] Starting simulation step...")
    if simulation_state["status"] != SimulationStatus.RUNNING:
        print("[DEBUG] Simulation not running, skipping step.")
        return
    try:
        current_minutes = parse_time(simulation_state["current_time"])
        current_minutes += 5  # Advance 5 minutes
        simulation_state["current_time"] = format_time(current_minutes)
        simulation_state["mission_duration"] += 5
        
        # Generate events based on current state (always generate for testing)
        events = []
        
        # Asset movement events (always move)
        for asset_id, asset in simulation_state["assets"].items():
            # Simple movement logic
            new_lat = asset["position"]["lat"] + random.uniform(-0.001, 0.001)
            new_lng = asset["position"]["lng"] + random.uniform(-0.001, 0.001)
            asset["position"] = {"lat": new_lat, "lng": new_lng}
            
            event = create_simulation_event(
                EventType.ASSET_MOVEMENT,
                simulation_state["current_time"],
                {
                    "asset_id": asset_id,
                    "new_position": asset["position"],
                    "status": asset["status"]
                }
            )
            events.append(event)
        
        # Threat detection events (always detect if not already detected)
        for threat_id, threat in simulation_state["threats"].items():
            if not threat["detected"]:
                threat["detected"] = True
                threat["status"] = "detected"
                
                event = create_simulation_event(
                    EventType.THREAT_DETECTED,
                    simulation_state["current_time"],
                    {
                        "threat_id": threat_id,
                        "threat_type": threat["type"],
                        "position": threat["position"]
                    }
                )
                events.append(event)
        
        # Weather changes (always change)
        weather_conditions = ["clear", "cloudy", "rain", "fog"]
        simulation_state["weather"]["condition"] = random.choice(weather_conditions)
        event = create_simulation_event(
            EventType.WEATHER_CHANGE,
            simulation_state["current_time"],
            {
                "condition": simulation_state["weather"]["condition"],
                "visibility": simulation_state["weather"]["visibility"]
            }
        )
        events.append(event)
        
        # Add events to timeline
        simulation_state["timeline"].extend(events)
        
        # Log events
        for event in events:
            log_event("Simulation", event["narrative"], event["details"])
        
        # Check for mission completion (example: 2 hours = 120 minutes)
        if simulation_state["mission_duration"] >= 120:
            simulation_state["status"] = SimulationStatus.COMPLETED
            completion_event = create_simulation_event(
                EventType.OBJECTIVE_COMPLETE,
                simulation_state["current_time"],
                {"status": "mission_completed", "duration": simulation_state["mission_duration"]}
            )
            simulation_state["timeline"].append(completion_event)
            log_event("Simulation", "Mission completed", {"duration": simulation_state["mission_duration"]})
        print("[DEBUG] Finished simulation step.")
    except Exception as e:
        print(f"[ERROR] Exception in simulation step: {e}")
        simulation_state["status"] = SimulationStatus.ERROR

# --- Simulation API Endpoints ---

@app.post("/api/simulation/start")
async def start_simulation():
    """Start the mission simulation"""
    try:
        # Reset simulation state
        simulation_state["status"] = SimulationStatus.RUNNING
        simulation_state["current_time"] = "0600"
        simulation_state["mission_duration"] = 0
        simulation_state["timeline"] = []
        simulation_state["user_injections"] = []
        # Initialize assets and threats from master plan if available, else current plan
        plan_content = master_plan["content"] if master_plan and master_plan.get("content") else current_plan["content"]
        if plan_content:
            simulation_state["assets"] = initialize_mission_assets(plan_content)
            simulation_state["threats"] = initialize_threats(plan_content)
        else:
            # Default assets and threats
            simulation_state["assets"] = {
                "insertion_team": {
                    "type": "team",
                    "position": {"lat": 39.8283, "lng": -98.5795},
                    "status": "ready",
                    "fuel": 100,
                    "ammo": 100
                }
            }
            simulation_state["threats"] = {
                "threat_1": {
                    "type": "ied",
                    "position": {"lat": 39.8300, "lng": -98.5800},
                    "status": "active",
                    "detected": False
                }
            }
        # Create mission start event
        start_event = create_simulation_event(
            EventType.MISSION_START,
            simulation_state["current_time"],
            {"assets": list(simulation_state["assets"].keys())}
        )
        simulation_state["timeline"].append(start_event)
        log_event("Simulation", "Mission simulation started", {
            "assets": simulation_state["assets"],
            "threats": simulation_state["threats"]
        })
        return {
            "status": "success",
            "message": "Simulation started",
            "simulation_state": simulation_state
        }
    except Exception as e:
        simulation_state["status"] = SimulationStatus.ERROR
        log_event("System", f"Simulation start error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/api/simulation/pause")
async def pause_simulation():
    """Pause the mission simulation"""
    simulation_state["status"] = SimulationStatus.PAUSED
    log_event("Simulation", "Simulation paused", {"time": simulation_state["current_time"]})
    return {"status": "success", "message": "Simulation paused"}

@app.post("/api/simulation/resume")
async def resume_simulation():
    """Resume the mission simulation"""
    simulation_state["status"] = SimulationStatus.RUNNING
    log_event("Simulation", "Simulation resumed", {"time": simulation_state["current_time"]})
    return {"status": "success", "message": "Simulation resumed"}

@app.post("/api/simulation/stop")
async def stop_simulation():
    """Stop the mission simulation"""
    simulation_state["status"] = SimulationStatus.IDLE
    log_event("Simulation", "Simulation stopped", {"time": simulation_state["current_time"]})
    return {"status": "success", "message": "Simulation stopped"}

@app.post("/api/simulation/step")
async def step_simulation():
    """Execute one simulation step"""
    await run_simulation_step()
    return {
        "status": "success",
        "simulation_state": simulation_state
    }

@app.post("/api/simulation/inject")
async def inject_event(body: dict = Body(...)):
    """Inject a user-defined event into the simulation and ensure the simulation loop continues."""
    global simulation_task
    try:
        event_description = body.get("description", "")
        event_type = body.get("type", "user_injected")

        # Create user-injected event
        event = create_simulation_event(
            EventType.USER_INJECTED,
            simulation_state["current_time"],
            {"description": event_description, "type": event_type}
        )

        simulation_state["timeline"].append(event)
        simulation_state["user_injections"].append(event)

        log_event("Simulation", f"User injected event: {event_description}", event["details"])

        # Ensure simulation loop continues
        if simulation_state["status"] == SimulationStatus.PAUSED:
            simulation_state["status"] = SimulationStatus.RUNNING
            if simulation_task is None or simulation_task.done():
                simulation_task = asyncio.create_task(run_real_time_simulation())
        elif simulation_state["status"] == SimulationStatus.IDLE:
            simulation_state["status"] = SimulationStatus.RUNNING
            if simulation_task is None or simulation_task.done():
                simulation_task = asyncio.create_task(run_real_time_simulation())
        # If already running, do nothing (loop will pick up event)

        return {
            "status": "success",
            "message": "Event injected",
            "event": event
        }

    except Exception as e:
        log_event("System", f"Event injection error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/api/simulation/status")
async def get_simulation_status():
    """Get current simulation status"""
    return {
        "status": simulation_state["status"].value,
        "current_time": simulation_state["current_time"],
        "mission_duration": simulation_state["mission_duration"],
        "assets": simulation_state["assets"],
        "threats": simulation_state["threats"],
        "weather": simulation_state["weather"],
        "comms_status": simulation_state["comms_status"],
        "timeline": simulation_state["timeline"][-10:],  # Last 10 events
        "user_injections": simulation_state["user_injections"]
    }

@app.get("/api/simulation/timeline")
async def get_simulation_timeline():
    """Get full simulation timeline"""
    return {
        "timeline": simulation_state["timeline"],
        "total_events": len(simulation_state["timeline"])
    }

# --- Real-time Simulation Runner ---

simulation_task = None
simulation_speed = 5  # seconds between steps

async def run_real_time_simulation():
    """Run simulation in real-time with configurable speed"""
    global simulation_task
    print("[DEBUG] Starting real-time simulation loop...")
    try:
        while simulation_state["status"] == SimulationStatus.RUNNING:
            await run_simulation_step()
            await asyncio.sleep(simulation_speed)  # Wait between steps
            # Check if simulation should continue
            if simulation_state["status"] != SimulationStatus.RUNNING:
                print("[DEBUG] Simulation loop exiting: status is not RUNNING.")
                break
        print("[DEBUG] Exiting real-time simulation loop.")
    except Exception as e:
        print(f"[ERROR] Exception in real-time simulation loop: {e}")
        simulation_state["status"] = SimulationStatus.ERROR

@app.post("/api/simulation/start-realtime")
async def start_real_time_simulation():
    """Start real-time simulation"""
    global simulation_task
    
    try:
        # Start the simulation
        await start_simulation()
        
        # Start the real-time runner
        simulation_task = asyncio.create_task(run_real_time_simulation())
        
        return {
            "status": "success",
            "message": "Real-time simulation started",
            "speed": simulation_speed
        }
        
    except Exception as e:
        log_event("System", f"Real-time simulation start error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/api/simulation/set-speed")
async def set_simulation_speed(body: dict = Body(...)):
    """Set simulation speed (seconds between steps)"""
    global simulation_speed
    
    speed = body.get("speed", 5)
    if speed < 1:
        speed = 1
    elif speed > 60:
        speed = 60
    
    simulation_speed = speed
    
    return {
        "status": "success",
        "message": f"Simulation speed set to {speed} seconds",
        "speed": simulation_speed
    }

@app.get("/api/simulation/speed")
async def get_simulation_speed():
    """Get current simulation speed"""
    return {
        "speed": simulation_speed,
        "status": simulation_state["status"].value
    }

# Add a new simulation mode for fast simulation
fast_simulation_speed = 4  # seconds per step (default for fast mode)

async def run_simulation_loop(speed: int):
    global simulation_task
    print(f"[DEBUG] Starting simulation loop with speed {speed}s...")
    try:
        while simulation_state["status"] == SimulationStatus.RUNNING:
            await run_simulation_step()
            await asyncio.sleep(speed)
            if simulation_state["status"] != SimulationStatus.RUNNING:
                print("[DEBUG] Simulation loop exiting: status is not RUNNING.")
                break
        print("[DEBUG] Exiting simulation loop.")
    except Exception as e:
        print(f"[ERROR] Exception in simulation loop: {e}")
        simulation_state["status"] = SimulationStatus.ERROR

@app.post("/api/simulation/start-fast")
async def start_fast_simulation():
    global simulation_task, fast_simulation_speed
    try:
        await start_simulation()
        # Start the simulation loop as a background task and return immediately
        loop = asyncio.get_event_loop()
        simulation_task = loop.create_task(run_simulation_loop(fast_simulation_speed))
        return {
            "status": "success",
            "message": "Fast simulation started",
            "speed": fast_simulation_speed
        }
    except Exception as e:
        log_event("System", f"Fast simulation start error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/api/simulation/set-fast-speed")
async def set_fast_simulation_speed(body: dict = Body(...)):
    global fast_simulation_speed
    speed = body.get("speed", 4)
    if speed < 1:
        speed = 1
    elif speed > 60:
        speed = 60
    fast_simulation_speed = speed
    return {
        "status": "success",
        "message": f"Fast simulation speed set to {speed} seconds",
        "speed": fast_simulation_speed
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
