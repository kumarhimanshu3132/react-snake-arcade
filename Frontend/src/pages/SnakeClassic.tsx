import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const GRID_SIZE = 20;
type Point = { x: number; y: number };

const playRetroBeep = (
  freq: number,
  type: OscillatorType = "square",
  duration: number = 0.1,
) => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Web Audio blocked or failed:", e);
  }
};

function SnakeClassic() {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Easy",
  );
  const [baseSpeed, setBaseSpeed] = useState(200);
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
  ]);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [bonusFood, setBonusFood] = useState<Point | null>(null);
  const [bonusValue, setBonusValue] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [foodCount, setFoodCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const [startTime, setStartTime] = useState<number>(0);

  const currentSpeed = Math.max(50, baseSpeed - foodCount * 2);

  useEffect(() => {
    const fetchHighScore = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(
          "https://react-snake-arcade.onrender.com/api/score/all",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const modeFilter = difficulty;
        const scores = res.data.filter((s: any) => s.gameType === modeFilter);
        const best = scores.reduce(
          (max: number, curr: any) => Math.max(max, curr.score),
          0,
        );
        setHighScore(best);
      } catch (err) {
        console.error("Error fetching high score", err);
        setHighScore(0);
      }
    };
    fetchHighScore();
  }, [difficulty]);

  const handleGameOver = useCallback(
    async (finalScore: number) => {
      setGameOver(true);
      toast.error("Game Over!");
      if (finalScore > highScore) {
        setHighScore(finalScore);
      }

      const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
      const formattedPlayTime = `${String(Math.floor(totalSeconds / 3600)).padStart(2, "0")}:${String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
      const pName = localStorage.getItem("username") || "Player";
      const token = localStorage.getItem("token");

      try {
        await axios.post(
          "https://react-snake-arcade.onrender.com/api/score/save",
          {
            playerName: pName,
            score: finalScore,
            playTime: formattedPlayTime,
            gameType: difficulty,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (err) {
        console.error("Failed to auto-save score", err);
      }
    },
    [highScore, difficulty, startTime],
  );

  const getRandomEmptyCoordinate = (currentSnake: Point[]): Point => {
    let newPoint: Point;
    let isCollision = true;
    while (isCollision) {
      newPoint = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      isCollision = currentSnake.some(
        (segment) => segment.x === newPoint.x && segment.y === newPoint.y,
      );
    }
    return newPoint!;
  };

  useEffect(() => {
    if (!bonusFood || !gameStarted || gameOver) return;
    const bonusTimer = setInterval(() => {
      setBonusValue((prevValue) => {
        if (prevValue <= 5) {
          setBonusFood(null);
          return 0;
        }
        return prevValue - 5;
      });
    }, 1000);
    return () => clearInterval(bonusTimer);
  }, [bonusFood, gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, gameStarted, gameOver]);

  const handleMobileControl = (newDir: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
    if (!gameStarted || gameOver) return;
    switch (newDir) {
      case "UP":
        if (direction.y !== 1) setDirection({ x: 0, y: -1 });
        break;
      case "DOWN":
        if (direction.y !== -1) setDirection({ x: 0, y: 1 });
        break;
      case "LEFT":
        if (direction.x !== 1) setDirection({ x: -1, y: 0 });
        break;
      case "RIGHT":
        if (direction.x !== -1) setDirection({ x: 1, y: 0 });
        break;
    }
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const moveTimer = setTimeout(() => {
      let nextX = snake[0].x + direction.x;
      let nextY = snake[0].y + direction.y;
      if (nextX < 0) nextX = GRID_SIZE - 1;
      else if (nextX >= GRID_SIZE) nextX = 0;
      if (nextY < 0) nextY = GRID_SIZE - 1;
      else if (nextY >= GRID_SIZE) nextY = 0;

      const newHead = { x: nextX, y: nextY };
      const hitSelf = snake.some(
        (segment) => segment.x === newHead.x && segment.y === newHead.y,
      );

      if (hitSelf) {
        playRetroBeep(150, "sawtooth", 0.3);
        handleGameOver(score);
        return;
      }

      const newSnake = [newHead, ...snake];
      if (newHead.x === food.x && newHead.y === food.y) {
        playRetroBeep(600, "square", 0.1);
        setScore(score + 5);
        const newCount = foodCount + 1;
        setFoodCount(newCount);
        setFood(getRandomEmptyCoordinate(newSnake));
        if (newCount > 0 && newCount % 5 === 0) {
          setBonusFood(getRandomEmptyCoordinate(newSnake));
          setBonusValue(30);
          playRetroBeep(800, "square", 0.1);
          setTimeout(() => playRetroBeep(1200, "square", 0.15), 100);
        }
      } else if (
        bonusFood &&
        newHead.x === bonusFood.x &&
        newHead.y === bonusFood.y
      ) {
        playRetroBeep(1000, "square", 0.15);
        setScore(score + bonusValue);
        setBonusFood(null);
      } else {
        newSnake.pop();
      }
      setSnake(newSnake);
    }, currentSpeed);
    return () => clearTimeout(moveTimer);
  }, [
    snake,
    direction,
    food,
    bonusFood,
    bonusValue,
    gameStarted,
    gameOver,
    currentSpeed,
    foodCount,
    score,
    handleGameOver,
  ]);

  const handleStartGame = (
    speedPref: number,
    diff: "Easy" | "Medium" | "Hard",
  ) => {
    setDifficulty(diff);
    setBaseSpeed(speedPref);
    setStartTime(Date.now());
    setGameStarted(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10"></div>

      <div className="w-full max-w-[100%] sm:max-w-md md:max-w-[500px] flex gap-4 justify-center items-center mb-6 z-10 min-h-[70px]">
        {gameStarted && (
          <>
            <div className="text-sm md:text-lg font-black text-white bg-gray-900/80 px-4 py-2 rounded-xl border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] backdrop-blur-sm">
              BEST: <span className="text-purple-400">{highScore}</span>
            </div>
            <div className="w-20 text-center text-sm md:text-lg font-black text-yellow-400 bg-gray-900/80 px-4 py-2 rounded-xl border border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.3)] backdrop-blur-sm">
              {bonusFood ? `+${bonusValue}` : ""}
            </div>
            <div className="text-sm md:text-lg font-black text-white bg-gray-900/80 px-4 py-2 rounded-xl border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)] backdrop-blur-sm">
              SCORE: <span className="text-green-400">{score}</span>
            </div>
          </>
        )}
      </div>

      {!gameStarted ? (
        <div className="z-10 w-full max-w-sm bg-gray-900/90 border-4 border-gray-700 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.15)] p-8 backdrop-blur-xl text-center">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-green-400 to-emerald-500 mb-2 uppercase tracking-widest">
            Snake Eater
          </h2>
          <p className="text-gray-400 mb-8 font-medium">
            Select your difficulty
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleStartGame(200, "Easy")}
              className="w-full py-4 bg-gray-800 border border-green-500/50 text-green-400 font-bold text-xl rounded-xl hover:bg-green-500 hover:text-gray-900 transition-all shadow-lg hover:scale-105 cursor-pointer"
            >
              Easy
            </button>
            <button
              onClick={() => handleStartGame(130, "Medium")}
              className="w-full py-4 bg-gray-800 border border-yellow-500/50 text-yellow-400 font-bold text-xl rounded-xl hover:bg-yellow-500 hover:text-gray-900 transition-all shadow-lg hover:scale-105 cursor-pointer"
            >
              Medium
            </button>
            <button
              onClick={() => handleStartGame(80, "Hard")}
              className="w-full py-4 bg-gray-800 border border-red-500/50 text-red-400 font-bold text-xl rounded-xl hover:bg-red-500 hover:text-gray-900 transition-all shadow-lg hover:scale-105 cursor-pointer"
            >
              Hard
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="z-10 w-full max-w-[95vw] sm:max-w-[400px] md:max-w-[500px] aspect-square bg-gray-900/90 border-2 md:border-4 border-gray-700 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.15)] p-1 md:p-3 backdrop-blur-xl mx-auto flex items-center justify-center">
            <div
              className="bg-black/90 rounded-lg relative overflow-hidden w-full h-full aspect-square"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
              }}
            >
              {snake.map((segment, index) => (
                <div
                  key={index}
                  className={`transform scale-75 ${index === 0 ? "bg-green-400 rounded-sm" : "bg-green-600 rounded-md"} shadow-[0_0_10px_rgba(34,197,94,0.5)]`}
                  style={{
                    gridColumnStart: segment.x + 1,
                    gridRowStart: segment.y + 1,
                  }}
                ></div>
              ))}
              <div
                className="bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.9)] transform scale-75"
                style={{
                  gridColumnStart: food.x + 1,
                  gridRowStart: food.y + 1,
                }}
              ></div>
              {bonusFood && (
                <div
                  className="bg-yellow-400 rounded-full animate-bounce shadow-[0_0_20px_rgba(250,204,21,1)] transform scale-90 border-2 border-white"
                  style={{
                    gridColumnStart: bonusFood.x + 1,
                    gridRowStart: bonusFood.y + 1,
                  }}
                ></div>
              )}
            </div>
          </div>

          <div className="z-10 mt-8 grid grid-cols-3 gap-3 w-[280px] sm:hidden mx-auto">
            <div></div>
            <button
              onClick={() => handleMobileControl("UP")}
              className="bg-gray-800/80 p-5 rounded-2xl active:bg-gray-700 flex justify-center items-center border-2 border-gray-600 shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 transition-all text-3xl cursor-pointer"
            >
              ⬆️
            </button>
            <div></div>
            <button
              onClick={() => handleMobileControl("LEFT")}
              className="bg-gray-800/80 p-5 rounded-2xl active:bg-gray-700 flex justify-center items-center border-2 border-gray-600 shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 transition-all text-3xl cursor-pointer"
            >
              ⬅️
            </button>
            <button
              onClick={() => handleMobileControl("DOWN")}
              className="bg-gray-800/80 p-5 rounded-2xl active:bg-gray-700 flex justify-center items-center border-2 border-gray-600 shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 transition-all text-3xl cursor-pointer"
            >
              ⬇️
            </button>
            <button
              onClick={() => handleMobileControl("RIGHT")}
              className="bg-gray-800/80 p-5 rounded-2xl active:bg-gray-700 flex justify-center items-center border-2 border-gray-600 shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 transition-all text-3xl cursor-pointer"
            >
              ➡️
            </button>
          </div>
        </>
      )}
      <div className="z-10 mt-6 flex justify-center w-full">
        <button
          onClick={() => navigate("/dashboard")}
          className="group flex items-center gap-3 px-5 py-2 bg-gray-900/80 border border-cyan-500/50 rounded-xl hover:bg-cyan-900/40 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] backdrop-blur-md cursor-pointer"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all">
            <span className="text-sm">◀</span>
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] font-bold text-cyan-500/70 tracking-widest uppercase group-hover:text-cyan-400 transition-colors">
              Back
            </span>
            <span className="text-base md:text-lg font-black text-cyan-400 tracking-widest uppercase">
              Lobby
            </span>
          </div>
        </button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4 text-center">
          <h2 className="text-5xl md:text-7xl font-black text-red-500 mb-6 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] tracking-widest">
            GAME OVER
          </h2>
          <p className="text-2xl md:text-3xl text-white mb-2 font-bold">
            Final Score: <span className="text-green-400">{score}</span>
          </p>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 font-medium">
            Time Survived:{" "}
            <span className="text-purple-400">{`${String(Math.floor(Math.floor((Date.now() - startTime) / 1000) / 3600)).padStart(2, "0")}:${String(Math.floor((Math.floor((Date.now() - startTime) / 1000) % 3600) / 60)).padStart(2, "0")}:${String(Math.floor((Date.now() - startTime) / 1000) % 60).padStart(2, "0")}`}</span>
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-green-500 text-gray-900 font-black rounded-2xl hover:scale-105 transition-all cursor-pointer"
            >
              Play Again
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-8 py-4 bg-gray-600 text-white font-black rounded-2xl hover:scale-105 transition-all cursor-pointer"
            >
              Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default SnakeClassic;
