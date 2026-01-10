"use client";

import React, { useState, useEffect } from "react";

interface FocusTimerProps {
  taskTitle: string;
  initialMinutes: number;
  onClose: () => void;
}

export function FocusTimer({ taskTitle, initialMinutes, onClose }: FocusTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) {
      if (remainingSeconds <= 0 && isRunning) {
        setIsRunning(false);
        setIsCompleted(true);
        // Play notification sound if available
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Focus timer completed!", {
            body: `You've completed your focus session for "${taskTitle}"`,
          });
        }
      }
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, remainingSeconds, taskTitle]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 max-w-sm w-full space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Focus on</h2>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white break-words">{taskTitle}</h1>
        </div>

        {/* Timer Display */}
        <div className="space-y-4">
          {/* Progress ring background */}
          <div className="flex justify-center">
            <div className="relative w-40 h-40">
              {/* Circle background */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200 dark:text-slate-800"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${(progressPercent / 100) * 440} 440`}
                  className="text-blue-600 dark:text-blue-500 transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>
              {/* Time display in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold text-slate-900 dark:text-white font-mono">
                    {formatTime(remainingSeconds)}
                  </div>
                  <div className="text-xs uppercase text-slate-500 dark:text-slate-400 mt-2 font-semibold tracking-wider">
                    {isCompleted ? "Completed" : isRunning ? "Running" : "Paused"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex gap-3 justify-center">
            {!isCompleted ? (
              <>
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isRunning
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isRunning ? "Pause" : "Start"}
                </button>
                <button
                  onClick={() => {
                    setIsRunning(false);
                    setRemainingSeconds(totalSeconds);
                  }}
                  className="px-6 py-3 rounded-lg font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                >
                  Reset
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsRunning(false);
                  setRemainingSeconds(totalSeconds);
                  setIsCompleted(false);
                }}
                className="px-6 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Start Again
              </button>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
