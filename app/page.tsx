"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Play,
  RefreshCw,
  Power,
} from "lucide-react";
import { INTERRUPTERS } from "./sdcConfig";
import { SwitchKey, SwitchStates, ComponentPowerStates } from "./sdc";
import { SDCSchematic } from "./SDCSchematic";

export default function SDCSimulatorPage() {
  const [switches, setSwitches] = useState<SwitchStates>({
    lvms: true,
    bspd: true,
    cockpit: true,
    right: true,
    left: true,
    bots: true,
    inertia: true,
  });

  const [engineStarted, setEngineStarted] = useState(false);
  const [brake, setBrake] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [brakeTarget, setBrakeTarget] = useState(30);
  const [throttleTarget, setThrottleTarget] = useState(25);
  const [autoReset, setAutoReset] = useState(false);

  const [bspdTimer, setBspdTimer] = useState(0);
  const [clearTimer, setClearTimer] = useState(0);
  const [logs, setLogs] = useState<
    Array<{ id: string; time: string; msg: string }>
  >([]);

  const startTime = useMemo(() => Date.now(), []);

  const addLog = useCallback(
    (msg: string) => {
      const time = ((Date.now() - startTime) / 1000).toFixed(1);
      setLogs((prev) => [
        { id: Math.random().toString(), time: `${time}s`, msg },
        ...prev,
      ]);
    },
    [startTime],
  );

  const isLoopClosed = useMemo(
    () => Object.values(switches).every(Boolean),
    [switches],
  );

  // Compute power flow state across elements in sequence
  const powerStates = useMemo(() => {
    let current = true;
    const res: ComponentPowerStates = {
      src: { poweredBefore: true, poweredAfter: true },
    };

    INTERRUPTERS.forEach((item) => {
      const isClosed = switches[item.key];
      const poweredBefore = current;
      const poweredAfter = current && isClosed;
      res[item.key] = { poweredBefore, poweredAfter };
      current = poweredAfter;
    });

    return res;
  }, [switches]);

  const firstOpenInterrupter = useMemo(() => {
    return INTERRUPTERS.find((item) => !switches[item.key]);
  }, [switches]);

  const toggleSwitch = useCallback(
    (key: SwitchKey) => {
      setSwitches((prev) => {
        const nextState = !prev[key];
        if (key === "lvms" && !nextState) {
          // Switching off LVMS clears BSPD trip
          return { ...prev, lvms: false, bspd: true };
        }
        return { ...prev, [key]: nextState };
      });

      const target = INTERRUPTERS.find((i) => i.key === key);
      addLog(
        `${target?.title || key} -> ${!switches[key] ? "CLOSED" : "OPENED"}`,
      );
    },
    [switches, addLog],
  );

  // Reset engine status if loop breaks
  useEffect(() => {
    if (!isLoopClosed) {
      setEngineStarted(false);
    }
  }, [isLoopClosed]);

  // BSPD Plausibility & Reset Engine Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const condition =
        switches.lvms && brake >= brakeTarget && throttle >= throttleTarget;

      if (switches.bspd) {
        if (condition) {
          setBspdTimer((prev) => {
            if (prev + 50 >= 500) {
              setSwitches((s) => ({ ...s, bspd: false }));
              addLog(
                "TRIP: BSPD plausibility condition exceeded 500ms threshold",
              );
              return 0;
            }
            return prev + 50;
          });
        } else {
          setBspdTimer(0);
        }
      } else if (switches.lvms && autoReset) {
        if (!condition) {
          setClearTimer((prev) => {
            if (prev + 50 >= 10000) {
              setSwitches((s) => ({ ...s, bspd: true }));
              addLog("BSPD 10s auto-reset timer elapsed — cleared");
              return 0;
            }
            return prev + 50;
          });
        } else {
          setClearTimer(0);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [
    switches.bspd,
    switches.lvms,
    brake,
    throttle,
    brakeTarget,
    throttleTarget,
    autoReset,
    addLog,
  ]);

  const handleResetCircuit = () => {
    setSwitches({
      lvms: true,
      bspd: true,
      cockpit: true,
      right: true,
      left: true,
      bots: true,
      inertia: true,
    });
    setEngineStarted(false);
    setBspdTimer(0);
    setClearTimer(0);
    setBrake(0);
    setThrottle(0);
    addLog("System reset triggered — circuit restored");
  };

  return (
    <div className="min-h-screen bg-[#090d14] text-slate-100 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title Area */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="w-1.5 h-7 bg-blue-500 rounded-full shadow-[0_0_12px_#3b82f6]" />
              Shutdown Circuit Simulator
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Formula Student Rules 2027 (CV 4.1) combustion shutdown loop
              simulator. All interrupters are wired in series: if any switch
              opens, the circuit breaks instantly.
            </p>
          </div>
          <div className="font-mono text-xs font-semibold px-3.5 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
            @dzakyjl
          </div>
        </div>

        {/* Global Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 font-semibold text-sm transition-all duration-300 ${
            isLoopClosed
              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "bg-red-950/20 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
          }`}
        >
          {isLoopClosed ? (
            <>
              <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span>
                LOOP CLOSED — Power active across ignition, fuel pump relay, and
                injectors.
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              <span>
                LOOP OPEN — Interrupted at [
                {firstOpenInterrupter?.title || "Unknown"}]. Downstream circuit
                unpowered.
              </span>
            </>
          )}
        </div>

        {/* Dashboard Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: SVG Schematic & Control Panel */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#111823] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  SDC Schematic
                </h2>
                <span className="font-mono text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  SERIES LOOP
                </span>
              </div>
              <SDCSchematic
                switches={switches}
                powerStates={powerStates}
                isLoopClosed={isLoopClosed}
                onToggleSwitch={toggleSwitch}
              />
            </div>

            {/* Interrupter Controls List */}
            <div className="bg-[#111823] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  SDC Interrupter Controls
                </h2>
                <span className="font-mono text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  MANUAL OVERRIDE
                </span>
              </div>

              <div className="relative pl-5 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {INTERRUPTERS.map((item) => {
                  const isClosed = switches[item.key];
                  return (
                    <div
                      key={item.key}
                      className="relative flex items-start justify-between gap-4"
                    >
                      {/* Status Dot on Line */}
                      <span
                        className={`absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#111823] transition-colors ${
                          isClosed
                            ? "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                            : "bg-red-500 shadow-[0_0_6px_#ef4444]"
                        }`}
                      />

                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          {item.title}
                          <span className="font-mono text-[10px] text-slate-500 font-normal">
                            ({item.ruleRef})
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 min-w-[110px]">
                        <span
                          className={`font-mono text-xs font-bold ${
                            isClosed ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {isClosed ? "Closed" : "Open"}
                        </span>
                        {item.isAutoTrip ? (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Auto Trip
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleSwitch(item.key)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
                          >
                            {item.actionLabel(isClosed)}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Actuators, BSPD Calibration & Telemetry */}
          <div className="lg:col-span-5 space-y-6">
            {/* Engine Status & Actuators */}
            <div className="bg-[#111823] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Engine Status
                </h2>
                <span className="font-mono text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  CV 4.1
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["IGNITION", "FUEL PUMP", "INJECTORS"].map((label) => (
                  <div
                    key={label}
                    className={`p-2.5 rounded-lg border font-mono text-[11px] font-bold text-center transition-all ${
                      isLoopClosed
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                        : "border-slate-800 bg-slate-900 text-slate-600"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div
                className={`p-3 rounded-lg font-mono text-xs border-l-4 bg-[#0b111a] ${
                  engineStarted
                    ? "border-l-emerald-400 text-emerald-400"
                    : isLoopClosed
                      ? "border-l-slate-600 text-slate-300"
                      : "border-l-red-500 text-red-400"
                }`}
              >
                {engineStarted
                  ? "▶ ENGINE RUNNING — Powertrain Active"
                  : isLoopClosed
                    ? "■ ENGINE STOPPED — SDC Closed (Ready)"
                    : "✖ ENGINE STOPPED — SDC Open"}
              </div>

              <div className="flex gap-2">
                <button
                  disabled={!isLoopClosed || engineStarted}
                  onClick={() => {
                    setEngineStarted(true);
                    addLog(
                      "Engine ignition sequence complete — Engine Running",
                    );
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold text-xs uppercase px-4 py-2.5 rounded-md shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Engine
                </button>
                <button
                  onClick={handleResetCircuit}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* BSPD Calibration */}
            <div className="bg-[#111823] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  BSPD Calibration
                </h2>
                <span className="font-mono text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  T 11.6
                </span>
              </div>

              <div className="space-y-3">
                <div className="bg-[#0b111a] p-3 rounded-lg border border-slate-800/60 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Brake Pressure</span>
                    <span className="font-mono font-bold text-blue-400">
                      {brake} bar
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={brake}
                    onChange={(e) => setBrake(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="bg-[#0b111a] p-3 rounded-lg border border-slate-800/60 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Throttle Position</span>
                    <span className="font-mono font-bold text-blue-400">
                      {throttle}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={throttle}
                    onChange={(e) => setThrottle(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setBrake(80);
                      setThrottle(60);
                    }}
                    className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 py-1.5 px-3 rounded-md transition-colors"
                  >
                    Hard Brake + Throttle
                  </button>
                  <button
                    onClick={() => {
                      setBrake(0);
                      setThrottle(0);
                    }}
                    className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 py-1.5 px-3 rounded-md transition-colors"
                  >
                    Zero Pedals
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-[#0b111a] p-2.5 rounded-lg border border-slate-800/60 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Brake Setpoint</span>
                      <span className="font-mono font-bold text-blue-400">
                        {brakeTarget} bar
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={brakeTarget}
                      onChange={(e) => setBrakeTarget(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div className="bg-[#0b111a] p-2.5 rounded-lg border border-slate-800/60 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Throttle Setpoint</span>
                      <span className="font-mono font-bold text-blue-400">
                        {throttleTarget}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={throttleTarget}
                      onChange={(e) =>
                        setThrottleTarget(Number(e.target.value))
                      }
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Progress Bar Timer */}
              <div className="space-y-1.5 pt-2">
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, bspdTimer / 5)}%` }}
                  />
                </div>

                <p className="font-mono text-xs text-slate-400">
                  {switches.bspd
                    ? `Plausibility Timer: ${bspdTimer} ms / 500 ms`
                    : autoReset && switches.lvms
                      ? brake >= brakeTarget && throttle >= throttleTarget
                        ? "BSPD Tripped — Release pedals to start 10s auto-reset countdown."
                        : `BSPD Tripped — Auto-resetting in ${Math.max(
                            0,
                            (10000 - clearTimer) / 1000,
                          ).toFixed(1)}s...`
                      : "BSPD Tripped & Latched — Cycle LVMS to clear."}
                </p>

                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={autoReset}
                    onChange={(e) => setAutoReset(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0"
                  />
                  Enable 10s auto-reset without fault condition
                </label>
              </div>
            </div>

            {/* Event Log */}
            <div className="bg-[#111823] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Telemetry Console
                </h2>
                <span className="font-mono text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  EVENT LOG
                </span>
              </div>

              <div className="bg-[#070a0f] border border-slate-800 rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs space-y-1.5">
                {logs.length === 0 ? (
                  <p className="text-slate-600 italic">
                    No events logged yet...
                  </p>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="text-slate-400 border-b border-slate-800/40 pb-1 last:border-0"
                    >
                      <span className="text-slate-500">[{log.time}]</span>{" "}
                      {log.msg}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-slate-500 leading-relaxed bg-slate-900/40 border border-slate-800 p-4 rounded-lg">
          Based on Formula Student Rules 2027 v1.0 (FSG): T 6.2, T 11.3 to T
          11.6, and CV 4.1. Note that the 500 ms trip delay, 30 bar hard-braking
          limit, and 10 s self-reset logic carry over from prior regulations.
          Designed by @dzakyjl.
        </p>
      </div>
    </div>
  );
}
