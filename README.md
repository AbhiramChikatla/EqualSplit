# EqualSplit 💸

EqualSplit is a modern, full-stack expense sharing application designed to make splitting bills with friends, family, and roommates effortless. Track shared expenses, settle debts, and keep everyone's balance in check with an intuitive interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![React](https://img.shields.io/badge/react-18+-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg)

## ✨ Key Features

- **🔐 Secure Authentication**: JWT-based secure signup and login.
- **👥 Group Management**: Create groups for trips, households, or events.
- **💰 Smart Splits**: Support for multiple split types:
  - **Equal**: Split equally among all participants.
  - **Exact**: Specify exact amounts for each person.
  - **Percentage**: Split by percentage.
  - **Shares**: Split by number of shares.
- **⚖️ Debt Simplification**: Algorithm to minimize the number of transactions needed to settle up.
- **📊 Dashboard**: Real-time overview of "Total you owe" and "Total owed to you".
- **📧 Notifications**: Email alerts for new expenses and group invites (powered by Resend).
- **🎨 Modern UI**: Beautiful, responsive design built with Tailwind CSS and Radix UI.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Create React App)
- **Styling**: Tailwind CSS
- **Components**: Radix UI (shadcn/ui compatible)
- **Animations**: Framer Motion
- **State Management**: React Context API

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Async Motor driver)
- **Authentication**: PyJWT & BCrypt
- **Email Service**: Resend

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (running locally or cloud)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/equalsplit.git
cd equalsplit
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# (Edit .env with your MongoDB URL and other secrets)

# Start server
uvicorn server:app --reload
```
The backend will run at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
# Ensure REACT_APP_BACKEND_URL=http://localhost:8000

# Start development server
npm start
```
The frontend will run at `http://localhost:3000`.

## 🐳 Docker Support

Run the entire stack with a single command:

```bash
docker-compose up --build
```

## 🌍 Deployment

### Backend (Render)
1. Fork repo to GitHub.
2. Create a new Web Service on Render.
3. Select `backend` as Root Directory.
4. Set Build Command: `pip install -r requirements.txt`.
5. Set Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`.
6. Add Environment Variables (`MONGO_URL`, `JWT_SECRET`, etc.).

### Frontend (Vercel)
1. Import project into Vercel.
2. Select `frontend` as Root Directory.
3. Add Environment Variable `REACT_APP_BACKEND_URL` (your Render backend URL).
4. Deploy.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
