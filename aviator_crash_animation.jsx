import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const ADMIN_PASSWORD = "aviatoradmin";

export default function AviatorGame() {
  const [registered, setRegistered] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [balance, setBalance] = useState(10000);
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(Math.random() * 19 + 1);
  const [manualCrashPoint, setManualCrashPoint] = useState(0);
  const [adminAccess, setAdminAccess] = useState(false);
  const [running, setRunning] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [wager, setWager] = useState(0);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [earnings, setEarnings] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [cashouts, setCashouts] = useState(0);
  const [leaderboard, setLeaderboard] = useState(() => {
    const stored = localStorage.getItem("aviator_leaderboard");
    return stored ? JSON.parse(stored) : [];
  });
  const [history, setHistory] = useState(() => {
    const stored = localStorage.getItem("aviator_history");
    return stored ? JSON.parse(stored) : [];
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const audioRef = useRef(null);
  const crashAudioRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("aviator_leaderboard", JSON.stringify(leaderboard));
  }, [leaderboard]);

  useEffect(() => {
    localStorage.setItem("aviator_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    let interval;
    if (running && !crashed && !cashedOut) {
      interval = setInterval(() => {
        setMultiplier((prev) => {
          const next = parseFloat((prev + 0.1).toFixed(2));
          if (next >= crashPoint) {
            clearInterval(interval);
            setCrashed(true);
            logHistory(crashPoint);
            crashAudioRef.current?.play();
            setTimeout(() => {
              startGame();
            }, 3000);
          }
          if (next >= autoCashout) {
            handleCashOut(next);
            clearInterval(interval);
          }
          return next;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [running, crashPoint, crashed, cashedOut, autoCashout]);

  const logHistory = (crash) => {
    const entry = { crash, time: Date.now() };
    const updated = [entry, ...history.filter(h => Date.now() - h.time < 5 * 60 * 1000)].slice(0, 20);
    setHistory(updated);
  };

  const startGame = () => {
    if (wager <= 0 || wager > balance) return alert("Invalid wager or not enough balance.");
    setBalance((prev) => prev - wager);
    setMultiplier(1.0);
    const finalCrashPoint = adminAccess && manualCrashPoint > 1 ? manualCrashPoint : Math.random() * 19 + 1;
    setCrashPoint(finalCrashPoint);
    setRunning(true);
    setCashedOut(false);
    setCrashed(false);
    setEarnings(0);
    setRoundsPlayed(prev => prev + 1);
    audioRef.current?.play();
  };

  const handleCashOut = (mult) => {
    setCashedOut(true);
    setRunning(false);
    const win = parseFloat((wager * mult).toFixed(2));
    setBalance((prev) => prev + win);
    setEarnings(win);
    setCashouts(prev => prev + 1);
    setLeaderboard((prev) => [{ username, wager, cashout: mult, win }, ...prev.slice(0, 4)]);
  };

  const manualCashOut = () => {
    handleCashOut(multiplier);
  };

  const handleAdminAccess = () => {
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setAdminAccess(true);
      alert("Admin access granted");
    } else {
      alert("Wrong admin password");
    }
  };

  if (!registered) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛫 Aviator Game Registration</h1>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={() => username && password && setRegistered(true)}>Register & Play</button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: 'linear-gradient(to bottom, #1e3a8a, #111827)', color: 'white', padding: '2rem' }}>
      <audio ref={audioRef} src="/game-start-sound.mp3" preload="auto" />
      <audio ref={crashAudioRef} src="/crash.mp3" preload="auto" />

      <div style={{ maxWidth: '400px', margin: 'auto', backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '1rem' }}>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: '2rem', fontWeight: 'bold', color: '#34d399', textAlign: 'center' }}>{multiplier.toFixed(2)}x</motion.div>

        <div style={{ position: "relative", height: "80px", marginBottom: "1rem" }}>
          <motion.img
            src="Screenshot 2025-06-27 055411"
            alt="Player"
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={
              crashed
                ? { y: 100, rotate: 720, opacity: 0 }
                : cashedOut
                ? { x: 300, scale: 1.4 }
                : running
                ? { x: multiplier * 20 }
                : { x: 0 }
            }
            transition={{ type: "spring", stiffness: 60, damping: 10, duration: crashed ? 0.8 : 1 }}
            style={{ width: "40px", height: "40px", position: "absolute", top: 0, left: 0 }}
          />
        </div>

        <p style={{ textAlign: 'center' }}>👤 {username} | 💰 {balance.toFixed(2)} Frw</p>
        <p style={{ textAlign: 'center', fontSize: '0.9rem', marginBottom: '1rem' }}>🎮 Rounds: {roundsPlayed} | 💵 Cashouts: {cashouts}</p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input type="number" placeholder="Wager" value={wager} onChange={(e) => setWager(parseFloat(e.target.value))} min={0} step="0.01" />
          <input type="number" placeholder="Auto cash-out" value={autoCashout} onChange={(e) => setAutoCashout(parseFloat(e.target.value))} min={1} step="0.01" />
        </div>

        {adminAccess && (
          <input type="number" placeholder="Crash point (Admin)" value={manualCrashPoint} onChange={(e) => setManualCrashPoint(parseFloat(e.target.value))} />
        )}

        {!adminAccess && (
          <>
            <input type="password" placeholder="Admin password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} />
            <button onClick={handleAdminAccess}>Unlock Admin</button>
          </>
        )}

        {crashed && !cashedOut && <p style={{ color: '#f87171', textAlign: 'center' }}>💥 Crashed at {crashPoint.toFixed(2)}x!</p>}
        {cashedOut && !crashed && <p style={{ color: '#34d399', textAlign: 'center' }}>✅ Won {earnings} Frw at {multiplier.toFixed(2)}x</p>}

        {!running && <button onClick={startGame}>Start Game</button>}
        {running && !cashedOut && !crashed && <button onClick={manualCashOut}>Cash Out</button>}
      </div>
    </div>
  );
}
