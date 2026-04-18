# ListManager Pro

A complete two-tier List Management System. This repository contains both a live-preview implementation (Node.js + React) and a project-ready implementation (Python + Flask + MySQL).

## 🚀 Live Preview (This Environment)
The application you see in the preview is running:
- **Frontend**: React (Vite) with Tailwind CSS
- **Backend**: Node.js (Express)
- **Database**: SQLite (configured for zero-setup preview)

## 🐍 Python / Flask Implementation (For College Project)
The files requested for the college project are located in the `/python_source` directory.

### Quick Start with Docker
```bash
cd python_source
docker-compose up --build
```
This will start:
1. **Flask API** on `http://localhost:5000`
2. **MySQL Database** on `port 3306`

### Manual Setup (Without Docker)
1. Install requirements: `pip install -r requirements.txt`
2. Create a `.env` file based on `config.py` defaults.
3. Run the app: `python app.py`

## 📡 API Reference

### 1. View All Items
**Request:**
```bash
curl -X GET http://localhost:3000/api/items
```

### 2. Add New Item
**Request:**
```bash
curl -X POST http://localhost:3000/api/items \
     -H "Content-Type: application/json" \
     -d '{"title": "Buy Milk", "description": "Needs to be semi-skimmed"}'
```

### 3. Update Item
**Request:**
```bash
curl -X PUT http://localhost:3000/api/items/1 \
     -H "Content-Type: application/json" \
     -d '{"title": "Buy Almond Milk", "description": "Healthier option"}'
```

### 4. Delete Item
**Request:**
```bash
curl -X DELETE http://localhost:3000/api/items/1
```

## ⚙️ CI/CD Pipeline
The project includes a `Jenkinsfile` for automated software delivery.

### Features:
- **Build & Lint**: Automatically checks frontend code quality.
- **Dependency Audit**: Verifies and installs backend requirements.
- **Dockerization**: Automatically builds a production-ready Docker image of the Flask backend.
- **Security**: Includes a stage for npm vulnerability scanning.

## 🛠 Project Structure
- `src/App.tsx`: Main React UI.
- `server.ts`: Express backend for the live preview.
- `python_source/`: Full Python/Flask source code.
  - `app.py`: Flask entry point.
  - `models/`: Database logic (raw SQL).
  - `routes/`: API endpoint definitions.
  - `Dockerfile` & `docker-compose.yml`: Containerization setup.
