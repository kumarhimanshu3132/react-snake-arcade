import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import SnakeClassic from './pages/SnakeClassic';
import SnakeLadder from './pages/SnakeLadder';

function App() {
  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(17, 24, 39, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          },
          success: {
            style: { border: '1px solid rgba(34, 197, 94, 0.5)', boxShadow: '0 0 15px rgba(34, 197, 94, 0.2)' },
            iconTheme: { primary: '#22c55e', secondary: '#fff' }
          },
          error: {
            style: { border: '1px solid rgba(239, 68, 68, 0.5)', boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)' },
            iconTheme: { primary: '#ef4444', secondary: '#fff' }
          }
        }} 
      />
      <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/signup" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/snake-classic" element={<SnakeClassic />} />
        <Route path="/snake-ladder" element={<SnakeLadder />} />
        
        {/* Awesome New Home Page */}
        <Route path="/" element={
          <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-3xl">
              {/* Gradient Title */}
              <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-green-400 to-blue-500 mb-6 drop-shadow-lg">
                🐍 Snake Eater & Ladders 🎲
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-light">
                The ultimate arcade experience featuring <span className="font-bold text-green-400">Classic Snake Eater</span> and <span className="font-bold text-blue-400">Snake & Ladder</span>.
              </p>
              
              {/* Cool Animated Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link 
                  to="/signup"
                  state={{ mode: 'register' }}
                  className="px-8 py-4 bg-green-500 text-gray-900 font-bold text-lg rounded-full hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105"
                >
                  New User Register Here
                </Link>
                <Link 
                  to="/login"
                  state={{ mode: 'login' }}
                  className="px-8 py-4 bg-gray-800 border-2 border-green-500 text-green-500 font-bold text-lg rounded-full hover:bg-gray-700 transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:scale-105"
                >
                  Already have an account? Sign In
                </Link>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </Router>
    </>
  );
}

export default App;