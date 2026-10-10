# React Snake Arcade

Dual-game arcade built with React. Features a local multiplayer Snake & Ladder with realistic SVG graphics, and a Classic Snake with Web Audio API sounds.

🔗 **Live Demo:** https://react-snake-arcade-omega.vercel.app/

## 🎮 Features
- **Dual Games:** Classic Snake and Snake & Ladder in a single arcade.
- **Multiplayer:** Local multiplayer support for Snake & Ladder.
- **Immersive Experience:** Realistic SVG graphics and Web Audio API sounds.
- **Quick Access:** Direct login with screen password.

## 💻 Tech Stack
- **Frontend:** React.js (Frontend directory)
- **Backend:** Node.js / Express (Backend directory)

## 🚀 How to Run Locally

**1. Clone the repository:**
```bash
   git clone https://github.com/kumarhimanshu3132/react-snake-arcade.git
```
2. Backend Setup:
```bash
   cd react-snake-arcade/Backend
   npm install
```
   Create a .env file in the Backend folder and add your PORT, MONGO_URI, and JWT_SECRET. Then start the server:
```bash
   node server.js
```
3. Frontend Setup:
   Open a new terminal or tab, then run:
```bash
   cd react-snake-arcade/Frontend
   npm install
```
Create a .env file in the Frontend folder and add your REACT_APP_API_URL. Then build and start the frontend:
```bash
   npm run build
   npm start
```
