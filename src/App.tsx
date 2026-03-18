import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Music, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Gamepad2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };

// --- Tracks ---
const TRACKS = [
  { id: 1, name: "Cyberpunk Pulse", artist: "Neon Rider", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, name: "Synthwave Dreams", artist: "Retro Wave", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, name: "Digital Horizon", artist: "Pixel Master", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  // --- Audio State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Refs ---
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Check if food is on snake
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        setIsPaused(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
        // Increase speed slightly
        setSpeed(s => Math.max(s - 2, 50));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, generateFood, isGameOver, isPaused]);

  // --- Game Loop ---
  useEffect(() => {
    if (!isPaused && !isGameOver) {
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, isPaused, isGameOver, speed]);

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  // --- High Score ---
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  // --- Audio Handlers ---
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlayingMusic) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlayingMusic(!isPlayingMusic);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlayingMusic(true);
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setSpeed(INITIAL_SNAKE.length > 0 ? INITIAL_SPEED : INITIAL_SPEED); // Just to trigger effect
    setFood(generateFood(INITIAL_SNAKE));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-950 overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/20 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-10 text-center mb-8"
      >
        <h1 className="text-6xl font-black tracking-tighter italic neon-text-blue mb-2 uppercase">
          Snake <span className="text-neon-pink">&</span> Beats
        </h1>
        <p className="text-zinc-400 font-mono text-xs tracking-widest uppercase">
          Neon Arcade Experience
        </p>
      </motion.div>

      <div className="z-10 flex flex-col lg:flex-row gap-8 items-start">
        {/* Game Board Container */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
            {/* Game Stats */}
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Score</span>
                  <span className="text-2xl font-mono neon-text-green">{score.toString().padStart(4, '0')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Best</span>
                  <span className="text-2xl font-mono text-zinc-300">{highScore.toString().padStart(4, '0')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {isPaused ? <Play size={20} className="text-neon-green" /> : <Pause size={20} className="text-neon-pink" />}
                </button>
                <button 
                  onClick={resetGame}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RotateCcw size={20} className="text-neon-blue" />
                </button>
              </div>
            </div>

            {/* Grid */}
            <div 
              className="grid gap-0.5 bg-zinc-950 border border-white/5 p-1 rounded-lg"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                width: 'min(80vw, 400px)',
                height: 'min(80vw, 400px)'
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isSnake = snake.some(s => s.x === x && s.y === y);
                const isHead = snake[0].x === x && snake[0].y === y;
                const isFood = food.x === x && food.y === y;

                return (
                  <div 
                    key={i}
                    className={`
                      rounded-[2px] transition-all duration-150
                      ${isHead ? 'bg-neon-blue shadow-[0_0_10px_#00FFFF]' : 
                        isSnake ? 'bg-neon-blue/40' : 
                        isFood ? 'bg-neon-pink animate-pulse shadow-[0_0_15px_#FF00FF]' : 
                        'bg-white/[0.02]'}
                    `}
                  />
                );
              })}
            </div>

            {/* Game Over Overlay */}
            <AnimatePresence>
              {isGameOver && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm rounded-xl"
                >
                  <Trophy size={64} className="text-neon-pink mb-4" />
                  <h2 className="text-4xl font-black italic neon-text-pink mb-2 uppercase">Game Over</h2>
                  <p className="text-zinc-400 mb-6">Final Score: {score}</p>
                  <button 
                    onClick={resetGame}
                    className="px-8 py-3 bg-neon-blue text-zinc-950 font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_#00FFFF]"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pause Overlay */}
            <AnimatePresence>
              {isPaused && !isGameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-[2px] rounded-xl pointer-events-none"
                >
                  <div className="bg-zinc-900/90 border border-white/10 p-6 rounded-2xl flex flex-col items-center pointer-events-auto">
                    <Gamepad2 size={48} className="text-neon-green mb-4 animate-bounce" />
                    <h2 className="text-2xl font-black italic neon-text-green mb-4 uppercase tracking-tighter">Paused</h2>
                    <button 
                      onClick={() => setIsPaused(false)}
                      className="px-6 py-2 bg-white text-zinc-950 font-bold uppercase text-sm rounded-full hover:bg-neon-green transition-colors"
                    >
                      Resume
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar / Music Player */}
        <div className="flex flex-col gap-6 w-full lg:w-80">
          {/* Music Player Card */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Music size={18} className="text-neon-purple" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Music Player</span>
              </div>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 rounded-2xl flex items-center justify-center mb-4 border border-white/5 relative overflow-hidden group">
                <motion.div 
                  animate={isPlayingMusic ? { rotate: 360 } : {}}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--color-neon-purple)_0%,_transparent_70%)]"
                />
                <Music size={48} className={`transition-all duration-500 ${isPlayingMusic ? 'text-neon-purple scale-110' : 'text-zinc-700'}`} />
              </div>
              <h3 className="text-lg font-black tracking-tight text-white truncate w-full">
                {TRACKS[currentTrackIndex].name}
              </h3>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                {TRACKS[currentTrackIndex].artist}
              </p>
            </div>

            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={() => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length)}
                className="text-zinc-500 hover:text-neon-blue transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={toggleMusic}
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-zinc-950 hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              >
                {isPlayingMusic ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
              <button 
                onClick={nextTrack}
                className="text-zinc-500 hover:text-neon-blue transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <audio 
              ref={audioRef}
              src={TRACKS[currentTrackIndex].url}
              muted={isMuted}
              onEnded={nextTrack}
              autoPlay={isPlayingMusic}
            />
          </div>

          {/* Controls Help */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-4">Controls</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/10">
                  <ChevronUp size={14} className="text-zinc-400" />
                </div>
                <span className="text-[10px] text-zinc-500 uppercase font-mono">Move Up</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/10">
                  <span className="text-[10px] text-zinc-400 font-bold">SPC</span>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase font-mono">Pause</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/10">
                  <ChevronLeft size={14} className="text-zinc-400" />
                </div>
                <span className="text-[10px] text-zinc-500 uppercase font-mono">Move Left</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/10">
                  <ChevronRight size={14} className="text-zinc-400" />
                </div>
                <span className="text-[10px] text-zinc-500 uppercase font-mono">Move Right</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-zinc-600 font-mono text-[10px] tracking-widest uppercase flex items-center gap-4">
        <span>v1.0.4</span>
        <span className="w-1 h-1 bg-zinc-800 rounded-full" />
        <span>Built for Neon Nights</span>
      </div>
    </div>
  );
}
