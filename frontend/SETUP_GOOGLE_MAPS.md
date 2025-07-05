# Google Maps API Setup Guide

## To enable driving directions on the map:

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Directions API
     - Geocoding API
   - Create credentials (API Key)
   - Restrict the API key to your domain for security

2. **Add the API Key to your environment:**
   Create a file called `.env.local` in the `frontend` directory with:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

3. **Restart the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## Current Behavior:
- **With API Key:** Shows actual driving directions with turn-by-turn routes
- **Without API Key:** Shows straight lines between units and incidents (fallback)

## Testing:
1. Create an incident on the map
2. Dispatch a unit to the incident
3. You should see either:
   - Blue route line (with API key) - actual driving directions
   - Red straight line (without API key) - direct path

The backend has been updated to properly set unit destinations when dispatching, so the routing should work correctly once the API key is configured. 