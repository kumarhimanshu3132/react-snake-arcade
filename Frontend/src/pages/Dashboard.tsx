import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

interface ScoreEntry {
  _id: string;
  playerName: string;
  score: number;
  playTime: string;
  gameType: string;
}

interface UserProfile {
  name: string;
  email: string;
  profileImage: string;
}

function Dashboard() {
  const navigate = useNavigate();
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Easy" | "Medium" | "Hard">(
    "Easy",
  );
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editImage, setEditImage] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [scoresRes, profileRes] = await Promise.all([
          axios.get(
            `https://react-snake-arcade.onrender.com/api/score/leaderboard/${activeTab}`,
            { headers: { Authorization: `Bearer ${token}` } },
          ),
          axios
            .get("https://react-snake-arcade.onrender.com/api/auth/profile", {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => null),
        ]);

        setLeaderboardScores(scoresRes.data);
        if (profileRes && profileRes.data) {
          setProfile(profileRes.data);
          setEditName(profileRes.data.name);
          setEditImage(profileRes.data.profileImage || "");
        }
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleOpenProfileModal = () => {
    if (profile) {
      setEditName(profile.name);
      setEditImage(profile.profileImage || "");
    }
    setShowProfileModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1048576) {
      toast.error("Image size should not be more than 1 MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setEditImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setEditName("");
      return;
    }
    const strictPattern = /^[A-Za-z]+( [A-Za-z]+)* ?$/;
    if (!strictPattern.test(value)) {
      toast.error("Only letters and single spaces allowed.");
      return;
    }
    setEditName(value);
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    const trimmedName = editName.trim();
    if (trimmedName.length === 0) {
      toast.error("Name cannot be empty.");
      return;
    }

    if (
      trimmedName === profile.name &&
      editImage === (profile.profileImage || "")
    ) {
      toast("No changes made to your profile.", { icon: "ℹ️" });
      setShowProfileModal(false);
      return;
    }

    try {
      setUploadingImage(true);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "https://react-snake-arcade.onrender.com/api/auth/profile",
        { profileImage: editImage, name: trimmedName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProfile(res.data);
      if (res.data.name) {
        localStorage.setItem("username", res.data.name);
      }
      toast.success("Profile updated successfully! ✨");
      setShowProfileModal(false);
    } catch (err) {
      toast.error("Failed to update profile.");
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const topScores = leaderboardScores;

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-white overflow-x-hidden relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-center md:text-left">
          Game Lobby
        </h1>
        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={handleOpenProfileModal}
            className="flex-1 md:flex-none px-6 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/50 rounded-lg font-bold hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
          >
            PROFILE
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex-1 md:flex-none px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer"
          >
            LOGOUT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-800/80 backdrop-blur-xl border border-green-500/30 p-8 rounded-3xl shadow-[0_0_30px_rgba(34,197,94,0.1)] hover:shadow-[0_0_40px_rgba(34,197,94,0.3)] transition-all hover:-translate-y-2 group">
          <div className="text-6xl mb-6">🐍</div>
          <h2 className="text-3xl font-black text-green-400 mb-4 uppercase tracking-wide">
            Classic Snake Eater
          </h2>
          <p className="text-gray-400 mb-8 h-20">
            Survive, eat, and grow! Features live timer, high scores, and
            special bonus foods.
          </p>
          <button
            onClick={() => navigate("/snake-classic")}
            className="w-full py-4 bg-green-500 text-gray-900 font-black text-xl rounded-xl uppercase tracking-wider hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] cursor-pointer"
          >
            Play Now
          </button>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-xl border border-blue-500/30 p-8 rounded-3xl shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all hover:-translate-y-2 group">
          <div className="text-6xl mb-6">🪜</div>
          <h2 className="text-3xl font-black text-blue-400 mb-4 uppercase tracking-wide">
            AI Snake & Ladder
          </h2>
          <p className="text-gray-400 mb-8 h-20">
            The classic board game re-imagined with smart AI twists and neon
            cyberpunk vibes.
          </p>
          <button
            onClick={() => navigate("/snake-ladder")}
            className="w-full py-4 bg-blue-500 text-gray-900 font-black text-xl rounded-xl uppercase tracking-wider hover:bg-blue-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] cursor-pointer"
          >
            Play Now
          </button>
        </div>
      </div>

      <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 p-6 md:p-8 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.15)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🏆</span>
            <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-500 uppercase tracking-widest">
              Categorized Leaderboard
            </h2>
          </div>
          <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("Easy")}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === "Easy" ? "bg-green-500 text-gray-900 shadow-md" : "text-gray-400 hover:text-white cursor-pointer"}`}
            >
              Easy
            </button>
            <button
              onClick={() => setActiveTab("Medium")}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === "Medium" ? "bg-yellow-500 text-gray-900 shadow-md" : "text-gray-400 hover:text-white cursor-pointer"}`}
            >
              Medium
            </button>
            <button
              onClick={() => setActiveTab("Hard")}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === "Hard" ? "bg-red-500 text-white shadow-md" : "text-gray-400 hover:text-white cursor-pointer"}`}
            >
              Hard
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-10 text-purple-400 animate-pulse font-bold">
            Loading...
          </div>
        ) : topScores.length === 0 ? (
          <div className="text-center py-10 text-gray-400 font-bold text-lg">
            No scores yet for {activeTab} mode. Play a game to rank up!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-700 text-gray-400 uppercase text-sm tracking-wider">
                  <th className="p-4 font-black">Rank</th>
                  <th className="p-4 font-black">Player Name</th>
                  <th className="p-4 font-black text-right">Score</th>
                  <th className="p-4 font-black text-right">Time Survived</th>
                </tr>
              </thead>
              <tbody>
                {topScores.map((player, index) => (
                  <tr
                    key={player._id}
                    className="border-b border-gray-800/50 hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4 font-black text-lg">
                      {index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : `#${index + 1}`}
                    </td>
                    <td className="p-4 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        <span className="text-sm font-bold text-gray-400">
                          {player.playerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {player.playerName}
                    </td>
                    <td className="p-4 font-black text-green-400 text-right text-lg">
                      {player.score}
                    </td>
                    <td className="p-4 text-gray-400 text-right font-medium tracking-wide">
                      {player.playTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800/90 border border-blue-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.3)] max-w-md w-full text-center relative animate-[fade-in-up_0.3s_ease-out]">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-light cursor-pointer"
            >
              &times;
            </button>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-8 uppercase tracking-wider">
              Edit Profile
            </h3>

            {/* Clickable Avatar */}
            <div
              className={`relative w-36 h-36 mx-auto ${editImage ? "mb-4" : "mb-8"} group cursor-pointer`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-full h-full rounded-full border-4 border-gray-700 overflow-hidden bg-gray-900 flex items-center justify-center transition-all group-hover:border-blue-500 shadow-xl">
                {editImage ? (
                  <img
                    src={editImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl text-gray-500">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <span className="text-3xl mb-1">📷</span>
                <span className="text-white text-xs font-bold uppercase tracking-wider">
                  Change
                </span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            {editImage && (
              <button
                onClick={() => setEditImage("")}
                className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center justify-center mx-auto mb-6 transition-colors cursor-pointer"
              >
                <span className="mr-2">🗑️</span> Remove Photo
              </button>
            )}

            <div className="space-y-6 text-left mb-8">
              {/* Editable Name Field */}
              <div className="group">
                <label className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 block">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={handleNameChange}
                  className="w-full p-4 bg-gray-900/80 text-white rounded-xl focus:outline-none border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-lg shadow-inner"
                  placeholder="Enter your name"
                />
              </div>

              {/* Disabled Email Field */}
              <div className="opacity-70">
                <label className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 block">
                  Email Address (Read-only)
                </label>
                <div className="w-full p-4 bg-gray-900/50 text-gray-300 rounded-xl border border-gray-700/50 cursor-not-allowed font-medium shadow-inner">
                  {profile.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={uploadingImage}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-lg uppercase tracking-wider rounded-xl hover:from-blue-500 hover:to-cyan-400 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] cursor-pointer hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImage ? "Saving..." : "Update Profile"}
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800/90 border border-red-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.2)] max-w-sm w-full text-center relative animate-[fade-in-up_0.3s_ease-out]">
            <div className="text-5xl mb-4">🚪</div>
            <h3 className="text-2xl font-black text-red-400 mb-2 uppercase tracking-wider">
              Confirm Logout
            </h3>
            <p className="text-gray-300 mb-8">
              Are you sure you want to logout?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition-all cursor-pointer"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Dashboard;
