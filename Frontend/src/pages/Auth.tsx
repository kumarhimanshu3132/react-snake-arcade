import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

function Auth() {
  const location = useLocation();
  const initialMode = location.state?.mode || 'login';
  const [activeForm, setActiveForm] = useState<'login' | 'register'>(initialMode);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Login / Reset State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [resetStep, setResetStep] = useState<0 | 1 | 2 | 3>(0);
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Register State
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const navigate = useNavigate();

  // --- Login & Reset Flow ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeForm !== 'login') return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    try {
      if (resetStep === 0) {
        if (!loginEmail.trim()) { toast.error('Email is required'); return; }
        if (!emailRegex.test(loginEmail)) { toast.error('Please enter a valid email address'); return; }
        if (!loginPassword.trim()) { toast.error('Password is required'); return; }

        // Normal Login
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: loginEmail,
          password: loginPassword
        });
        if (response.status === 200) {
          localStorage.setItem('token', response.data.token);
          if (response.data.username) {
            localStorage.setItem('username', response.data.username);
          }
          toast.success(response.data.message);
          navigate('/dashboard');
        }
      } else if (resetStep === 1) {
        if (!loginEmail.trim()) { toast.error('Email is required'); return; }
        if (!emailRegex.test(loginEmail)) { toast.error('Please enter a valid email address'); return; }

        // Send OTP for reset
        const response = await axios.post('http://localhost:5000/api/auth/send-otp', {
          email: loginEmail,
          isLogin: true
        });
        if (response.status === 200) {
          toast.success(response.data.message);
          setResetStep(2);
        }
      } else if (resetStep === 2) {
        if (!resetOtp.trim()) { toast.error('OTP is required'); return; }

        // Verify OTP for reset
        const response = await axios.post('http://localhost:5000/api/auth/verify-otp', {
          email: loginEmail,
          otp: resetOtp
        });
        if (response.status === 200) {
          toast.success(response.data.message);
          setResetStep(3);
        }
      } else if (resetStep === 3) {
        if (!resetNewPassword.trim()) { toast.error('New password is required'); return; }

        // Reset Password
        const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
          email: loginEmail,
          newPassword: resetNewPassword
        });
        toast.success(response.data.message);
        setResetStep(0);
        setLoginPassword('');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Something went wrong!");
      }
    }
  };

  // --- Register Flow ---
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeForm !== 'register') return;

    try {
      if (regStep === 1) {
        if (!regName.trim()) { toast.error('Name is required'); return; }
        const nameRegex = /^[A-Za-z]+( [A-Za-z]+)* ?$/;
        if (!nameRegex.test(regName)) {
          toast.error('Name can only contain letters and a single space');
          return;
        }

        if (!regEmail.trim()) { toast.error('Email is required'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(regEmail)) {
          toast.error('Please enter a valid email address');
          return;
        }

        // Send OTP
        const response = await axios.post('http://localhost:5000/api/auth/send-otp', {
          email: regEmail,
          isLogin: false
        });
        if (response.status === 200) {
          toast.success(response.data.message);
          setRegStep(2);
        }
      } else if (regStep === 2) {
        if (!regOtp.trim()) { toast.error('OTP is required'); return; }

        // Verify OTP
        const response = await axios.post('http://localhost:5000/api/auth/verify-otp', {
          email: regEmail,
          otp: regOtp
        });
        if (response.status === 200) {
          toast.success(response.data.message);
          setRegStep(3);
        }
      } else if (regStep === 3) {
        if (!regPassword.trim()) { toast.error('Password is required'); return; }

        // Create Account
        const response = await axios.post('http://localhost:5000/api/auth/register', {
          name: regName,
          email: regEmail,
          password: regPassword
        });
        if (response.status === 200 || response.status === 201) {
          setToastMessage('Registration successful! Please sign in.');
          setRegStep(1);
          setRegName('');
          setRegEmail('');
          setRegOtp('');
          setRegPassword('');
          setActiveForm('login');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex items-center justify-center p-4 relative overflow-hidden py-12">
      {/* Dynamic Animated Background Blobs */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-[128px] transition-all duration-1000 ${activeForm === 'register' ? 'opacity-0 scale-50' : 'opacity-20 bg-blue-500 scale-100'}`}></div>
      <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-[128px] transition-all duration-1000 ${activeForm === 'login' ? 'opacity-0 scale-50' : 'opacity-20 bg-green-500 scale-100'}`}></div>

      {toastMessage && (
        <div className="absolute top-8 right-8 z-50 bg-green-500/90 text-white px-6 py-3 rounded-lg shadow-lg border border-green-400 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col gap-8 justify-center items-center w-full max-w-6xl">
        {activeForm === 'register' ? (
          <div className="relative bg-gray-900/80 backdrop-blur-md border border-green-500/50 p-6 md:p-10 rounded-2xl w-full max-w-[95%] md:max-w-md shadow-[0_0_50px_rgba(34,197,94,0.3)] z-20 animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text mb-6 md:mb-8 text-center uppercase tracking-widest drop-shadow-md bg-linear-to-r from-green-400 to-blue-500">
              JOIN THE ARENA
            </h2>

            <form onSubmit={handleRegisterSubmit} noValidate className="flex flex-col gap-6">
              {regStep === 1 && (
                <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full p-4 bg-gray-800/80 text-white rounded-xl focus:outline-none border transition-all duration-300 ease-in-out placeholder-gray-400 focus:ring-2 focus:ring-green-500/50 border-gray-500 focus:border-green-500"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Player Email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full p-4 bg-gray-800/80 text-white rounded-xl focus:outline-none border transition-all duration-300 ease-in-out placeholder-gray-400 focus:ring-2 focus:ring-green-500/50 border-gray-500 focus:border-green-500"
                    required
                  />
                </div>
              )}

              {regStep === 2 && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <input
                    type="text"
                    placeholder="6-Digit OTP"
                    value={regOtp}
                    onChange={(e) => setRegOtp(e.target.value)}
                    maxLength={6}
                    className="w-full p-4 bg-gray-800/80 text-white rounded-xl focus:outline-none border transition-all duration-300 ease-in-out placeholder-gray-400 focus:ring-2 focus:ring-green-500/50 border-gray-500 focus:border-green-500"
                    required
                  />
                </div>
              )}

              {regStep === 3 && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <input
                    type="password"
                    placeholder="Secret Password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full p-4 bg-gray-800/80 text-white rounded-xl focus:outline-none border transition-all duration-300 ease-in-out placeholder-gray-400 focus:ring-2 focus:ring-green-500/50 border-gray-500 focus:border-green-500"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="mt-4 w-full py-4 text-white font-black text-lg uppercase tracking-wider rounded-xl transition-all duration-300 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-lg shadow-green-500/40 hover:scale-[1.02]"
              >
                {regStep === 1 ? 'SEND OTP' : regStep === 2 ? 'VERIFY' : 'CREATE ACCOUNT'}
              </button>

              {regStep !== 1 && (
                <p className="text-center text-sm text-green-400 hover:text-green-300 cursor-pointer transition-colors" onClick={() => setRegStep(1)}>
                  &larr; Back to start
                </p>
              )}
            </form>
            
            <div className="mt-8 text-center">
              <span onClick={() => setActiveForm('login')} className="text-gray-400 hover:text-white cursor-pointer font-medium transition-colors text-sm">
                Already have an account? Sign In to Play
              </span>
            </div>
          </div>
        ) : (
          <div className="relative bg-gray-900/80 backdrop-blur-md border border-blue-500/50 p-6 md:p-10 rounded-2xl w-full max-w-[95%] md:max-w-md shadow-[0_0_50px_rgba(59,130,246,0.3)] z-20 animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text mb-6 md:mb-8 text-center uppercase tracking-widest drop-shadow-md bg-linear-to-r from-blue-400 to-indigo-500">
              {resetStep === 0 ? 'WELCOME BACK' : 'RESET PASSWORD'}
            </h2>

            <form onSubmit={handleLoginSubmit} noValidate className="flex flex-col gap-6">
              {(resetStep === 0 || resetStep === 1) && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <input
                    type="email"
                    placeholder="Player Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full p-4 bg-gray-800/80 text-white rounded-xl focus:outline-none border transition-all duration-300 ease-in-out placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 border-gray-500 focus:border-blue-500"
                    required
                  />
                </div>
              )}

              {resetStep === 0 && (
                <div className="flex flex-col gap-2 animate-[fadeIn_0.3s_ease-out]">
                  <input
                    type="password"
                    placeholder="Secret Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-4 bg-gray-800/80 text-white rounded-xl focus:outline-none border transition-all duration-300 ease-in-out placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 border-gray-500 focus:border-blue-500"
                    required
                  />
                  <span
                    onClick={() => setResetStep(1)}
                    className="text-sm text-blue-400 hover:text-blue-300 self-end cursor-pointer transition-colors"
                  >
                    Forgot Password?
                  </span>
                </div>
              )}

              {resetStep === 2 && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <input
                    type="text"
                    placeholder="6-Digit OTP"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    maxLength={6}
                    className="w-full p-4 bg-gray-800/80 text-white rounded-xl focus:outline-none border transition-all duration-300 ease-in-out placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 border-gray-500 focus:border-blue-500"
                    required
                  />
                </div>
              )}

              {resetStep === 3 && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <input
                    type="password"
                    placeholder="New Secret Password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full p-4 bg-gray-800/80 text-white rounded-xl focus:outline-none border transition-all duration-300 ease-in-out placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 border-gray-500 focus:border-blue-500"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="mt-4 w-full py-4 text-white font-black text-lg uppercase tracking-wider rounded-xl transition-all duration-300 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 shadow-lg shadow-blue-500/40 hover:scale-[1.02]"
              >
                {resetStep === 0 ? 'START PLAYING' : resetStep === 1 ? 'SEND OTP' : resetStep === 2 ? 'VERIFY' : 'RESET PASSWORD'}
              </button>

              {resetStep !== 0 && (
                <p className="text-center text-sm text-blue-400 hover:text-blue-300 cursor-pointer transition-colors" onClick={() => setResetStep(0)}>
                  &larr; Back to Login
                </p>
              )}
            </form>

            <div className="mt-8 text-center">
              <span onClick={() => setActiveForm('register')} className="text-gray-400 hover:text-white cursor-pointer font-medium transition-colors text-sm">
                New User? Click here to Register
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Auth;
