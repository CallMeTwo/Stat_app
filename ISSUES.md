# Known Issues & Solutions

## 🔴 Critical Issue: Python 3.13 Incompatibility with Pandas

### Problem
Render deployment fails with **Python 3.13.4** when trying to install pandas 2.1.3.

**Error:**
```
error: subprocess-exited-with-error
× Preparing metadata (pyproject.toml) did not run successfully.
Compilation fails: _PyLong_AsByteArray function signature mismatch
```

### Root Cause
- Pandas 2.1.3 uses Cython to compile C extensions
- Python 3.13 changed the `_PyLong_AsByteArray` function signature
- Older Cython versions don't support Python 3.13's new API
- Pre-built wheels for pandas 2.1.3 are not available for Python 3.13

### What We Tried (All Failed)
1. ❌ Update pandas to 2.2.0 → Same compilation error on Python 3.13
2. ❌ Create `runtime.txt` with `python-3.11.8` → Render ignored it, still used 3.13
3. ❌ Add `pythonVersion: "3.11"` to `render.yaml` → Render still chose 3.13
4. ❌ Use `--prefer-binary` flag → Wheels don't exist for Python 3.13

### Solutions (Choose One)

#### ✅ Solution 1: Use Different Model (RECOMMENDED)
If you have access to a newer model/framework:
- Use **latest pandas 2.3+** which has full Python 3.13 support
- Or use a different data science library with Python 3.13 wheels
- Or switch to **Python 3.11** (which we tried to force but Render ignored)

#### ✅ Solution 2: Fork Render Build Process
Create a custom Dockerfile that:
```dockerfile
FROM python:3.11
COPY . /app
WORKDIR /app
RUN pip install -r backend/requirements.txt
RUN cd frontend && npm install && npm run build
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0"]
```

#### ✅ Solution 3: Use Newer Pandas Version
If upgrading to pandas 3.0+ (once released):
```txt
pandas>=3.0.0  # Full Python 3.13 support
numpy>=2.0.0
scipy>=1.13.0
```

#### ✅ Solution 4: Switch Providers
Try deploying on:
- **Heroku** (better Python version control)
- **Railway** (more flexible environment setup)
- **Fly.io** (custom Docker support)
- **AWS/Google Cloud** (full control)

#### ✅ Solution 5: Remove Pandas Dependency
Rewrite data processing without pandas:
- Use **numpy + csv** for basic operations
- Use **polars** (has better Python 3.13 support)
- Use **DuckDB** (lightweight SQL engine)

---

## 📋 Files Modified for Deployment

### Created:
- `runtime.txt` - Specifies Python version (ignored by Render)
- `ISSUES.md` - This file

### Modified:
- `render.yaml` - Added `pythonVersion: "3.11"` (ignored by Render)
- `backend/requirements.txt` - Tried multiple version combinations

---

## 🔍 Investigation Details

### Render Behavior
```
Expected:  Use Python 3.11 (from runtime.txt or render.yaml)
Actual:    Render used Python 3.13.4 (default)
Reason:    Unknown - possible Render default override
```

### Deployment Timeline
1. **18:08** - First attempt: pandas 2.1.3 + Python 3.13 → Compilation error
2. **18:11** - Second attempt: pandas 2.2.0 + Python 3.13 → Compilation error
3. **18:53** - Third attempt: pandas 2.0.3 + Python 3.13 → Dependency error (numpy)
4. **18:55** - Fourth attempt: pandas 2.1.3 + numpy 1.24.3 + Python 3.13 → Compilation error
5. **18:11** - Fifth attempt: Added runtime.txt, pandas 2.1.3 + Python 3.13 → Still 3.13!
6. **18:11** - Sixth attempt: Modified render.yaml with Python 3.11 → Still 3.13!

---

## 💡 Recommended Next Steps

### Immediate (Before Next Deployment)
1. Verify Render is respecting `render.yaml` settings
   - Check Render docs for Python version override precedence
   - Consider contacting Render support

2. Test locally with Python 3.13
   ```bash
   python3.13 -m venv venv-py313
   source venv-py313/bin/activate
   pip install -r backend/requirements.txt
   ```

3. Verify `render.yaml` is being detected
   - Render should auto-deploy using `render.yaml`
   - Check if there are deployment settings in Render dashboard overriding YAML

### Medium-term
1. Upgrade pandas when Python 3.13 support is better
2. Consider using `environment.yml` (Conda) for better Python control
3. Evaluate alternative frameworks (FastAPI → Django, etc.)

### Long-term
1. Monitor pandas releases for full Python 3.13 support
2. Plan migration to fully Python 3.13 compatible stack
3. Consider containerized deployment (Docker) for full control

---

## 📝 Development Notes

### Local Development (Still Works)
- Backend runs fine on local Python 3.10/3.11
- Frontend builds and runs correctly
- File upload and analysis features work as expected
- Only deployment to Render fails

### Tested Versions
| Dependency | Version Tested | Status |
|-----------|--------|--------|
| pandas | 2.0.3, 2.1.3, 2.2.0 | ❌ All fail on Python 3.13 |
| numpy | 1.24.3, 1.26.2 | ❌ Fails on Python 3.13 |
| scipy | 1.11.4, 1.13.0 | ✅ Works |
| FastAPI | 0.104.1 | ✅ Works |
| Python | 3.13.4 | ❌ Incompatible |
| Python | 3.11 (attempted) | ⏸️ Render ignored request |

---

## 🔗 References

### Pandas & Python 3.13
- https://github.com/pandas-dev/pandas/issues/54851
- Pandas 3.0+ expected to have full Python 3.13 support

### Render Documentation
- https://render.com/docs/python-version
- Python version selection guide

### Workarounds
- Use Docker for full environment control
- Pin Python in `runtime.txt` (should work, but didn't for us)
- Use `pyproject.toml` with `requires-python`

---

## ✅ Verified Working Solutions

### Working Setup (Local)
```bash
Python: 3.10.12 or 3.11.8
pandas: 2.1.3
numpy: 1.26.2
scipy: 1.11.4
FastAPI: 0.104.1
```

### What To Do When Switching Models
1. Re-run: `pip install -r backend/requirements.txt`
2. Start backend: `./start-backend.sh`
3. Start frontend: `./start-frontend.sh`
4. Test upload at: `http://localhost:5173`
5. Then attempt Render deployment with chosen solution above

---

**Last Updated:** 2025-12-13
**Status:** Blocked on Render - Awaiting Python 3.13 fix or model switch
