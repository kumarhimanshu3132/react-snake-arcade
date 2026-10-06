import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

function Auth() {
  const location = useLocation();
  const initialMode = location.state?.mode || "login";
  const [activeForm, setActiveForm] = useState<"login" | "register">(
    initialMode,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [resetStep, setResetStep] = useState<0 | 1>(0);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeForm !== "login") return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    try {
      if (resetStep === 0) {
        if (!loginEmail.trim()) {
          toast.error("Email is required");
          return;
        }
        if (!emailRegex.test(loginEmail)) {
          toast.error("Please enter a valid email address");
          return;
        }
        if (!loginPassword.trim()) {
          toast.error("Password is required");
          return;
        }

        const response = await axios.post(
          "https://react-snake-arcade.onrender.com/api/auth/login",
          {
            email: loginEmail,
            password: loginPassword,
          },
        );
        if (response.status === 200) {
          localStorage.setItem("token", response.data.token);
          if (response.data.username) {
            localStorage.setItem("username", response.data.username);
          }
          toast.success(response.data.message);
          navigate("/dashboard");
        }
      } else if (resetStep === 1) {
        if (!loginEmail.trim()) {
          toast.error("Email is required");
          return;
        }
        if (!emailRegex.test(loginEmail)) {
          toast.error("Please enter a valid email address");
          return;
        }

        const response = await axios.post(
          "https://react-snake-arcade.onrender.com/api/auth/forgot-password",
          {
            email: loginEmail,
          },
        );
        if (response.status === 200) {
          alert(`Your new password is: ${response.data.temporaryPassword}`);
          setResetStep(0);
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Something went wrong!");
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeForm !== "register") return;

    try {
      if (!regName.trim()) {
        toast.error("Name is required");
        return;
      }
      const nameRegex = /^[A-Za-z]+( [A-Za-z]+)* ?$/;
      if (!nameRegex.test(regName)) {
        toast.error("Name can only contain letters and a single space");
        return;
      }

      if (!regEmail.trim()) {
        toast.error("Email is required");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(regEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }

      if (!regPassword.trim()) {
        toast.error("Password is required");
        return;
      }

      const response = await axios.post(
        "https://react-snake-arcade.onrender.com/api/auth/register",
        {
          name: regName,
          email: regEmail,
          password: regPassword,
        },
      );
      if (response.status === 200 || response.status === 201) {
        setToastMessage("Registration successful! Please sign in.");
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setActiveForm("login");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Registration failed",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex items-center justify-center p-4 relative overflow-hidden py-12">
      {/* Dynamic Animated Background Blobs */}
      <div
        className={`absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-[128px] transition-all duration-1000 ${activeForm === "register" ? "opacity-0 scale-50" : "opacity-20 bg-blue-500 scale-100"}`}
      ></div>
      <div
        className={`absolute bottom-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-[128px] transition-all duration-1000 ${activeForm === "login" ? "opacity-0 scale-50" : "opacity-20 bg-green-500 scale-100"}`}
      ></div>

      {toastMessage && (
        <div className="absolute top-8 right-8 z-50 bg-green-500/90 text-white px-6 py-3 rounded-lg shadow-lg border border-green-400 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col gap-8 justify-center items-center w-full max-w-6xl">
        {activeForm === "register" ? (
          <div className="relative bg-gray-900/80 backdrop-blur-md border border-green-500/50 p-6 md:p-10 rounded-2xl w-full max-w-[95%] md:max-w-md shadow-[0_0_50px_rgba(34,197,94,0.3)] z-20 animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text mb-6 md:mb-8 text-center uppercase tracking-widest drop-shadow-md bg-linear-to-r from-green-400 to-blue-500">
              JOIN THE ARENA
            </h2>

            <form
              onSubmit={handleRegisterSubmit}
              noValidate
              className="flex flex-col gap-6"
            >
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
                <input
                  type="password"
                  placeholder="Secret Password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full p-4 bg-gray-800/80 text-white rounded-xl focus:outline-none border transition-all duration-300 ease-in-out placeholder-gray-400 focus:ring-2 focus:ring-green-500/50 border-gray-500 focus:border-green-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="mt-4 w-full py-4 text-white font-black text-lg uppercase tracking-wider rounded-xl transition-all duration-300 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-lg shadow-green-500/40 hover:scale-[1.02]"
              >
                CREATE ACCOUNT
              </button>
            </form>

            <div className="mt-8 text-center">
              <span
                onClick={() => setActiveForm("login")}
                className="text-gray-400 hover:text-white cursor-pointer font-medium transition-colors text-sm"
              >
                Already have an account? Sign In to Play
              </span>
            </div>
          </div>
        ) : (
          <div className="relative bg-gray-900/80 backdrop-blur-md border border-blue-500/50 p-6 md:p-10 rounded-2xl w-full max-w-[95%] md:max-w-md shadow-[0_0_50px_rgba(59,130,246,0.3)] z-20 animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text mb-6 md:mb-8 text-center uppercase tracking-widest drop-shadow-md bg-linear-to-r from-blue-400 to-indigo-500">
              {resetStep === 0 ? "WELCOME BACK" : "RESET PASSWORD"}
            </h2>

            <form
              onSubmit={handleLoginSubmit}
              noValidate
              className="flex flex-col gap-6"
            >
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

              <button
                type="submit"
                className="mt-4 w-full py-4 text-white font-black text-lg uppercase tracking-wider rounded-xl transition-all duration-300 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 shadow-lg shadow-blue-500/40 hover:scale-[1.02]"
              >
                {resetStep === 0
                  ? "START PLAYING"
                  : "GET TEMPORARY PASSWORD"}
              </button>

              {resetStep !== 0 && (
                <p
                  className="text-center text-sm text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
                  onClick={() => setResetStep(0)}
                >
                  &larr; Back to Login
                </p>
              )}
            </form>

            <div className="mt-8 text-center">
              <span
                onClick={() => setActiveForm("register")}
                className="text-gray-400 hover:text-white cursor-pointer font-medium transition-colors text-sm"
              >
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
