# Stats React - Quick Start

## ⚡ Start Servers (30 seconds setup)

### Option 1: Using Shell Scripts (Easiest)

**Terminal 1 - Backend:**
```bash
cd /home/chanavee/Documents/venv/Stats_React
./start-backend.sh
```

**Terminal 2 - Frontend:**
```bash
cd /home/chanavee/Documents/venv/Stats_React
./start-frontend.sh
```

### Option 2: Manual Commands

**Terminal 1 - Backend:**
```bash
cd /home/chanavee/Documents/venv/Stats_React/backend
source venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd /home/chanavee/Documents/venv/Stats_React/frontend
npm run dev
```

## 🌐 Access Application

### Local Access
```
http://localhost:5173
```

### Network Access (from 172.29.28.157)
```
http://172.29.28.157:5173
```

### Remote Access (from another computer on network)
```
http://172.29.28.157:5173
```

## ✅ Verify Everything Works

### Check Backend Health
```bash
curl http://172.29.28.157:5000/api/health
```

Should return:
```json
{"status": "ok", "service": "Stats React API"}
```

### Test Upload Endpoint
Use the web interface to upload `sample_data/small_dataset.csv`

## 📊 Test Data Available

Located in `sample_data/`:
- `small_dataset.csv` - Small dataset (7 rows)
- `large_dataset.xlsx` - Large dataset (113 KB)

## 📝 Typical Test Flow

1. Upload `sample_data/small_dataset.csv`
2. View "Data Preview"
3. Go to "Analysis" tab
4. Select analysis type:
   - Descriptive Statistics (mean, std, min, max)
   - Correlation Matrix (relationships between variables)
   - Distribution Analysis (skewness, kurtosis, normality)
5. Enter column names: `age, height, weight`
6. Click "Run Analysis"
7. View results on "Results" tab

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Frontend won't load | Check backend is running: `curl http://172.29.28.157:5000/api/health` |
| CORS error | Check backend/.env.local has `ALLOWED_ORIGINS=http://172.29.28.157:5173` |
| Port already in use | Kill process: `lsof -i :5000` then `kill PID` |
| Dependencies missing | Run `npm install` in frontend and `pip install -r requirements.txt` in backend |

## 📚 More Information

- **Setup Guide:** See `PLAN.md` for detailed architecture
- **API Documentation:** See `README.md` for API endpoints
- **Testing Guide:** See `TESTING_GUIDE.md` for comprehensive testing

---

**Server Status:**
- Frontend: Ready ✅
- Backend: Ready ✅
- Sample Data: Ready ✅

**Ready to test!**
