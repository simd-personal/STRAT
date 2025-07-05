#!/bin/bash
cd /Users/simba/Stratos/backend && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000 