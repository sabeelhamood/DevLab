# DEVLAB Microservice

Advanced AI-powered interactive learning environment for practical coding exercises and exam preparation.

## 🚀 Quick Start (Localhost)

**Before deployment, test the application locally:**

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env`:
```env
NODE_ENV=development
PORT=3001
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
MONGO_URL=mongodb://localhost:27017/devlab-dev
GEMINI_API_KEY=your-gemini-key
JUDGE0_API_KEY=your-judge0-key
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=debug
```

Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:3001
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: **http://localhost:3001**

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: **http://localhost:5173**

### 4. Open in Browser

Visit: **http://localhost:5173**

**⚠️ Important**: This project is **NOT pushed to GitHub**. All code is local only. Test thoroughly on localhost before any deployment.

**Note**: The application is ready for localhost testing. No deployment will occur until you've tested it locally and approved.

## Project Structure

```
DevLab/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express backend
├── tests/             # Test suite (TDD)
└── docs/              # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- MongoDB Atlas account
- Gemini API key
- Judge0 API key

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd DevLab
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

3. **Install backend dependencies**
```bash
cd ../backend
npm install
```

4. **Configure environment variables**

Backend (`.env`):
```bash
cp .env.example .env
# Edit .env with your values
```

Frontend (`.env.local`):
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

### Development

**Start backend**:
```bash
cd backend
npm run dev
```

**Start frontend**:
```bash
cd frontend
npm run dev
```

Backend runs on `http://localhost:3001`
Frontend runs on `http://localhost:5173`

### Testing

**Run all tests**:
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

**Run tests in watch mode**:
```bash
npm run test:watch
```

## Features

- Dynamic question generation (Gemini AI)
- Secure code execution (Judge0)
- AI-powered feedback system
- Progressive hint system
- Anonymous competitions
- AI fraud detection
- Trainer question validation

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Databases**: Supabase (PostgreSQL), MongoDB Atlas
- **External APIs**: Gemini, Judge0
- **Testing**: Jest, React Testing Library, Vitest

## Documentation

- [Project Foundation](./PROJECT_FOUNDATION.md)
- [Requirements Discovery](./REQUIREMENTS_DISCOVERY.md)
- [Architecture Design](./ARCHITECTURE_DESIGN.md)
- [Feature Planning](./FEATURE_PLANNING.md)
- [Environment Setup](./ENVIRONMENT_SETUP.md)

## License

ISC

