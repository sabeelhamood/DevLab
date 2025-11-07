# Local Testing Guide for 2-Player Anonymous Competition Feature

## 🎯 Overview

This guide helps you test the complete 2-player anonymous competition feature locally, exactly as it
works in the deployed version, without affecting production.

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
./setup-local-testing.sh    # Linux/Mac
# or
setup-local-testing.bat     # Windows
```

### Option 2: Manual Setup

1. **Create Environment Files**

   ```bash
   # Backend
   cp backend/env.local.example backend/.env.local

   # Frontend
   cp frontend/env.local.example frontend/.env.local
   ```

2. **Install Dependencies**

   ```bash
   # Backend
   cd backend && npm install

   # Frontend
   cd frontend && npm install
   ```

3. **Configure Environment Variables**
   - Edit `backend/.env.local` with your API keys (optional for testing)
   - `frontend/.env.local` is already configured for local testing

## 🏃‍♂️ Running the Application

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

Backend will run on: `http://localhost:3001`

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:5173`

## 🧪 Testing the Competition Feature

### 1. Access the Application

- Open `http://localhost:5173` in your browser
- You should see the main application interface

### 2. Navigate to Competition Invitation

- Go to: `http://localhost:5173/competition/invitation`
- You should see the invitation interface with available opponents

### 3. Test the Complete Flow

#### Step 1: Accept Invitation

- Click "Challenge" on any available opponent
- This creates a competition with 3 questions

#### Step 2: Competition Questions

- Navigate to: `http://localhost:5173/competition/{id}/question/1`
- Test the timer functionality (10 minutes per question)
- Test the progress bar
- Test sound effects (if enabled)
- Submit an answer or let the timer auto-submit

#### Step 3: Complete All Questions

- Repeat for questions 2 and 3
- Each question has a 10-minute timer
- Progress bar shows completion status

#### Step 4: View Results

- Navigate to: `http://localhost:5173/competition/{id}/results`
- Verify anonymous results (Player A vs Player B)
- Check winner determination
- Test celebration animations

## 🔧 Features to Test

### ✅ Core Functionality

- [ ] Competition invitation system
- [ ] 2-player anonymous matching
- [ ] 3-question competition flow
- [ ] Timer functionality (10 min per question)
- [ ] Auto-submission when time runs out
- [ ] Progress bar with color coding
- [ ] Sound effects (start, countdown, completion)
- [ ] Answer evaluation (mock or real Gemini)
- [ ] Winner determination
- [ ] Anonymous results display

### ✅ UI/UX Elements

- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Celebration animations
- [ ] Progress indicators
- [ ] Timer warnings
- [ ] Sound controls

### ✅ Integration Points

- [ ] Backend API endpoints (`/api/competitions/*`)
- [ ] Frontend routing
- [ ] Environment variable configuration
- [ ] Mock data fallbacks
- [ ] Error boundaries

## 🐛 Troubleshooting

### Backend Issues

- **Port 3001 in use**: Change `PORT` in `backend/.env.local`
- **Database connection**: Check Supabase credentials in `.env.local`
- **API key errors**: Mock data will be used automatically

### Frontend Issues

- **Port 5173 in use**: Vite will automatically use the next available port
- **API connection**: Verify `VITE_API_URL=http://localhost:3001/api` in `.env.local`
- **Component errors**: Check browser console for detailed error messages

### Competition Flow Issues

- **Invitation not loading**: Check backend logs for API errors
- **Timer not working**: Verify JavaScript is enabled and no console errors
- **Sound not playing**: Check browser permissions and sound file paths
- **Results not showing**: Verify competition completion and API responses

## 📊 Mock Data

When API keys are not available, the system uses mock data:

- **Questions**: Pre-defined coding challenges
- **Evaluation**: Random success rate (70%)
- **Results**: Anonymous Player A/B display
- **Timers**: Full functionality with mock submissions

## 🔒 Production Safety

- ✅ No changes to production deployment
- ✅ Local environment isolated
- ✅ Mock data prevents external API calls
- ✅ All existing functionality preserved
- ✅ Environment variables separate from production

## 📝 Testing Checklist

### Pre-Testing

- [ ] Environment files created
- [ ] Dependencies installed
- [ ] Both servers running
- [ ] No console errors

### During Testing

- [ ] Invitation flow works
- [ ] Competition starts correctly
- [ ] Timers function properly
- [ ] Progress bars update
- [ ] Sound effects play
- [ ] Auto-submission works
- [ ] Results display correctly
- [ ] Anonymous names shown
- [ ] Winner determination works

### Post-Testing

- [ ] All features tested
- [ ] No breaking changes
- [ ] Production deployment unaffected
- [ ] Ready for staging deployment

## 🎉 Success Criteria

The competition feature is working correctly when:

1. ✅ Invitations can be sent and accepted
2. ✅ 3-question competition flows smoothly
3. ✅ Timers work with auto-submission
4. ✅ Progress bars and sounds function
5. ✅ Results show anonymous winners
6. ✅ All UI animations work
7. ✅ No errors in console
8. ✅ Production deployment unaffected

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Check backend terminal for API errors
3. Verify environment variables are correct
4. Ensure both servers are running
5. Test with mock data first before adding real API keys

---

**Happy Testing! 🚀**
