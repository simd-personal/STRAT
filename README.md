# 🚀 STRATOS - AI-Powered Mission Planning Dashboard

**STRATOS** is a comprehensive mission planning and execution platform that combines AI-powered decision support with real-time simulation capabilities. Built for tactical operations, it provides a suite of intelligent tools for route optimization, asset allocation, contingency planning, and mission debriefing.

## 🎯 Project Overview

STRATOS transforms complex mission planning into an intuitive, AI-assisted workflow. The platform features:

- **AI-Generated Mission Plans** with real-time editing and versioning
- **Live Mission Simulation** with event injection and timeline visualization
- **Intelligent Decision Modules** for tactical operations
- **Real-time Collaboration** and mission tracking
- **Professional Landing Page** for investor demos

### Core Features

- 🤖 **AI Mission Planning**: GPT-4 powered plan generation and refinement
- 🎮 **Real-time Simulation**: Live mission execution with pause/resume
- 🗺️ **Route Optimization**: Threat-aware pathfinding with multiple constraints
- 📊 **Asset Allocation**: Intelligent resource distribution algorithms
- 📋 **SITREP Composer**: AI-assisted situation report generation
- 🔍 **AAR Insights**: Automated after-action review and analysis
- 📈 **Mission Analytics**: Performance tracking and optimization

## 🏗️ Tech Stack

### Frontend
- **Next.js 15.3.4** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - State management and side effects
- **Mapbox GL** - Interactive mapping and visualization

### Backend
- **FastAPI** - Modern Python web framework
- **OpenAI GPT-4 Turbo** - AI-powered content generation
- **Uvicorn** - ASGI server
- **Python 3.11+** - Core runtime

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Docker** - Containerization (infrastructure)
- **Terraform** - Infrastructure as Code

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm**
- **Python 3.11+** and **pip**
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/simd-personal/STRAT.git
cd Stratos
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_api_key_here

# Start the backend server
python3 main.py
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Access the Application

- **Landing Page**: `http://localhost:3000` - Professional demo page
- **Main App**: `http://localhost:3000/app` - Mission planning dashboard
- **API Docs**: `http://localhost:8000/docs` - FastAPI Swagger documentation

## 📁 Project Structure

```
Stratos/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application entry point
│   ├── requirements.txt    # Python dependencies
│   └── venv/              # Virtual environment
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   │   ├── app/       # Main application pages
│   │   │   ├── modules/   # AI mission modules
│   │   │   ├── components/ # Reusable components
│   │   │   └── page.tsx   # Landing page
│   │   └── ...
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.js # Tailwind configuration
├── infra/                  # Infrastructure as Code
│   ├── docker-compose.yml # Docker services
│   ├── Dockerfile.*       # Container definitions
│   └── *.tf              # Terraform configurations
└── README.md              # This file
```

## 🎮 Key Features Deep Dive

### AI Mission Planning
- **Plan Generation**: AI creates comprehensive mission plans using GPT-4
- **Real-time Editing**: Live collaborative editing with version control
- **Plan Comparison**: Side-by-side analysis of different mission approaches
- **Archive System**: Historical plan storage and retrieval

### Live Simulation Engine
- **Real-time Execution**: Live mission simulation with configurable speed
- **Event Injection**: Add unexpected events during simulation
- **Timeline Visualization**: Interactive timeline with event markers
- **Performance Metrics**: Real-time analytics and performance tracking

### AI Mission Modules

#### 🗺️ Route Optimization
- Threat-aware pathfinding algorithms
- Weather and terrain integration
- Multiple constraint optimization
- Real-time route evaluation

#### 📊 Asset Allocation
- Intelligent resource distribution
- Capacity planning and optimization
- Real-time asset tracking
- Performance analytics

#### 📋 SITREP Composer
- AI-assisted report generation
- SALUTE template integration
- Real-time collaboration
- Approval workflow management

#### 🔍 AAR Insights
- Automated after-action analysis
- Performance pattern recognition
- Improvement recommendations
- Historical trend analysis

## 🔧 Development Guidelines

### Code Style
- **Frontend**: Follow Next.js and React best practices
- **Backend**: Use FastAPI conventions and type hints
- **CSS**: Utility-first approach with Tailwind CSS
- **Git**: Conventional commit messages

### Adding New Features
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Submit pull request with description

### Environment Variables

#### Backend (.env)
```bash
OPENAI_API_KEY=your_openai_api_key
DEBUG=true
PORT=8000
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## 🐳 Docker Deployment

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📊 API Endpoints

### Core Endpoints
- `GET /api/plan/current` - Get current mission plan
- `POST /api/plan/generate` - Generate new AI plan
- `GET /api/simulation/status` - Get simulation status
- `POST /api/simulation/start-fast` - Start fast simulation
- `POST /api/simulation/start-realtime` - Start real-time simulation

### Module Endpoints
- `POST /api/route-optimization/evaluate` - Evaluate routes
- `POST /api/sitrep-composer/generate` - Generate SITREP
- `GET /api/aar-insights/analyze` - Analyze mission data

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Troubleshooting

### Common Issues

#### Backend Won't Start
- Check if port 8000 is available
- Verify virtual environment is activated
- Ensure all dependencies are installed

#### Frontend Build Errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check Node.js version compatibility

#### API Connection Issues
- Verify backend is running on port 8000
- Check CORS configuration
- Ensure environment variables are set

### Getting Help
- Check the [Issues](https://github.com/simd-personal/STRAT/issues) page
- Review API documentation at `http://localhost:8000/docs`
- Contact the development team

## 🚀 Deployment

### Production Checklist
- [ ] Set production environment variables
- [ ] Configure CORS for production domains
- [ ] Set up SSL certificates
- [ ] Configure database connections
- [ ] Set up monitoring and logging
- [ ] Test all critical paths
- [ ] Update API documentation

---

**STRATOS** - Transforming Mission Planning with AI Intelligence 🎯
