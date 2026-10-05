import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://react-snake-arcade.onrender.com/api/auth/signup",
        {
          name,
          email,
          password,
        },
      );
      alert(response.data.message);
      navigate("/login");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(error.response.data.error);
      } else {
        alert("Something went wrong!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="relative bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 p-6 md:p-10 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.15)] w-full max-w-[95%] md:max-w-md z-10">
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-green-400 to-blue-500 mb-6 md:mb-8 text-center uppercase tracking-widest drop-shadow-md">
          Join the Arena
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="relative group">
            <input
              type="text"
              placeholder="Player Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-gray-800/80 text-white rounded-xl outline-none border border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-all placeholder-gray-400"
              required
            />
          </div>
          <div className="relative group">
            <input
              type="email"
              placeholder="Player Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-800/80 text-white rounded-xl outline-none border border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-all placeholder-gray-400"
              required
            />
          </div>
          <div className="relative group">
            <input
              type="password"
              placeholder="Secret Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-800/80 text-white rounded-xl outline-none border border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-all placeholder-gray-400"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-4 w-full py-4 bg-linear-to-r from-green-500 to-emerald-600 text-gray-900 font-black text-lg uppercase tracking-wider rounded-xl hover:from-green-400 hover:to-emerald-500 transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-[1.02]"
          >
            Create Account
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 font-medium">
          Already a player?{" "}
          <Link
            to="/login"
            className="text-green-400 hover:text-green-300 font-bold hover:underline tracking-wide transition-colors"
          >
            Login Here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
