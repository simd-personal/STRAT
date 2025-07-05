from fastapi import FastAPI, File, UploadFile, Form, Request, Body, APIRouter
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
import httpx
from urllib.parse import quote
from pydantic import BaseModel

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
    allow_origins=["*"],  # Or restrict to ["http://localhost:3000", "http://localhost:3002"]
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
    STALLED = "stalled"

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

# Global simulation task
simulation_task = None
fast_simulation_speed = 4  # seconds per step (default for fast mode)

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

# Add a counter for consecutive weather-only steps
stall_counter = 0
STALL_LIMIT = 5  # Number of consecutive weather-only steps before considering the mission stalled

def all_objectives_complete():
    return simulation_state["objectives"] and all(obj.get("status") == "complete" for obj in simulation_state["objectives"])

async def run_simulation_step():
    global stall_counter
    print("[DEBUG] Starting simulation step...")
    if simulation_state["status"] != SimulationStatus.RUNNING:
        print("[DEBUG] Simulation not running, skipping step.")
        return
    try:
        current_minutes = parse_time(simulation_state["current_time"])
        current_minutes += 5  # Advance 5 minutes
        simulation_state["current_time"] = format_time(current_minutes)
        simulation_state["mission_duration"] += 5
        events = []
        non_weather_event = False
        # Asset movement events (always move)
        for asset_id, asset in simulation_state["assets"].items():
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
            non_weather_event = True
            # Check for reach_location objectives
            for obj in simulation_state["objectives"]:
                if obj.get("type") == "reach_location" and obj.get("status") != "complete":
                    target = obj.get("target")
                    if target and abs(asset["position"]["lat"] - target["lat"]) < 0.0005 and abs(asset["position"]["lng"] - target["lng"]) < 0.0005:
                        obj["status"] = "complete"
                        log_event("Simulation", f"Objective complete: {obj.get('description', 'reach_location')}", {"objective": obj})
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
                non_weather_event = True
        # Weather changes: Only at beginning and midway
        mission_duration = simulation_state["mission_duration"]
        total_duration = 120  # Example: 2 hours = 120 minutes
        if mission_duration == 5 or mission_duration == total_duration // 2:
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
        # After all event logic, check for flexible completion
        if all_objectives_complete():
            simulation_state["status"] = SimulationStatus.COMPLETED
            completion_event = create_simulation_event(
                EventType.OBJECTIVE_COMPLETE,
                simulation_state["current_time"],
                {"status": "all_objectives_completed", "duration": simulation_state["mission_duration"]}
            )
            simulation_state["timeline"].append(completion_event)
            log_event("Simulation", "Mission completed: all objectives complete", {"duration": simulation_state["mission_duration"]})
            generate_after_action_report()
            stall_counter = 0
            print("[DEBUG] Mission completed: all objectives complete.")
            # Stop all simulation processes and reset to idle
            await stop_simulation_processes()
            return
        # Fallback: time-based completion
        if simulation_state["mission_duration"] >= total_duration:
            simulation_state["status"] = SimulationStatus.COMPLETED
            completion_event = create_simulation_event(
                EventType.OBJECTIVE_COMPLETE,
                simulation_state["current_time"],
                {"status": "mission_completed", "duration": simulation_state["mission_duration"]}
            )
            simulation_state["timeline"].append(completion_event)
            log_event("Simulation", "Mission completed (time limit)", {"duration": simulation_state["mission_duration"]})
            generate_after_action_report()
            stall_counter = 0
            print("[DEBUG] Mission completed: time limit.")
            # Stop all simulation processes and reset to idle
            await stop_simulation_processes()
            return
        # Stall detection: if only weather events are generated for N steps
        if not non_weather_event:
            stall_counter += 1
            print(f"[DEBUG] Stall counter: {stall_counter}")
            if stall_counter >= STALL_LIMIT:
                simulation_state["status"] = SimulationStatus.STALLED
                log_event("Simulation", "Simulation stalled: only weather events generated for several steps.")
        else:
            stall_counter = 0
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
    global simulation_task, fast_simulation_speed
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
                # Determine which loop to restart
                if fast_simulation_speed and fast_simulation_speed != 5:
                    # Fast simulation mode
                    loop = asyncio.get_event_loop()
                    simulation_task = loop.create_task(run_simulation_loop(fast_simulation_speed))
                else:
                    # Real-time simulation mode
                    simulation_task = asyncio.create_task(run_real_time_simulation())
        elif simulation_state["status"] == SimulationStatus.IDLE:
            simulation_state["status"] = SimulationStatus.RUNNING
            if simulation_task is None or simulation_task.done():
                if fast_simulation_speed and fast_simulation_speed != 5:
                    loop = asyncio.get_event_loop()
                    simulation_task = loop.create_task(run_simulation_loop(fast_simulation_speed))
                else:
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
        "user_injections": simulation_state["user_injections"],
        "stall_counter": stall_counter,
        "stall_limit": STALL_LIMIT
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

# --- Route Optimization API Endpoints ---

@app.post("/api/route-optimization/evaluate")
async def evaluate_routes(request: Request):
    """Evaluate optimal routes based on start/end locations, threats, and terrain"""
    try:
        form = await request.form()
        
        start_location = form.get("start_location", "")
        end_location = form.get("end_location", "")
        threats = form.get("threats", "[]")
        weather = form.get("weather", "Clear")
        terrain_file = form.get("terrain_file")
        custom_prompt = form.get("custom_prompt", "")
        
        # Parse threats from JSON string
        try:
            threat_list = json.loads(threats) if threats else []
        except:
            threat_list = []
        
        # Build the evaluation prompt
        base_prompt = """Given the unit's start and end locations, threat locations, and terrain data, evaluate 3 possible infiltration routes. Score them on:
- Stealth (1-10)
- Time to objective (1-10, lower is faster)
- Risk of enemy contact (1-10, lower is safer)

Return a JSON object with this structure:
{
    "routes": [
        {
            "name": "Route Name",
            "description": "Brief description",
            "waypoints": [{"lat": float, "lng": float}, ...],
            "scores": {
                "stealth": int,
                "time": int,
                "risk": int
            },
            "total_score": int,
            "estimated_time": "HH:MM",
            "notes": "Additional considerations"
        }
    ],
    "threat_analysis": "Analysis of threat impact on routes",
    "recommendation": "Recommended route with justification"
}"""
        
        # Combine with custom prompt if provided
        if custom_prompt:
            evaluation_prompt = f"{base_prompt}\n\nAdditional considerations: {custom_prompt}"
        else:
            evaluation_prompt = base_prompt
        
        # Build context for AI
        context = f"""
Start Location: {start_location}
End Location: {end_location}
Weather Conditions: {weather}
Threat Locations: {', '.join(threat_list) if threat_list else 'None specified'}
"""
        
        # Process terrain file if provided
        terrain_analysis = ""
        if terrain_file:
            terrain_analysis = "\nTerrain data has been uploaded and should be considered in route planning."
        
        # Call OpenAI for route evaluation
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a military route optimization expert. Analyze infiltration routes considering terrain, threats, and tactical considerations."},
                {"role": "user", "content": f"{evaluation_prompt}\n\nMission Context:\n{context}{terrain_analysis}"}
            ],
            max_tokens=2000,
            temperature=0.3
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Try to parse JSON response
        try:
            result = json.loads(result_text)
        except json.JSONDecodeError:
            # If JSON parsing fails, return a structured response
            result = {
                "routes": [
                    {
                        "name": "Primary Route",
                        "description": "Direct path with minimal exposure",
                        "waypoints": [
                            {"lat": 34.05, "lng": -118.25},
                            {"lat": 34.00, "lng": -118.20},
                            {"lat": 33.94, "lng": -117.40}
                        ],
                        "scores": {"stealth": 7, "time": 6, "risk": 5},
                        "total_score": 18,
                        "estimated_time": "02:30",
                        "notes": "Primary route with good cover and concealment"
                    },
                    {
                        "name": "Alternate Route",
                        "description": "Longer path with better terrain",
                        "waypoints": [
                            {"lat": 34.05, "lng": -118.25},
                            {"lat": 34.10, "lng": -118.30},
                            {"lat": 34.15, "lng": -118.35},
                            {"lat": 33.94, "lng": -117.40}
                        ],
                        "scores": {"stealth": 9, "time": 4, "risk": 3},
                        "total_score": 16,
                        "estimated_time": "03:45",
                        "notes": "Longer but safer route with excellent terrain"
                    },
                    {
                        "name": "Contingency Route",
                        "description": "Emergency egress path",
                        "waypoints": [
                            {"lat": 34.05, "lng": -118.25},
                            {"lat": 33.95, "lng": -118.15},
                            {"lat": 33.94, "lng": -117.40}
                        ],
                        "scores": {"stealth": 5, "time": 8, "risk": 7},
                        "total_score": 20,
                        "estimated_time": "01:45",
                        "notes": "Fastest route but higher risk"
                    }
                ],
                "threat_analysis": "AI analysis failed to parse. Using default route evaluation.",
                "recommendation": "Primary Route recommended for balanced approach."
            }
        
        # Log the route evaluation
        log_event("Route Optimization", "Routes evaluated", {
            "start": start_location,
            "end": end_location,
            "threats": threat_list,
            "weather": weather,
            "routes_count": len(result.get("routes", []))
        })
        
        return {
            "status": "success",
            "routes": result.get("routes", []),
            "threat_analysis": result.get("threat_analysis", ""),
            "recommendation": result.get("recommendation", ""),
            "context": {
                "start_location": start_location,
                "end_location": end_location,
                "weather": weather,
                "threats": threat_list
            }
        }
        
    except Exception as e:
        log_event("System", f"Route optimization error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/api/route-optimization/geocode")
async def geocode_location(request: Request):
    """Geocode a location name to coordinates"""
    try:
        form = await request.form()
        location_name = form.get("location", "")
        
        if not location_name:
            return {"status": "error", "message": "Location name required"}
        
        # Use Mapbox geocoding API
        mapbox_token = "pk.eyJ1Ijoic3NkMzYwIiwiYSI6ImNtYzlzNGh6NTF3bXMyanEwdWttajNrZjUifQ.9sOzbXQl4ORfE8Ys6oJOdg"
        url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{quote(location_name)}.json?access_token={mapbox_token}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            data = response.json()
            
            if data.get("features") and len(data["features"]) > 0:
                feature = data["features"][0]
                coordinates = feature["center"]  # [lng, lat]
                
                return {
                    "status": "success",
                    "coordinates": {
                        "lat": coordinates[1],
                        "lng": coordinates[0]
                    },
                    "place_name": feature.get("place_name", location_name)
                }
            else:
                return {"status": "error", "message": "Location not found"}
                
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/route-optimization/analyze-threats")
async def analyze_threats(request: Request):
    """Analyze threat impact on route planning"""
    try:
        form = await request.form()
        threats = form.get("threats", "[]")
        route_waypoints = form.get("route_waypoints", "[]")
        
        # Parse inputs
        try:
            threat_list = json.loads(threats) if threats else []
            waypoints = json.loads(route_waypoints) if route_waypoints else []
        except:
            return {"status": "error", "message": "Invalid JSON data"}
        
        # Build threat analysis prompt
        analysis_prompt = f"""
Analyze the following threats and their potential impact on route planning:

Threats: {', '.join(threat_list) if threat_list else 'None specified'}
Route Waypoints: {len(waypoints)} waypoints

Provide a threat analysis including:
1. Threat categorization (IED, sniper, ambush, etc.)
2. Risk assessment for each threat
3. Recommended mitigation strategies
4. Impact on route selection

Return as JSON:
{{
    "threat_categories": ["category1", "category2"],
    "risk_assessment": "Overall risk level and analysis",
    "mitigation_strategies": ["strategy1", "strategy2"],
    "route_impact": "How threats affect route planning"
}}
"""
        
        # Call OpenAI for threat analysis
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a military threat analysis expert."},
                {"role": "user", "content": analysis_prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        result_text = response.choices[0].message.content.strip()
        
        try:
            result = json.loads(result_text)
        except json.JSONDecodeError:
            result = {
                "threat_categories": ["Unknown"],
                "risk_assessment": "Unable to analyze threats with provided data",
                "mitigation_strategies": ["Maintain situational awareness", "Use cover and concealment"],
                "route_impact": "Threats may require route adjustments"
            }
        
        return {
            "status": "success",
            "analysis": result
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

def generate_after_action_report():
    # Aggregate timeline, objectives, and key events
    timeline = simulation_state["timeline"]
    objectives = simulation_state.get("objectives", [])
    mission_name = (master_plan.get("label") if master_plan and master_plan.get("label") else current_plan.get("label") if current_plan and current_plan.get("label") else "Unnamed Mission")
    # Simple summary (could be replaced with AI summary)
    summary = f"Mission: {mission_name}\nTotal Events: {len(timeline)}\nObjectives: {objectives}\nKey Events:\n"
    for event in timeline:
        summary += f"- {event['time']}: {event['narrative']}\n"
    simulation_state["aar"] = {"mission_name": mission_name, "summary": summary}
    log_event("AAR", "After Action Report generated", {"summary": summary})

@app.get("/api/reports/aar")
async def get_aar():
    """Get the After Action Report for the current mission"""
    aar = simulation_state.get("aar", None)
    if aar:
        return {"status": "success", "aar": aar}
    else:
        return {"status": "error", "message": "No AAR available"}

async def stop_simulation_processes():
    """Stop all simulation processes and reset state to idle"""
    global simulation_task
    print("[DEBUG] Stopping all simulation processes...")
    
    # Cancel the simulation task if it's running
    if simulation_task and not simulation_task.done():
        simulation_task.cancel()
        try:
            await simulation_task
        except asyncio.CancelledError:
            pass
        simulation_task = None
    
    # Reset simulation state to idle
    simulation_state["status"] = SimulationStatus.IDLE
    print("[DEBUG] Simulation processes stopped, state reset to idle.")

# --- Incident Management State ---
incident_router = APIRouter()

class IncidentStatus(str, Enum):
    NEW = "new"
    DISPATCHED = "dispatched"
    RESOLVED = "resolved"

class Incident(BaseModel):
    incident_id: str
    type: str
    priority: str
    location: dict  # {"lat": float, "lng": float} or grid string
    status: IncidentStatus = IncidentStatus.NEW
    description: Optional[str] = ""
    created_at: str
    resolved_at: Optional[str] = None
    assigned_units: Optional[list] = []

# In-memory incident store (replace with DB for production)
incidents = {}

# Action log for incidents (track who did what)
incident_action_logs = []

def log_incident_action(action: str, incident_id: str, user: str = "dispatcher", details: dict = None):
    """Log actions performed on incidents"""
    incident_action_logs.append({
        "timestamp": datetime.datetime.utcnow().isoformat() + 'Z',
        "action": action,
        "incident_id": incident_id,
        "user": user,
        "details": details or {}
    })

# --- Incident Endpoints ---
@incident_router.post("/api/incidents")
async def create_incident(body: dict = Body(...)):
    import uuid, datetime
    incident_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    incident = Incident(
        incident_id=incident_id,
        type=body.get("type", "unknown"),
        priority=body.get("priority", "medium"),
        location=body.get("location", {}),
        status=IncidentStatus.NEW,
        description=body.get("description", ""),
        created_at=now,
        assigned_units=[]
    )
    incidents[incident_id] = incident
    
    # Log the action
    log_incident_action("created", incident_id, body.get("user", "dispatcher"), {
        "type": incident.type,
        "priority": incident.priority,
        "description": incident.description
    })
    
    log_event("Incident", f"Incident created: {incident.type}", {"incident_id": incident_id})
    return {"status": "success", "incident": incident}

@incident_router.get("/api/incidents")
async def list_incidents(status: Optional[str] = None):
    # List all or filter by status
    if status:
        filtered = [i for i in incidents.values() if i.status == status]
    else:
        filtered = list(incidents.values())
    return {"incidents": filtered}

@incident_router.patch("/api/incidents/{incident_id}")
async def update_incident(incident_id: str, body: dict = Body(...)):
    import datetime
    incident = incidents.get(incident_id)
    if not incident:
        return {"status": "error", "message": "Incident not found"}
    
    # Track what changed
    changes = {}
    for field in ["type", "priority", "location", "status", "description", "assigned_units"]:
        if field in body and getattr(incident, field) != body[field]:
            changes[field] = {"from": getattr(incident, field), "to": body[field]}
            setattr(incident, field, body[field])
    
    if body.get("status") == IncidentStatus.RESOLVED:
        incident.resolved_at = datetime.datetime.utcnow().isoformat() + 'Z'
        changes["resolved_at"] = incident.resolved_at
    
    incidents[incident_id] = incident
    
    # Log the action with changes
    if changes:
        log_incident_action("updated", incident_id, body.get("user", "dispatcher"), changes)
    
    log_event("Incident", f"Incident updated: {incident_id}", {"status": incident.status})
    return {"status": "success", "incident": incident}

# --- Action Log Endpoint ---
@incident_router.get("/api/incidents/{incident_id}/actions")
async def get_incident_actions(incident_id: str):
    """Get action log for a specific incident"""
    incident_actions = [log for log in incident_action_logs if log["incident_id"] == incident_id]
    return {"actions": incident_actions}

@incident_router.get("/api/incidents/actions")
async def get_all_incident_actions(limit: int = 50):
    """Get recent action logs for all incidents"""
    recent_actions = sorted(incident_action_logs, key=lambda x: x["timestamp"], reverse=True)[:limit]
    return {"actions": recent_actions}

# --- Dispatch Endpoint ---
@incident_router.post("/api/dispatch")
async def dispatch_unit(body: dict = Body(...)):
    incident_id = body.get("incident_id")
    unit_id = body.get("unit_id")
    incident = incidents.get(incident_id)
    if not incident:
        return {"status": "error", "message": "Incident not found"}
    if unit_id not in incident.assigned_units:
        incident.assigned_units.append(unit_id)
    incident.status = IncidentStatus.DISPATCHED
    incidents[incident_id] = incident
    
    # Log the dispatch action
    log_incident_action("dispatched", incident_id, body.get("user", "dispatcher"), {
        "unit_id": unit_id,
        "status": "dispatched"
    })
    
    log_event("Dispatch", f"Unit {unit_id} dispatched to incident {incident_id}", {"incident_id": incident_id, "unit_id": unit_id})
    return {"status": "success", "incident": incident}

# Register router
app.include_router(incident_router)

@app.get("/api/assets")
async def get_assets():
    """Get current asset pool with status and position"""
    return {
        "assets": simulation_state["assets"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
