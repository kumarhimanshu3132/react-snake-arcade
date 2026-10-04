import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

type Color = 'red' | 'green' | 'blue' | 'yellow';
type GameMode = 'ai' | '2p' | '3p' | '4p';
type Player = { id: number; name: string; position: number; color: Color; isAI: boolean; rollCount: number };

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

const COLOR_STYLES: Record<Color, { bg: string, text: string, border: string, shadow: string, hex: string }> = {
  red: { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', shadow: 'shadow-[0_0_12px_#ef4444]', hex: '#ef4444' },
  green: { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500', shadow: 'shadow-[0_0_12px_#22c55e]', hex: '#22c55e' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500', shadow: 'shadow-[0_0_12px_#3b82f6]', hex: '#3b82f6' },
  yellow: { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500', shadow: 'shadow-[0_0_12px_#eab308]', hex: '#eab308' },
};


const SOUND_URLS = {
  dice: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  snake: 'https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3',
  ladder: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  victory: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'
};

const playSound = (url: string) => {
  const audio = new Audio(url);
  audio.play().catch(e => console.warn('Audio blocked:', e));
};

const BOARD_TEMPLATES = [
  {
    
    snakes: { 98: 13, 95: 37, 92: 51, 83: 22, 69: 31, 65: 3, 64: 24, 59: 18, 52: 11, 48: 9, 46: 15, 44: 22 },
    ladders: { 8: 26, 19: 38, 21: 82, 28: 53, 36: 57, 43: 77, 50: 91, 54: 88, 62: 96, 80: 97 }
  },
  {
    
    snakes: { 99: 11, 89: 53, 76: 58, 66: 45, 53: 31, 42: 18, 39: 4, 27: 6 },
    ladders: { 3: 24, 12: 45, 33: 49, 42: 63, 46: 67, 59: 78, 62: 77, 74: 92 }
  },
  {
    
    snakes: { 97: 78, 95: 70, 87: 19, 62: 23, 57: 40, 52: 14, 17: 7},
    ladders: { 3: 21, 8: 30, 28: 76, 58: 77, 75: 86, 71: 91 } 
  },
  {
    
    snakes: { 97: 55, 93: 53, 86: 35, 70: 31, 57: 20, 37: 6, 33: 11 },
    ladders: { 7: 44, 34: 65, 43: 77, 48: 71, 62: 82,  74: 92 }
  },
  {
    
    snakes: { 98: 48, 96: 17, 93: 43, 82: 61, 73: 51, 62: 40, 55: 11, 44: 14, 38: 20, 29: 7 },
    ladders: { 3: 21, 4: 36, 15: 48, 30: 75, 31: 70, 49: 90, 60: 79, 63: 97, 72: 91, 84: 95}
  }
];

const SnakeLadder: React.FC = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'colorSelect' | 'playing'>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('2p');

  const [players, setPlayers] = useState<Player[]>([]);
  const [turnIndex, setTurnIndex] = useState<number>(0);

  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("Select a game mode to start!");
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const [snakes, setSnakes] = useState<Record<number, number>>({});
  const [ladders, setLadders] = useState<Record<number, number>>({});

  const generateRandomBoard = () => {
    const template = BOARD_TEMPLATES[Math.floor(Math.random() * BOARD_TEMPLATES.length)];
    setSnakes(template.snakes);
    setLadders(template.ladders);
  };

  useEffect(() => {
    generateRandomBoard();
  }, []);

  
  const getGridCells = () => {
    const cells = [];
    for (let row = 9; row >= 0; row--) {
      const isEvenRow = row % 2 === 0;
      for (let col = 0; col < 10; col++) {
        const num = row * 10 + (isEvenRow ? col + 1 : 10 - col);
        cells.push(num);
      }
    }
    return cells;
  };

  const cells = getGridCells();

  const getCoordinates = (cell: number) => {
    if (cell === 0) return { x: '5%', y: '95%' };
    const row = 9 - Math.floor((cell - 1) / 10);
    const isEvenRow = Math.floor((cell - 1) / 10) % 2 === 0;
    const col = isEvenRow ? (cell - 1) % 10 : 9 - ((cell - 1) % 10);
    return {
      x: `${col * 10 + 5}%`,
      y: `${row * 10 + 5}%`
    };
  };

  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'ai') {
      setGameState('colorSelect');
    } else {
      initializePlayers(mode);
    }
  };

  const initializePlayers = (mode: GameMode, p1Color?: Color) => {
    let numPlayers = mode === 'ai' ? 2 : parseInt(mode.charAt(0));

    let availableColors = [...COLORS];
    let newPlayers: Player[] = [];

    if (mode === 'ai') {
      const p1C = p1Color || 'red';
      availableColors = availableColors.filter(c => c !== p1C);
      const aiColor = availableColors[0];

      newPlayers.push({ id: 1, name: 'Player 1', position: 0, color: p1C, isAI: false, rollCount: 0 });
      newPlayers.push({ id: 2, name: 'AI', position: 0, color: aiColor, isAI: true, rollCount: 0 });
    } else {
      for (let i = 0; i < numPlayers; i++) {
        newPlayers.push({ id: i + 1, name: `Player ${i + 1}`, position: 0, color: COLORS[i], isAI: false, rollCount: 0 });
      }
    }

    setPlayers(newPlayers);
    setTurnIndex(0);
    setDiceValue(null);
    setIsRolling(false);
    generateRandomBoard();
    setMessage(`Game started! ${newPlayers[0].name}'s turn.`);
    setGameState('playing');
  };

  const rollDice = async () => {
    if (isRolling || players.some(p => p.position === 100)) return;

    setIsRolling(true);
    playSound(SOUND_URLS.dice);
    
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(roll);

    const currentPlayer = players[turnIndex];
    let nextPosition = currentPlayer.position + roll;

    let updatedPlayers = [...players];
    updatedPlayers[turnIndex].rollCount += 1;

    
    if (nextPosition > 100) {
      setMessage(`${currentPlayer.name} rolled a ${roll}. Need exact number to win!`);
      setPlayers(updatedPlayers);
      setTimeout(() => {
        setIsRolling(false);
        setTurnIndex((turnIndex + 1) % players.length);
      }, 800);
      return;
    }

    let newMessage = `${currentPlayer.name} rolled a ${roll}. Moved to ${nextPosition}.`;

    if (snakes[nextPosition]) {
      newMessage += ` Snake bite! Dropped to ${snakes[nextPosition]}.`;
      nextPosition = snakes[nextPosition];
      playSound(SOUND_URLS.snake);
    } else if (ladders[nextPosition]) {
      newMessage += ` Ladder! Climbed to ${ladders[nextPosition]}.`;
      nextPosition = ladders[nextPosition];
      playSound(SOUND_URLS.ladder);
    }

    updatedPlayers[turnIndex].position = nextPosition;
    setPlayers(updatedPlayers);
    setMessage(newMessage);

    if (nextPosition === 100) {
      playSound(SOUND_URLS.victory);
      if (gameMode === 'ai') {
        if (currentPlayer.isAI) {
          newMessage = 'Game Over! You lost the game. 💀';
        } else {
          newMessage = 'Congratulations! You won the game! 🏆';
        }
      } else {
        newMessage = `Congratulations! ${currentPlayer.name} won the game! 🏆`;
      }
      setMessage(newMessage);

      if (!currentPlayer.isAI) {
        const finalScore = 1000 - (currentPlayer.rollCount * 10);
        const playerName = localStorage.getItem('username') || localStorage.getItem('playerName') || currentPlayer.name;
        try {
          const token = localStorage.getItem('token');
          await axios.post('http://localhost:5000/api/score/save', {
            playerName: playerName,
            score: finalScore,
            playTime: "00:00:00",
            gameType: gameMode === 'ai' ? "AI Snake & Ladder" : "Multiplayer Snake & Ladder"
          }, { headers: { Authorization: `Bearer ${token}` } });
          setTimeout(() => toast.success('You Win! Score saved.'), 100);
        } catch (err) {
          console.error("Error saving score", err);
        }
      }
      setIsRolling(false);
    } else {
      setTimeout(() => {
        setTurnIndex((turnIndex + 1) % players.length);
        setIsRolling(false);
      }, 800);
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && players.length > 0 && !isRolling && !players.some(p => p.position === 100)) {
      if (players[turnIndex].isAI) {
        const timer = setTimeout(() => {
          rollDice();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [turnIndex, gameState, players, isRolling]);

  const resetGame = () => {
    setGameState('menu');
    setPlayers([]);
    setDiceValue(null);
    setTurnIndex(0);
    setIsRolling(false);
    setMessage("Select a game mode to start!");
  };

  const renderPlayerPanel = (player: Player, index: number, layout: 'vertical' | 'horizontal' = 'vertical') => {
    const isMyTurn = turnIndex === index;
    const colorStyle = COLOR_STYLES[player.color];

    if (layout === 'horizontal') {
      return (
        <div key={player.id} className={`w-full max-w-[400px] bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-xl border transition-all duration-300 flex items-center justify-between gap-4 ${isMyTurn ? `${colorStyle.border} ${colorStyle.shadow} scale-[1.02]` : 'border-gray-800 shadow-none scale-100 opacity-60'}`}>
          <div className="flex flex-col items-start min-w-[60px]">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`w-2 h-2 rounded-full ${colorStyle.bg} ${colorStyle.shadow}`}></span>
              <h2 className={`text-xs font-black uppercase tracking-widest ${colorStyle.text} whitespace-nowrap`}>
                {player.name}
              </h2>
            </div>
            <span className={`text-[9px] font-bold uppercase ${isMyTurn ? `${colorStyle.text} animate-pulse` : 'text-gray-500'}`}>
              {isMyTurn ? 'Turn' : 'Wait'}
            </span>
          </div>

          <div className={`flex items-center gap-3 bg-black/50 rounded-lg px-3 py-1 border ${colorStyle.border} border-opacity-40`}>
            <span className={`${colorStyle.text} opacity-70 uppercase text-[9px] font-bold tracking-wider`}>Pos</span>
            <span className={`text-lg font-mono font-black ${colorStyle.text}`}>
              {player.position === 0 ? '00' : player.position.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest hidden sm:block">Dice</span>
            {isMyTurn && diceValue !== null ? (
              <div key={`dice-${Math.random()}`} className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg font-black text-black shadow-[0_0_10px_rgba(255,255,255,0.8)] ${isRolling ? 'animate-spin' : 'animate-[bounce_0.5s_ease-out]'}`}>
                {diceValue}
              </div>
            ) : (
              <div className="w-8 h-8 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600 font-mono text-lg bg-gray-900/50">
                ?
              </div>
            )}
          </div>

          <button
            onClick={rollDice}
            disabled={players.some(p => p.position === 100) || !isMyTurn || isRolling || player.isAI}
            className={`py-1.5 px-3 font-black uppercase tracking-widest rounded-lg transition-all duration-200 text-[9px] border whitespace-nowrap
              ${player.isAI && isMyTurn
                ? 'bg-gray-800 border-gray-600 text-gray-400 animate-pulse cursor-wait'
                : isMyTurn && !isRolling && !players.some(p => p.position === 100)
                  ? `${colorStyle.bg} bg-opacity-20 ${colorStyle.border} text-white hover:${colorStyle.bg} hover:text-black hover:${colorStyle.shadow} active:scale-95`
                  : 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
              }
            `}
          >
            {player.isAI && isMyTurn ? 'AI...' : 'Roll'}
          </button>
        </div>
      );
    }

    
    return (
      <div key={player.id} className={`w-[140px] sm:w-[160px] bg-gray-900/90 backdrop-blur-sm p-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-between ${isMyTurn ? `${colorStyle.border} ${colorStyle.shadow} scale-[1.02]` : 'border-gray-800 shadow-none scale-100 opacity-60'}`}>
        <div className="w-full flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${colorStyle.bg} ${colorStyle.shadow}`}></span>
            <h2 className={`text-xs font-black uppercase tracking-widest ${colorStyle.text} truncate max-w-[70px]`}>
              {player.name}
            </h2>
          </div>
          <span className={`text-[9px] font-bold uppercase ${isMyTurn ? `${colorStyle.text} animate-pulse` : 'text-gray-500'}`}>
            {isMyTurn ? 'Turn' : 'Wait'}
          </span>
        </div>

        <div className="w-full flex gap-2">
          <div className={`flex-1 bg-black/50 rounded-lg p-1.5 border ${colorStyle.border} border-opacity-40 flex flex-col items-center justify-center`}>
            <span className={`${colorStyle.text} opacity-70 uppercase text-[9px] font-bold tracking-wider mb-0.5`}>Pos</span>
            <span className={`text-lg font-mono font-black ${colorStyle.text}`}>
              {player.position === 0 ? '00' : player.position.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-widest">Dice</span>
            {isMyTurn && diceValue !== null ? (
              <div key={`dice-${Math.random()}`} className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg font-black text-black shadow-[0_0_10px_rgba(255,255,255,0.8)] ${isRolling ? 'animate-spin' : 'animate-[bounce_0.5s_ease-out]'}`}>
                {diceValue}
              </div>
            ) : (
              <div className="w-8 h-8 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600 font-mono text-lg bg-gray-900/50">
                ?
              </div>
            )}
          </div>
        </div>

        <button
          onClick={rollDice}
          disabled={players.some(p => p.position === 100) || !isMyTurn || isRolling || player.isAI}
          className={`w-full mt-2 py-1.5 px-2 font-black uppercase tracking-widest rounded-lg transition-all duration-200 text-[10px] border
            ${player.isAI && isMyTurn
              ? 'bg-gray-800 border-gray-600 text-gray-400 animate-pulse cursor-wait'
              : isMyTurn && !isRolling && !players.some(p => p.position === 100)
                ? `${colorStyle.bg} bg-opacity-20 ${colorStyle.border} text-white hover:${colorStyle.bg} hover:text-black hover:${colorStyle.shadow} active:scale-95`
                : 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
            }
          `}
        >
          {player.isAI && isMyTurn ? 'AI Rolling...' : 'Roll Dice'}
        </button>
      </div>
    );
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gray-950 text-cyan-400 font-sans flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-950 to-black"></div>
        <div className="z-10 bg-gray-900/90 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.2)] max-w-sm w-full flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-4xl font-black mb-6 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-green-400 to-blue-500 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] uppercase">
            Neon Ladder
          </h1>
          <p className="text-sm text-indigo-200/80 mb-6 font-mono">Select Protocol</p>
          <div className="flex flex-col gap-3 w-full">
            <button onClick={() => handleStartGame('ai')} className="py-3 px-6 bg-indigo-900/40 border border-indigo-400 text-indigo-400 hover:bg-indigo-400 hover:text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]">Play vs AI</button>
            <button onClick={() => handleStartGame('2p')} className="py-3 px-6 bg-cyan-900/40 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]">2 Players</button>
            <button onClick={() => handleStartGame('3p')} className="py-3 px-6 bg-green-900/40 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]">3 Players</button>
            <button onClick={() => handleStartGame('4p')} className="py-3 px-6 bg-yellow-900/40 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)]">4 Players</button>
            <button onClick={() => navigate('/dashboard')} className="mt-3 py-2 px-6 text-gray-400 hover:text-white uppercase text-[10px] tracking-widest border border-gray-700 rounded-xl hover:bg-gray-800 transition-all">Back to Lobby</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'colorSelect') {
    return (
      <div className="min-h-screen bg-gray-950 text-cyan-400 font-sans flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-950 to-black"></div>
        <div className="z-10 bg-gray-900/90 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.2)] max-w-md w-full flex flex-col items-center text-center">
          <h2 className="text-xl sm:text-2xl font-black mb-6 uppercase text-indigo-400">Choose Your Color</h2>
          <div className="flex gap-4 sm:gap-6 mb-8">
            {COLORS.map(c => (
              <div key={c} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => initializePlayers('ai', c)}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 transition-all transform hover:scale-110 ${COLOR_STYLES[c].bg} ${COLOR_STYLES[c].border} ${COLOR_STYLES[c].shadow}`}
                ></button>
                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${COLOR_STYLES[c].text}`}>
                  {c}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => setGameState('menu')} className="py-2 px-6 text-gray-400 hover:text-white uppercase text-xs tracking-widest border border-gray-700 rounded-xl hover:bg-gray-800 transition-all">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-950 text-cyan-400 font-sans flex flex-col items-center justify-center p-2 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-950 to-black"></div>

      <div className="w-full h-full max-w-7xl mx-auto flex flex-col gap-2 justify-center z-10 max-h-[95vh]">

        
        <div className="w-full bg-gray-900/90 backdrop-blur-sm p-2 sm:p-3 rounded-xl border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] flex justify-between items-center gap-3 shrink-0">
          <div className="text-[10px] sm:text-xs font-mono text-indigo-300 flex-1 px-2 truncate">
            {message}
          </div>
          <div className="flex gap-2">
            <button onClick={resetGame} className="py-1 px-3 bg-gray-900 border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-800 font-bold uppercase text-[9px] rounded transition-all">
              Menu
            </button>
            <button onClick={() => initializePlayers(gameMode, players[0]?.color)} className="py-1 px-3 bg-gray-900 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-950/50 font-bold uppercase text-[9px] rounded transition-all">
              Restart
            </button>
          </div>
        </div>

        
        <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-auto custom-scrollbar">
          <div className="grid grid-cols-[auto_auto_auto] grid-rows-[auto_auto_auto] gap-3 sm:gap-6 items-center justify-items-center">

            
            <div className="col-start-2 row-start-1 flex justify-center">
              {players.length === 2 && (
                <div className={gameMode === 'ai' ? '' : 'rotate-180 transform'}>
                  {renderPlayerPanel(players[1], 1, 'horizontal')}
                </div>
              )}
              {players.length >= 3 && (
                <div className="rotate-180 transform">
                  {renderPlayerPanel(players[2], 2, 'horizontal')}
                </div>
              )}
            </div>

            
            <div className="col-start-1 row-start-2 flex items-center justify-end">
              {players.length === 4 && (
                <div className="w-[80px] sm:w-[90px] h-[340px] sm:h-[400px] flex items-center justify-center">
                  <div className="rotate-90 transform w-[340px] sm:w-[400px]">
                    {renderPlayerPanel(players[3], 3, 'horizontal')}
                  </div>
                </div>
              )}
            </div>

            
            <div className="col-start-2 row-start-2 flex flex-col items-center justify-center shrink-0">
              <div className="bg-gray-900/90 backdrop-blur-sm p-3 rounded-xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)] flex flex-col items-center">
                <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] mx-auto">
                  <div
                    className="absolute inset-0 gap-1 bg-gray-950 p-1.5 sm:p-2 rounded-lg border border-gray-700 shadow-inner z-0"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', gridTemplateRows: 'repeat(10, minmax(0, 1fr))' }}
                  >
                    {cells.map(cell => {
                      return (
                        <div
                          key={cell}
                          className="relative flex items-center justify-center text-gray-200 text-[10px] sm:text-xs font-bold opacity-60 rounded-sm border border-gray-800 bg-gray-900/80"
                        >
                          <span className="select-none pointer-events-none">{cell}</span>
                        </div>
                      );
                    })}
                  </div>

                  
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ padding: '0.375rem' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                    {Object.entries(snakes).map(([head, tail]) => {
                      const hCoords = getCoordinates(Number(head));
                      const tCoords = getCoordinates(Number(tail));
                      const hx = parseFloat(hCoords.x);
                      const hy = parseFloat(hCoords.y);
                      const tx = parseFloat(tCoords.x);
                      const ty = parseFloat(tCoords.y);

                      const dx = tx - hx;
                      const dy = ty - hy;

                      const control1X = hx + dx * 0.3 - dy * 0.2;
                      const control1Y = hy + dy * 0.3 + dx * 0.2;
                      const control2X = hx + dx * 0.7 + dy * 0.2;
                      const control2Y = hy + dy * 0.7 - dx * 0.2;

                      const headAngle = Math.atan2(control1Y - hy, control1X - hx) * (180 / Math.PI) + 90;

                      return (
                        <g key={`snake-${head}`} className="filter drop-shadow-[0_0_4px_rgba(244,63,94,0.8)]">
                          
                          <path
                            d={`M ${hx} ${hy} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${tx} ${ty}`}
                            fill="none"
                            stroke="rgba(244,63,94,0.8)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          
                          <path
                            d={`M ${hx} ${hy} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${tx} ${ty}`}
                            fill="none"
                            stroke="rgba(255,150,150,0.6)"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                          />
                          
                          <g transform={`translate(${hx}, ${hy}) rotate(${headAngle})`}>
                            
                            <path
                              d="M 0 -3.6 C 1.8 -3.6, 3 -1.2, 3 1.8 Q 0 3, -3 1.8 C -3 -1.2, -1.8 -3.6, 0 -3.6 Z"
                              fill="rgba(244,63,94,1)"
                              stroke="rgba(255,150,150,0.9)"
                              strokeWidth="0.5"
                              strokeLinejoin="round"
                            />
                            
                            <circle cx="-1.2" cy="-0.6" r="0.6" fill="#000" />
                            <circle cx="-1.2" cy="-0.6" r="0.2" fill="#fff" />
                            
                            <circle cx="1.2" cy="-0.6" r="0.6" fill="#000" />
                            <circle cx="1.2" cy="-0.6" r="0.2" fill="#fff" />
                          </g>
                        </g>
                      );
                    })}
                    {Object.entries(ladders).map(([bottom, top]) => {
                      const bCoords = getCoordinates(Number(bottom));
                      const tCoords = getCoordinates(Number(top));
                      const bx = parseFloat(bCoords.x);
                      const by = parseFloat(bCoords.y);
                      const tx = parseFloat(tCoords.x);
                      const ty = parseFloat(tCoords.y);

                      const dx = tx - bx;
                      const dy = ty - by;
                      const length = Math.sqrt(dx * dx + dy * dy);
                      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                      return (
                        <g key={`ladder-${bottom}`} transform={`translate(${bx}, ${by}) rotate(${angle})`} className="filter drop-shadow-[0_0_4px_rgba(52,211,153,0.8)]">
                          
                          <line x1="0" y1="-1.5" x2={length} y2="-1.5" stroke="rgba(52,211,153,0.9)" strokeWidth="0.6" strokeLinecap="round" />
                          
                          <line x1="0" y1="1.5" x2={length} y2="1.5" stroke="rgba(52,211,153,0.9)" strokeWidth="0.6" strokeLinecap="round" />
                          
                          <line x1="0" y1="0" x2={length} y2="0" stroke="rgba(52,211,153,0.7)" strokeWidth="3.2" strokeDasharray="0.5 3" />
                        </g>
                      );
                    })}
                  </svg>

                  
                  <div className="absolute inset-0 pointer-events-none z-20" style={{ padding: '0.375rem' }}>
                    {players.filter(p => p.position > 0).map((player) => {
                      const coords = getCoordinates(player.position);
                      const colorStyle = COLOR_STYLES[player.color];
                      const playersOnSameCell = players.filter(p => p.position === player.position);
                      const pIndex = playersOnSameCell.findIndex(p => p.id === player.id);
                      const offset = playersOnSameCell.length > 1 ? (pIndex - (playersOnSameCell.length - 1) / 2) * 5 : 0;

                      return (
                        <div
                          key={player.id}
                          className={`absolute w-3.5 h-3.5 sm:w-5 sm:h-5 ${colorStyle.bg} rounded-full ${colorStyle.shadow} transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out border-2 border-black flex items-center justify-center z-30`}
                          style={{
                            left: `calc(${coords.x} + ${offset}px)`,
                            top: `calc(${coords.y} + ${offset}px)`,
                            zIndex: 30 + pIndex
                          }}
                        >
                          <span className="text-[7px] sm:text-[9px] font-black text-black leading-none">{player.isAI ? 'A' : player.id}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            
            <div className="col-start-3 row-start-2 flex items-center justify-start">
              {players.length >= 3 && (
                <div className="w-[80px] sm:w-[90px] h-[340px] sm:h-[400px] flex items-center justify-center">
                  <div className="-rotate-90 transform w-[340px] sm:w-[400px]">
                    {renderPlayerPanel(players[1], 1, 'horizontal')}
                  </div>
                </div>
              )}
            </div>

            
            <div className="col-start-2 row-start-3 flex justify-center">
              {players.length >= 1 && (
                <div>
                  {renderPlayerPanel(players[0], 0, 'horizontal')}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeLadder;


