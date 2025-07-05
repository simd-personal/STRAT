#!/usr/bin/env python3
"""
Reset script to clear all in-memory data and restore initial state
"""

import json
import datetime
import uuid

# Reset simulation state
def reset_simulation_state():
    return {
        "status": "idle",
        "current_time": "0600",
        "mission_duration": 0,
        "assets": {},
        "threats": {},
        "weather": {
            "condition": "clear",
            "visibility": "good",
            "wind_speed": 5,
            "temperature": 72
        },
        "comms_status": "operational",
        "objectives": [],
        "timeline": [],
        "user_injections": []
    }

# Reset mission planning data
def reset_mission_data():
    return {
        "current_plan": {
            "content": "",
            "updated_at": None,
            "updated_by": None
        },
        "plan_history": [],
        "master_plan": None,
        "sitrep_state": {
            "content": "",
            "status": "draft",
            "version": 1,
            "history": []
        },
        "conops_state": {
            "content": "",
            "status": "draft",
            "version": 1,
            "history": []
        },
        "mission_logs": []
    }

# Reset incident management data
def reset_incident_data():
    return {
        "incidents": {},
        "units": {
            "police-1": {
                "id": "police-1",
                "type": "police",
                "status": "available",
                "location": {"lat": 40.7128, "lng": -74.0060},
                "destination": None,
                "last_update": datetime.datetime.utcnow().isoformat() + 'Z'
            },
            "police-2": {
                "id": "police-2", 
                "type": "police",
                "status": "available",
                "location": {"lat": 40.7589, "lng": -73.9851},
                "destination": None,
                "last_update": datetime.datetime.utcnow().isoformat() + 'Z'
            },
            "fire-1": {
                "id": "fire-1",
                "type": "fire",
                "status": "available", 
                "location": {"lat": 40.7505, "lng": -73.9934},
                "destination": None,
                "last_update": datetime.datetime.utcnow().isoformat() + 'Z'
            },
            "fire-2": {
                "id": "fire-2",
                "type": "fire",
                "status": "available",
                "location": {"lat": 40.7614, "lng": -73.9776},
                "destination": None,
                "last_update": datetime.datetime.utcnow().isoformat() + 'Z'
            },
            "emt-1": {
                "id": "emt-1",
                "type": "emt",
                "status": "available",
                "location": {"lat": 40.7484, "lng": -73.9857},
                "destination": None,
                "last_update": datetime.datetime.utcnow().isoformat() + 'Z'
            },
            "emt-2": {
                "id": "emt-2",
                "type": "emt", 
                "status": "available",
                "location": {"lat": 40.7549, "lng": -73.9840},
                "destination": None,
                "last_update": datetime.datetime.utcnow().isoformat() + 'Z'
            }
        },
        "incident_actions": []
    }

if __name__ == "__main__":
    print("🔄 Resetting STRATOS data to initial state...")
    
    # Create reset data
    reset_data = {
        "simulation_state": reset_simulation_state(),
        "mission_data": reset_mission_data(),
        "incident_data": reset_incident_data(),
        "reset_timestamp": datetime.datetime.utcnow().isoformat() + 'Z'
    }
    
    # Save to file for reference
    with open("reset_data.json", "w") as f:
        json.dump(reset_data, f, indent=2)
    
    print("✅ Reset data prepared and saved to reset_data.json")
    print("📋 Summary of reset:")
    print(f"   - Simulation state: {len(reset_data['simulation_state'])} fields reset")
    print(f"   - Mission data: {len(reset_data['mission_data'])} sections reset") 
    print(f"   - Incident data: {len(reset_data['incident_data']['units'])} units, {len(reset_data['incident_data']['incidents'])} incidents")
    print("\n🚀 Ready to restart services with fresh data!") 