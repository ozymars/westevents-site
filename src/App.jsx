import { useEffect, useMemo, useState } from "react";

function monthKeyOf(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabelOf(date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function firstDayOffset(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function makeDefaultSchedule(date) {
  const n = daysInMonth(date);
  return Array.from({ length: n }, (_, i) => ({ day: i + 1, status: "off", label: "" }));
}

export default function App() {
  const [activeMonthDate] = useState(() => new Date());
  const month = monthLabelOf(activeMonthDate);
  const monthKey = monthKeyOf(activeMonthDate);

  const [schedule, setSchedule] = useState(() => makeDefaultSchedule(activeMonthDate));
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);
  const [draftLabel, setDraftLabel] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const offset = firstDayOffset(activeMonthDate);
  const totalDays = schedule.length;
  const totalCells = Math.ceil((offset + totalDays) / 7) * 7;

  useEffect(() => {
    const load = async () => {
      setIsLoadingSchedule(true);
      try {
        const res = await fetch(`/api/schedule?month=${encodeURIComponent(monthKey)}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          setSchedule(makeDefaultSchedule(activeMonthDate));
          return;
        }

        const data = await res.json();
        if (Array.isArray(data?.schedule) && data.schedule.length) {
          setSchedule(data.schedule);
        } else {
          setSchedule(makeDefaultSchedule(activeMonthDate));
        }
      } catch {
        setSchedule(makeDefaultSchedule(activeMonthDate));
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    load();
  }, [monthKey, activeMonthDate]);

  const hostedCount = schedule.filter((d) => d.status === "host").length;
  const offCount = schedule.filter((d) => d.status !== "host").length;

  const calendarCells = useMemo(() => {
    return Array.from({ length: totalCells }, (_, i) => {
      const dayNumber = i - offset + 1;
      if (dayNumber < 1 || dayNumber > totalDays) return null;
      return schedule.find((d) => d.day === dayNumber) || null;
    });
  }, [schedule, offset, totalCells, totalDays]);

  const openPasswordPrompt = () => {
    setIsPasswordOpen(true);
    setPasswordError("");
    setPasswordInput("");
  };

  const closePasswordPrompt = () => {
    setIsPasswordOpen(false);
    setPasswordError("");
    setPasswordInput("");
  };

  const selectAdminDay = (day) => {
    const entry = schedule.find((x) => x.day === day);
    setSelectedDay(day);
    setDraftLabel(entry?.label || "");
  };

  const unlockAdmin = async () => {
    if (!passwordInput.trim()) {
      setPasswordError("Enter your admin password.");
      return;
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "x-admin-password": passwordInput },
      });

      if (res.status === 401) {
        setPasswordError("Wrong password.");
        return;
      }

      if (!res.ok) {
        setPasswordError("Auth failed.");
        return;
      }

      const data = await res.json();
      if (!data?.token) {
        setPasswordError("Auth failed.");
        return;
      }

      setAdminToken(data.token);
      setIsAdminUnlocked(true);
      selectAdminDay(1);
      closePasswordPrompt();
    } catch {
      setPasswordError("Auth failed.");
    }
  };

  const persistSchedule = async (nextSchedule, successMessage) => {
    setSchedule(nextSchedule);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/schedule?month=${encodeURIComponent(monthKey)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({ month: monthKey, schedule: nextSchedule }),
      });

      if (res.status === 401) {
        setIsAdminUnlocked(false);
        setAdminToken("");
        setSaveNotice("Session expired. Re-open Admin.");
        return;
      }

      if (!res.ok) {
        setSaveNotice("Save failed.");
        return;
      }

      setSaveNotice(successMessage);
    } catch {
      setSaveNotice("Save failed.");
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setSaveNotice(""), 1800);
    }
  };

  const updateDayStatus = async (newStatus) => {
    const next = schedule.map((e) =>
      e.day === selectedDay
        ? { ...e, status: newStatus, label: newStatus === "host" ? e.label || draftLabel || "Event Night" : "" }
        : e
    );
    await persistSchedule(next, "Saved.");
  };

  const saveDayLabel = async () => {
    const next = schedule.map((e) =>
      e.day === selectedDay ? { ...e, label: e.status === "host" ? draftLabel : "" } : e
    );
    await persistSchedule(next, "Saved.");
  };

  const resetSchedule = async () => {
    const next = makeDefaultSchedule(activeMonthDate);
    setSelectedDay(1);
    setDraftLabel("");
    await persistSchedule(next, "Month reset.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#061a3a] via-[#0a4f9f] to-[#16b7ff] text-white">
      <header className="sticky top-0 z-50 border-b border-[#8edcff]/20 bg-[#061a3a]/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-xl font-bold tracking-[0.25em] drop-shadow-[0_0_14px_rgba(141,220,255,0.35)]">
            WESTEVENTS
          </div>
          <button
            type="button"
            onClick={openPasswordPrompt}
            className="rounded-2xl border border-[#8edcff]/25 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/90 transition hover:scale-[1.02] hover:bg-[#8edcff]/10 hover:border-[#8edcff]/40 active:scale-[0.98]"
          >
            Admin
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#8edcff]/15">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(22,183,255,0.32),transparent_42%)]" />
          <div className="relative mx-auto grid min-h-[64vh] max-w-6xl place-items-center px-6 py-20 text-center">
            <div>
              <p className="mb-4 text-sm uppercase tracking-[0.4em] text-white/60">Minecraft CPvP Events</p>
              <h1 className="text-5xl font-black tracking-[0.3em] drop-shadow-[0_0_18px_rgba(141,220,255,0.35)] sm:text-7xl">
                WESTEVENTS
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
                Scan quickly for hosted days (bright tiles) and see what&apos;s coming up.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#8edcff]/20 bg-[#061a3a]/30 p-5 shadow-2xl">
                  <div className="text-2xl font-bold">{hostedCount}</div>
                  <div className="mt-1 text-sm text-white/60">Hosted Days</div>
                </div>
                <div className="rounded-2xl border border-[#8edcff]/20 bg-[#061a3a]/30 p-5 shadow-2xl">
                  <div className="text-2xl font-bold">{offCount}</div>
                  <div className="mt-1 text-sm text-white/60">Off Days</div>
                </div>
                <div className="rounded-2xl border border-[#8edcff]/20 bg-[#061a3a]/30 p-5 shadow-2xl">
                  <div className="text-2xl font-bold">{month}</div>
                  <div className="mt-1 text-sm text-white/60">Current Month</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="calendar" className="border-t border-[#8edcff]/15 bg-[#061a3a]/20">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">Monthly Schedule</p>
                <h2 className="mt-2 text-3xl font-bold">{month}</h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/75">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-white" /> Hosting
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-white/25" /> Off
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[#8edcff]/20 bg-[#061a3a]/35 shadow-2xl">
              <div className="grid grid-cols-7 border-b border-[#8edcff]/15 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#dff5ff]/60 sm:text-sm">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="px-2 py-4">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarCells.map((entry, index) => {
                  const isHost = entry?.status === "host";
                  const tile = entry
                    ? isHost
                      ? "bg-white/20 hover:bg-white/25 border-white/25 shadow-[0_0_22px_rgba(255,255,255,0.10)]"
                      : "bg-white/[0.03] border-[#8edcff]/12"
                    : "bg-transparent border-transparent";

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => entry && isAdminUnlocked && selectAdminDay(entry.day)}
                      className={`min-h-[110px] border-b border-r p-2 text-left transition sm:min-h-[135px] sm:p-3 ${tile} ${
                        entry && isAdminUnlocked ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      {entry && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold sm:text-base ${isHost ? "text-white" : "text-white/85"}`}>
                              {entry.day}
                            </span>
                            <span className={`h-2.5 w-2.5 rounded-full ${isHost ? "bg-white" : "bg-white/25"}`} />
                          </div>
                          <div className={`mt-3 text-xs leading-5 sm:text-sm ${isHost ? "text-white" : "text-white/65"}`}>
                            {isHost ? entry.label || "Hosting" : "No hosting"}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {isLoadingSchedule && <p className="mt-4 text-sm text-white/60">Loading live schedule...</p>}
          </div>
        </section>
      </main>

      {isPasswordOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-6">
          <div className="w-full max-w-md rounded-3xl border border-[#8edcff]/25 bg-[#061a3a] p-6 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Admin Access</p>
            <h3 className="mt-2 text-2xl font-bold">Enter password</h3>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlockAdmin()}
              className="mt-5 w-full rounded-2xl border border-[#8edcff]/25 bg-[#08224c] px-4 py-3 text-white outline-none placeholder:text-white/35"
              placeholder="Password"
            />
            {passwordError && <p className="mt-3 text-sm text-red-300">{passwordError}</p>}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={unlockAdmin}
                className="rounded-2xl border border-[#8edcff]/35 bg-[#dff5ff] px-5 py-2.5 font-semibold text-[#061a3a] transition hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
              >
                Unlock
              </button>
              <button
                type="button"
                onClick={closePasswordPrompt}
                className="rounded-2xl border border-[#8edcff]/25 bg-white/[0.04] px-5 py-2.5 font-semibold text-white/90 transition hover:scale-[1.02] hover:bg-[#8edcff]/10 hover:border-[#8edcff]/40 active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdminUnlocked && (
        <div className="fixed bottom-5 right-5 z-[65] w-[min(92vw,380px)] rounded-3xl border border-[#8edcff]/25 bg-[#061a3a]/95 p-5 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Admin Mode</p>
              <h3 className="mt-1 text-xl font-bold">Edit day {selectedDay}</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAdminUnlocked(false);
                setAdminToken("");
              }}
              className="rounded-xl border border-[#8edcff]/25 bg-white/[0.04] px-3 py-1.5 text-sm font-semibold text-white/90 transition hover:bg-[#8edcff]/10 hover:border-[#8edcff]/40 active:scale-[0.98]"
            >
              Close
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-white/55">{saveNotice || (isSaving ? "Saving..." : `Month: ${monthKey}`)}</p>
            <button
              type="button"
              onClick={resetSchedule}
              disabled={isSaving}
              className="rounded-xl border border-[#8edcff]/20 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-[#8edcff]/10 hover:border-[#8edcff]/35 active:scale-[0.98] disabled:opacity-60"
            >
              Reset Month
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {schedule.map((e) => (
              <button
                key={e.day}
                type="button"
                onClick={() => selectAdminDay(e.day)}
                className={`rounded-xl border px-2 py-2 text-sm font-semibold transition hover:scale-[1.03] active:scale-[0.98] ${
                  selectedDay === e.day
                    ? "border-[#8edcff]/45 bg-[#16b7ff]/15 text-white shadow-[0_0_18px_rgba(22,183,255,0.15)]"
                    : "border-[#8edcff]/18 bg-white/[0.04] text-white/80 hover:bg-[#8edcff]/10 hover:border-[#8edcff]/35"
                }`}
              >
                {e.day}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => updateDayStatus("host")}
              disabled={isSaving}
              className="flex-1 rounded-2xl border border-[#8edcff]/35 bg-[#16b7ff]/18 px-4 py-2.5 font-semibold text-white transition hover:scale-[1.02] hover:bg-[#16b7ff]/24 hover:border-[#8edcff]/50 active:scale-[0.98] shadow-[0_0_16px_rgba(22,183,255,0.12)] disabled:opacity-60"
            >
              Set Hosting
            </button>
            <button
              type="button"
              onClick={() => updateDayStatus("off")}
              disabled={isSaving}
              className="flex-1 rounded-2xl border border-[#8edcff]/22 bg-white/[0.04] px-4 py-2.5 font-semibold text-white/90 transition hover:scale-[1.02] hover:bg-[#8edcff]/10 hover:border-[#8edcff]/35 active:scale-[0.98] disabled:opacity-60"
            >
              Set Off
            </button>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm text-white/65">Event label</label>
            <input
              type="text"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              className="w-full rounded-2xl border border-[#8edcff]/20 bg-[#08224c] px-4 py-3 text-white outline-none placeholder:text-white/35"
              placeholder="Ex: Main Event"
            />
            <button
              type="button"
              onClick={saveDayLabel}
              disabled={isSaving}
              className="mt-3 w-full rounded-2xl border border-[#8edcff]/35 bg-[#dff5ff] px-4 py-2.5 font-semibold text-[#061a3a] transition hover:scale-[1.01] hover:brightness-105 active:scale-[0.98] shadow-[0_0_16px_rgba(223,245,255,0.12)] disabled:opacity-60"
            >
              Save Label
            </button>
          </div>
        </div>
      )}
    </div>
  );
}