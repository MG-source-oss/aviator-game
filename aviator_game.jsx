// Aviator Game with Flying Plane Animation, History, Admin Password, Deposit System, and Firebase-ready Setup
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_PASSWORD = "aviatoradmin"; // secret password for admin

export default function AviatorGame() {
  const [registered, setRegistered] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [balance, setBalance] = useState(10000);
  const [depositAmount, setDepositAmount] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(Math.random() * 199 + 1);
  const [manualCrashPoint, setManualCrashPoint] = useState(0);
  const [adminAccess, setAdminAccess] = useState(false);
  const [running, setRunning] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [wager, setWager] = useState(0);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [earnings, setEarnings] = useState(0);
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
    audioRef.current?.play();
  };

  const handleCashOut = (mult) => {
    setCashedOut(true);
    setRunning(false);
    const win = parseFloat((wager * mult).toFixed(2));
    setBalance((prev) => prev + win);
    setEarnings(win);
    setLeaderboard((prev) => [{ username, wager, cashout: mult, win }, ...prev.slice(0, 4)]);
  };

  const manualCashOut = () => {
    handleCashOut(multiplier);
  };

  const handleAdminAccess = () => {
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setAdminAccess(true);
    } else {
      alert("Wrong admin password");
    }
  };

  if (!registered) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛫 Aviator Game Registration</h1>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '0.5rem' }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1rem' }} />
        <button onClick={() => username.trim() && password.trim() && setRegistered(true)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', border: 'none', borderRadius: '0.5rem', color: 'white' }}>Register & Play</button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: 'linear-gradient(to bottom, #1e3a8a, #111827)', color: 'white', padding: '2rem' }}>
      <audio ref={audioRef} src="/game-start-sound.mp3" preload="auto" />

      <div style={{ maxWidth: '400px', margin: 'auto', backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '1rem', position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence>
          {running && (
            <motion.div
              key="plane"
              initial={{ x: -100 }}
              animate={{ x: 400 }}
              exit={{ x: -100 }}
              transition={{ duration: 3, ease: "linear", repeat: Infinity }}
              style={{ position: 'absolute', top: '1rem', left: 0, fontSize: '2rem' }}
            >
              🛩️
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: '2rem', fontWeight: 'bold', color: '#34d399', textAlign: 'center' }}>{multiplier.toFixed(2)}x</motion.div>

        {crashed && !cashedOut && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: [1.5, 0.9, 1.2, 1] }} transition={{ duration: 0.6 }} style={{ textAlign: 'center', fontSize: '2rem', color: '#ef4444' }}>💥 Boom! Crashed!</motion.div>
        )}

        {cashedOut && !crashed && (
          <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} style={{ color: '#34d399', textAlign: 'center' }}>✅ You won {earnings} Frw at {multiplier.toFixed(2)}x!</motion.p>
        )}

        <p style={{ textAlign: 'center', marginBottom: '1rem' }}>👤 {username} | 💰 {balance} Frw</p>

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input type="number" placeholder="💵 Deposit" onChange={(e) => setDepositAmount(parseFloat(e.target.value))} style={{ flex: 1 }} />
          <button onClick={() => {
            if (!isNaN(depositAmount) && depositAmount > 0) {
              setBalance(prev => prev + depositAmount);
              setDepositAmount(0);
            }
          }} style={{ padding: '0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.5rem' }}>Add Funds</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input type="number" placeholder="Wager" value={wager} onChange={(e) => setWager(parseFloat(e.target.value))} style={{ flex: 1 }} />
          <input type="number" placeholder="Auto cash-out" value={autoCashout} onChange={(e) => setAutoCashout(parseFloat(e.target.value))} style={{ flex: 1 }} />
        </div>

        {adminAccess && <input type="number" placeholder="Crash point (Admin)" value={manualCrashPoint} onChange={(e) => setManualCrashPoint(parseFloat(e.target.value))} style={{ marginBottom: '1rem', width: '100%' }} />}

        {!adminAccess && (
          <div style={{ marginBottom: '1rem' }}>
            <input type="password" placeholder="Admin password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} style={{ marginBottom: '0.5rem', width: '100%' }} />
            <button onClick={handleAdminAccess} style={{ background: '#f97316', width: '100%', padding: '0.5rem' }}>Unlock Admin</button>
          </div>
        )}

        {!running && <button onClick={startGame} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white' }}>Start Game</button>}
        {running && !cashedOut && !crashed && <button onClick={manualCashOut} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', backgroundColor: '#facc15', color: 'black' }}>Cash Out</button>}
      </div>

      {leaderboard.length > 0 && (
        <div style={{ marginTop: '2rem', maxWidth: '400px', marginInline: 'auto' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🏆 Leaderboard</h3>
          <ul>
            {leaderboard.map((entry, idx) => (
              <motion.li key={idx} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{entry.username}</span>
                <span>{entry.cashout}x</span>
                <span>{entry.win} Frw</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: '2rem', maxWidth: '400px', marginInline: 'auto' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>📜 Game History (last 5 min)</h3>
          <ul>
            {history.map((h, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{new Date(h.time).toLocaleTimeString()}</span>
                <span>{h.crash.toFixed(2)}x</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
