# 🚦 DeepTraff:AI-Powered Traffic Analysis System

DeepTraff is a full-stack intelligent traffic monitoring system that processes road videos using YOLO object detection + DeepSORT tracking to generate:

- Vehicle counts (incoming/outgoing)
- Congestion timeline
- Class-wise statistics (2-wheelers, 3-wheelers, 4-wheelers)
- JSON analytics report
- Automatic chart generation  
- Frontend UI for visualization

This project includes:

- **Backend (FastAPI + MongoDB + OpenVINO YOLO model)**
- **Frontend (React + Vite + Tailwind CSS)**
- **Chart Generator (Matplotlib)**

---

## 📂 Project Structure

```bash
Deeptarff/
│
├── backend/ # FastAPI + YOLO processing + MongoDB auth
│ ├── app.py
│ ├── settings.py
│ ├── auth/
│ ├── exp3.py # Vehicle processing engine
│ ├── analyze_report.py
│ ├── uploads/
│ ├── outputs/
│ ├── jobs/
│ └── .env (ignored)
│
├── deeptraf/ # Frontend - React + Vite
│ ├── src/
│ ├── public/
│ └── package.json
│
└── README.md

```

---

# 🚀 Features

### ✔ AI-powered vehicle detection  
Runs YOLO + DeepSORT for robust tracking and counting.

### ✔ Incoming vs Outgoing detection  
Counts direction using polygon zones.

### ✔ Real-time processing status  
Frontend polls backend every 2 seconds to display progress.

### ✔ Automatic analytics report  
Charts generated:

- Total vehicle count
- Incoming vs Outgoing
- Class-wise distribution (Pie Chart)
- Peak congestion timeline

### ✔ Clean UI with animations  
Built using:

- React + Vite  
- TailwindCSS  
- Framer Motion  
- Lucide Icons  

---

# 🛠️ Tech Stack

### **Backend**
- FastAPI  
- YOLO (Ultralytics)  
- DeepSORT  
- OpenCV  
- Matplotlib  
- Motor / MongoDB  
- Python 3.12–3.13 compatible  

### **Frontend**
- React  
- Vite  
- Tailwind CSS  
- Framer Motion  
- Lucide Icons  

---

# 📦 Installation Guide

## 1️⃣ Clone the repository

```bash
git clone https://github.com/abhi956837/Deeptarff.git
cd Deeptarff
```

1️⃣ Go to backend folder
```bash
cd backend
```
2️⃣ Create virtual environment
```bash
python -m venv myenv
```
3️⃣ Activate virtual environment (Windows)
```bash
myenv\Scripts\activate
```

4️⃣ Install backend dependencies
```bash
pip install -r requirements.txt
```
5️⃣ Create .env file inside backend/
```txt
MONGODB_URI=your-mongo-uri
SECRET_KEY=your-secret-key
DEBUG=true

EMAIL_SENDER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
```
6️⃣ Run FastAPI backend
```bash
uvicorn app:app --host 0.0.0.0 --port 3000 --reload
```
7️⃣ backend runs at
```bash
http://localhost:3000
```

# 🎨 Frontend Installation (React + Vite)

1️⃣ Go to frontend folder
```bash
cd deeptraf
```
2️⃣ Install dependencies
```bash
npm install
```
3️⃣ Start development server
```bash
npm run dev
```
4️⃣ frontend runs at
```bash
http://localhost:5173
```
# 📸 UI Screenshots

### 🏠 Home Page
![Home Page](images/Home%20page.png)

### 🔐 Login Page
![Login Page](images/Login%20Page.png)

### 📝 Signup Page
![Signup Page](images/SignUp%20page.png)

### 📁 Data Input Page
![Data Input](images/Data%20Input%20Page.png)

### 🎥 Video Processing Page
![Video Processing](images/Video%20processing.png)

### 📊 Traffic Analyze Dashboard
![Traffic Analyze](images/Traffic%20Analyze.png)

</details>



