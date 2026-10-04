"use client";

import React, { useState, useEffect, useRef } from "react";

interface Item {
  k: string;
  n: string;
  d: string;
  a?: string;
  b?: string;
}

const ITEMS: Item[] = [
  { k: "src", n: "LV battery, 12 V", d: "Supply for the shutdown circuit." },
  {
    k: "lvms",
    n: "Low voltage master switch (LVMS)",
    d: "Disables power from the battery and alternator to the whole LV system. Cycling it clears a BSPD trip. T 11.3",
    a: "Switch off",
    b: "Switch on",
  },
  {
    k: "bspd",
    n: "BSPD",
    d: "Standalone, non-programmable, supplied directly from the LVMS. Opens on hard braking with throttle more than 25 % over idle. T 11.6",
  },
  {
    k: "cockpit",
    n: "Cockpit shutdown button",
    d: "Red push-rotate or push-pull emergency switch the driver can reach. T 11.4",
    a: "Press",
    b: "Twist to release",
  },
  {
    k: "right",
    n: "Right shutdown button",
    d: "Red, behind the driver at head level. One on each side. T 11.4",
    a: "Press",
    b: "Twist to release",
  },
  {
    k: "left",
    n: "Left shutdown button",
    d: "Red, behind the driver at head level. One on each side. T 11.4",
    a: "Press",
    b: "Twist to release",
  },
  {
    k: "bots",
    n: "Brake over-travel switch (BOTS)",
    d: "Opens when the pedal over-travels after a brake circuit failure. The driver cannot reset it, and pressing again must not close it. T 6.2",
    a: "Over-travel",
    b: "Reset (not by driver)",
  },
  {
    k: "inertia",
    n: "Inertia switch",
    d: "Opens on impact and latches open until manually reset. T 11.5",
    a: "Simulate impact",
    b: "Reset",
  },
  {
    k: "sink",
    n: "Fuel pump relay, injection and ignition relay",
    d: "The SDC directly controls all power to ignition, injectors and fuel pumps, through at least two relays. CV 4.1",
  },
];

export default function Home() {
  const [switches, setSwitches] = useState<Record<string, number>>({
    lvms: 1,
    cockpit: 1,
    right: 1,
    left: 1,
    bots: 1,
    inertia: 1,
    bspd: 1,
  });

  const [started, setStarted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [brake, setBrake] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [brakeTarget, setBrakeTarget] = useState(30);
  const [throttleTarget, setThrottleTarget] = useState(25);
  const [allowSelfReset, setAllowSelfReset] = useState(false);
  const [timer, setTimer] = useState(0);
  const [clearTimer, setClearTimer] = useState(0);

  const t0 = useRef<number>(Date.now());
  const prevOK = useRef<boolean>(true);

  const isLoopClosed = Object.values(switches).every((v) => v === 1);

  const firstOpen = () => ITEMS.find((x) => switches[x.k] === 0);

  const addLog = (msg: string) => {
    const time = ((Date.now() - t0.current) / 1000).toFixed(1);
    setLogs((prev) => [`${time} s   ${msg}`, ...prev.slice(0, 7)]);
  };

  useEffect(() => {
    addLog("Simulator ready, loop closed");
  }, []);

  useEffect(() => {
    if (!isLoopClosed) {
      setStarted(false);
    }
    if (isLoopClosed !== prevOK.current) {
      const openItem = firstOpen();
      addLog(
        isLoopClosed
          ? "Loop closed, power restored"
          : `Loop opened by ${openItem ? openItem.n : "unknown"}`,
      );
      prevOK.current = isLoopClosed;
    }
  }, [switches, isLoopClosed]);

  const toggleSwitch = (k: string) => {
    setSwitches((prev) => {
      const nextVal = prev[k] ^ 1;
      const updated = { ...prev, [k]: nextVal };

      if (k === "lvms" && !nextVal) {
        updated.bspd = 1;
        setTimer(0);
      }
      return updated;
    });

    const item = ITEMS.find((i) => i.k === k);
    if (item) {
      addLog(`${item.n} ${switches[k] ? "opened" : "closed"}`);
    }
  };

  const handleStart = () => {
    setStarted(true);
    addLog("Engine started");
  };

  const handleReset = () => {
    setSwitches({
      lvms: 1,
      cockpit: 1,
      right: 1,
      left: 1,
      bots: 1,
      inertia: 1,
      bspd: 1,
    });
    setTimer(0);
    setClearTimer(0);
    setStarted(false);
    setBrake(0);
    setThrottle(0);
    addLog("Everything reset");
  };

  // Timer loop for BSPD logic
  useEffect(() => {
    const interval = setInterval(() => {
      // Access current state accurately
      const cond =
        switches.lvms === 1 &&
        brake >= brakeTarget &&
        throttle >= throttleTarget;

      if (switches.bspd === 1) {
        if (cond) {
          setTimer((t) => {
            const next = t + 50;
            if (next >= 500) {
              setSwitches((s) => ({ ...s, bspd: 0 }));
              setClearTimer(0);
              addLog(
                "BSPD tripped: hard braking and throttle over idle for 0.5 s",
              );
            }
            return next;
          });
        } else {
          setTimer(0);
        }
      } else if (switches.lvms === 1 && allowSelfReset) {
        if (!cond) {
          setClearTimer((c) => {
            const next = c + 50;
            if (next >= 10000) {
              setSwitches((s) => ({ ...s, bspd: 1 }));
              setTimer(0);
              addLog("BSPD self-reset after 10 s without the condition");
              return 0;
            }
            return next;
          });
        } else {
          setClearTimer(0);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [
    switches.lvms,
    switches.bspd,
    brake,
    throttle,
    brakeTarget,
    throttleTarget,
    allowSelfReset,
  ]);

  // Set point check warning messages
  const warnings = [];
  if (brakeTarget > 30) warnings.push("brake set point is above 30 bar");
  if (throttleTarget > 25)
    warnings.push("throttle set point is above 25 % over idle");

  // Track power rail state during iteration
  let currentOn = true;

  return (
    <div className="wrap">
      <h1>Shutdown circuit simulator</h1>
      <p className="sub">
        The combustion shutdown circuit (SDC) from Formula Student Rules 2027,
        CV 4.1. It is a series chain: if any one device opens, the fuel pump,
        injection and ignition lose power and the engine stops. Open devices and
        watch where power stops.
      </p>

      <div id="banner" className={isLoopClosed ? "good" : "bad"}>
        {isLoopClosed
          ? "Loop closed. Power reaches the ignition, fuel pump and injectors."
          : `Loop open at: ${firstOpen()?.n}. Everything after it is dead, so the engine is off.`}
      </div>

      <div className="grid">
        <div>
          <section className="panel">
            <h2>Shutdown loop</h2>
            <ol id="chain">
              {ITEMS.map((x, i) => {
                const sc = x.k in switches;
                const closed = !sc || switches[x.k] === 1;
                const top = currentOn;
                const bot = currentOn && closed;
                currentOn = bot;

                return (
                  <li className="row" key={x.k}>
                    <div className="rail">
                      <span
                        className={`seg ${top ? "on" : ""} ${
                          i === 0 ? "hid" : ""
                        }`}
                      ></span>
                      <span
                        className={`node ${
                          closed ? (top ? "c live" : "c") : "o"
                        }`}
                      ></span>
                      <span
                        className={`seg ${bot ? "on" : ""} ${
                          i === ITEMS.length - 1 ? "hid" : ""
                        }`}
                      ></span>
                    </div>
                    <div className="info">
                      <b>{x.n}</b>
                      <small>{x.d}</small>
                    </div>
                    <div className="ctl">
                      {sc && (
                        <span className={`st ${closed ? "" : "open"}`}>
                          {closed ? "Closed" : "Open"}
                        </span>
                      )}
                      {x.a && (
                        <button onClick={() => toggleSwitch(x.k)}>
                          {closed ? x.a : x.b}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <div>
          <section className="panel">
            <h2>Engine</h2>
            <div className="chips">
              <span className={`chip ${isLoopClosed ? "live" : ""}`}>
                Ignition
              </span>
              <span className={`chip ${isLoopClosed ? "live" : ""}`}>
                Fuel pump relay
              </span>
              <span className={`chip ${isLoopClosed ? "live" : ""}`}>
                Injectors
              </span>
            </div>
            <p style={{ margin: "0 0 10px", fontWeight: 500 }}>
              {started
                ? "Engine running"
                : isLoopClosed
                  ? "Engine stopped. The loop is closed, so it can be started."
                  : "Engine stopped. Close the loop to start it."}
            </p>
            <div className="btns">
              <button disabled={!isLoopClosed || started} onClick={handleStart}>
                Start engine
              </button>
              <button className="alt" onClick={handleReset}>
                Reset everything
              </button>
            </div>
          </section>

          <section className="panel">
            <h2>BSPD inputs</h2>
            <div className="sl">
              <label htmlFor="br">Brake pressure</label>
              <output>{brake} bar</output>
              <input
                type="range"
                id="br"
                min="0"
                max="100"
                value={brake}
                onChange={(e) => setBrake(+e.target.value)}
              />
            </div>
            <div className="sl">
              <label htmlFor="th">Throttle above idle</label>
              <output>{throttle}%</output>
              <input
                type="range"
                id="th"
                min="0"
                max="100"
                value={throttle}
                onChange={(e) => setThrottle(+e.target.value)}
              />
            </div>
            <div className="btns" style={{ marginBottom: "14px" }}>
              <button
                className="alt"
                onClick={() => {
                  setBrake(80);
                  setThrottle(60);
                }}
              >
                Hard brake with throttle
              </button>
              <button
                className="alt"
                onClick={() => {
                  setBrake(0);
                  setThrottle(0);
                }}
              >
                Release pedals
              </button>
            </div>

            <div className="sl">
              <label htmlFor="bt">Brake set point</label>
              <output>{brakeTarget} bar</output>
              <input
                type="range"
                id="bt"
                min="5"
                max="95"
                value={brakeTarget}
                onChange={(e) => setBrakeTarget(+e.target.value)}
              />
            </div>
            <div className="sl">
              <label htmlFor="tt">Throttle set point</label>
              <output>{throttleTarget}%</output>
              <input
                type="range"
                id="tt"
                min="5"
                max="95"
                value={throttleTarget}
                onChange={(e) => setThrottleTarget(+e.target.value)}
              />
            </div>

            <div className="bar" aria-hidden="true">
              <div
                id="bar"
                style={{ width: `${Math.min(100, timer / 5)}%` }}
              ></div>
            </div>

            <p className="cap">
              {switches.bspd === 1
                ? `Plausibility timer: ${timer} ms of 500 ms. Trips when both set points are exceeded together for 500 ms.`
                : allowSelfReset && switches.lvms === 1
                  ? `BSPD tripped. Self-reset in ${Math.max(
                      0,
                      (10000 - clearTimer) / 1000,
                    ).toFixed(
                      1,
                    )} s if the condition stays absent, or cycle the master switch.`
                  : "BSPD tripped and latched. Cycle the master switch to clear it."}
            </p>

            <label
              className="cap"
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={allowSelfReset}
                onChange={(e) => setAllowSelfReset(e.target.checked)}
              />
              Allow self-reset after 10 s without the condition
            </label>

            <p className="cap">
              {warnings.length
                ? `Check your set points: ${warnings.join(
                    " and ",
                  )}, so the BSPD could miss the rule condition.`
                : "Set points are at or below the rule values (30 bar, 25 % over idle)."}
            </p>
          </section>

          <section className="panel">
            <h2>Event log</h2>
            <ul id="log">
              {logs.map((logMsg, i) => (
                <li key={i}>{logMsg}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <p className="note">
        Based on Formula Student Rules 2027 v1.0 (FSG): T 6.2, T 11.3 to T 11.6
        and CV 4.1. The 500 ms delay, the 30 bar hard-braking level and the 10 s
        self-reset come from earlier editions and were not visible in the 2027
        text I could read, so confirm them in T 11.6 of the official PDF.
        Event-specific rules and your event handbook take precedence.
      </p>
    </div>
  );
}
