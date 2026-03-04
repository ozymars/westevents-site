import { useEffect, useMemo, useState } from "react";

export default function WestEventsHomePage() {
  const month = "March 2026";
  const DEMO_ADMIN_PASSWORD = "WEST_EVENTS$2026";

  const defaultSchedule = [
    { day: 1, status: "off" },
    { day: 2, status: "host", label: "CPvP Night" },
    { day: 3, status: "off" },
    { day: 4, status: "off" },
    { day: 5, status: "host", label: "Mini Event" },
    { day: 6, status: "off" },
    { day: 7, status: "host", label: "Weekend Event" },
    { day: 8, status: "host", label: "Weekend Event" },
    { day: 9, status: "off" },
    { day: 10, status: "host", label: "Queue Night" },
    { day: 11, status: "off" },
    { day: 12, status: "off" },
    { day: 13, status: "host", label: "Friday Event" },
    { day: 14, status: "host", label: "Main Event" },
    { day: 15, status: "off" },
    { day: 16, status: "off" },
    { day: 17, status: "host", label: "Practice" },
    { day: 18, status: "off" },
    { day: 19, status: "host", label: "Scrim Night" },
    { day: 20, status: "off" },
    { day: 21, status: "host", label: "Saturday Event" },
    { day: 22, status: "off" },
    { day: 23, status: "off" },
    { day: 24, status: "host", label: "Midweek Event" },
    { day: 25, status: "off" },
    { day: 26, status: "off" },
    { day: 27, status: "host", label: "Friday Event" },
    { day: 28, status: "host", label: "Main Event" },
    { day: 29, status: "host", label: "Bonus Event" },
    { day: 30, status: "off" },
    { day: 31, status: "off" },
  ];

  const [schedule, setSchedule] = useState(defaultSchedule);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [draftLabel, setDraftLabel] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const firstDayOffset = 0;
  const totalCells = 35;

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const response = await fetch("/api/schedule", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          setSaveNotice("Using default schedule until backend is connected.");
          setIsLoadingSchedule(false);
          return;
        }

        const data = await response.json();
        if (Array.isArray(data?.schedule) && data.schedule.length) {
          setSchedule(data.schedule);
          setSaveNotice("Live shared schedule loaded.");
        }
      } catch {
        setSaveNotice("Using default schedule until backend is connected.");
      } finally {
        setIsLoadingSchedule(false);
        window.setTimeout(() => setSaveNotice(""), 2000);
      }
    };

    loadSchedule();
  }, []);

  const hostedCount = schedule.filter((d) => d.status === "host").length;
  const offCount = schedule.filter((d) => d.status === "off").length;

  const calendarCells = useMemo(() => {
    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - firstDayOffset + 1;
      return schedule.find((d) => d.day === dayNumber) || null;
    });
  }, [schedule]);

  const selectedEntry = schedule.find((entry) => entry.day === selectedDay) || schedule[0];

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

  const unlockAdmin = () => {
    if (!passwordInput.trim()) {
      setPasswordError("Enter your admin password.");
      return;
    }

    if (passwordInput !== DEMO_ADMIN_PASSWORD) {
      setPasswordError("Wrong password.");
      return;
    }

    setIsAdminUnlocked(true);
    setSelectedDay(selectedEntry?.day || 1);
    setDraftLabel(selectedEntry?.label || "");
    closePasswordPrompt();
  };

  const flashNotice = (message) => {
    setSaveNotice(message);
    window.clearTimeout(flashNotice._timer);
    flashNotice._timer = window.setTimeout(() => setSaveNotice(""), 1800);
  };

  const persistSchedule = async (nextSchedule, successMessage) => {
    setSchedule(nextSchedule);
    setIsSaving(true);

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ month, schedule: nextSchedule }),
      });

      if (!response.ok) {
        flashNotice("Save failed. Backend not connected yet.");
        return;
      }

      flashNotice(successMessage);
    } catch {
      flashNotice("Save failed. Backend not connected yet.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateDayStatus = async (newStatus) => {
    const nextSchedule = schedule.map((entry) =>
      entry.day === selectedDay
        ? {
            ...entry,
            status: newStatus,
            label: newStatus === "host" ? entry.label || draftLabel || "Event Night" : "",
          }
        : entry
    );

    await persistSchedule(nextSchedule, "Shared schedule updated.");
  };

  const saveDayLabel = async () => {
    const nextSchedule = schedule.map((entry) =>
      entry.day === selectedDay
        ? {
            ...entry,
            label: entry.status === "host" ? draftLabel : "",
          }
        : entry
    );

    await persistSchedule(nextSchedule, "Event label saved.");
  };

  const resetSchedule = async () => {
    setSelectedDay(1);
    setDraftLabel("");
    await persistSchedule(defaultSchedule, "Month reset.");
  };

  const selectAdminDay = (day) => {
    const entry = schedule.find((item) => item.day === day);
    setSelectedDay(day);
    setDraftLabel(entry?.label || "");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#061a3a] via-[#0a4f9f] to-[#16b7ff] text-white">
      <header className="sticky top-0 z-50 border-b border-[#8edcff]/20 bg-[#061a3a]/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-xl font-bold tracking-[0.25em] drop-shadow-[0_0_14px_rgba(141,220,255,0.35)]">
            WESTEVENTS
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
              <a href="#about" className="transition hover:text-white">About</a>
              <a href="#calendar" className="transition hover:text-white">Calendar</a>
              <a href="#status" className="transition hover:text-white">Status</a>
            </nav>
            <button
              type="button"
              onClick={openPasswordPrompt}
              className="rounded-2xl border border-[#8edcff]/25 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/90 transition hover:scale-[1.02] hover:bg-[#8edcff]/10 hover:border-[#8edcff]/40 active:scale-[0.98]"
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#8edcff]/15">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(22,183,255,0.32),transparent_42%)]" />
          <div className="relative mx-auto grid min-h-[78vh] max-w-6xl place-items-center px-6 py-20 text-center">
            <div>
              <p className="mb-4 text-sm uppercase tracking-[0.4em] text-white/60">Minecraft CPvP Events</p>
              <h1 className="text-5xl font-black tracking-[0.3em] drop-shadow-[0_0_18px_rgba(141,220,255,0.35)] sm:text-7xl">
                WESTEVENTS
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
                Stay up to date with when we host, when we take breaks, and what the month looks like at a glance.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#calendar"
                  className="rounded-2xl border border-[#8edcff]/35 bg-[#dff5ff] px-6 py-3 text-sm font-semibold text-[#061a3a] transition hover:scale-[1.02]"
                >
                  View This Month
                </a>
                <a
                  href="#about"
                  className="rounded-2xl border border-[#8edcff]/30 bg-[#061a3a]/20 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-[#8edcff]/10"
                >
                  Learn More
                </a>
              </div>

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
                  <div className="mt-1 text-sm text-white/60">Current Schedule</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-[#8edcff]/20 bg-[#061a3a]/30 p-8 shadow-2xl">
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-white/50">About</p>
              <h2 className="text-3xl font-bold">How WestEvents works</h2>
              <p className="mt-4 leading-7 text-white/75">
                WestEvents is an NA-W hosted Minecraft server where the event host picks a setup, then players are dropped into a large 5-biome map and the fighting begins.
                As the match progresses, the border slowly closes and each completed border destination triggers the next drop, repeating until the fourth drop reaches bedrock.
              </p>
              <p className="mt-4 leading-7 text-white/75">
                After the final close, the remaining players fight until one winner is left.
                During endgame, the bedrock clears and resets every 60 seconds unless an event host force-resets it sooner to speed up fights or stop stalling.
              </p>
            </div>

            <div id="status" className="rounded-3xl border border-[#8edcff]/20 bg-[#061a3a]/30 p-8 shadow-2xl">
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-white/50">Status Key</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-[#8edcff]/20 bg-[#061a3a]/25 p-4">
                  <div className="h-4 w-4 rounded-full bg-[#16b7ff]" />
                  <div>
                    <div className="font-semibold">Hosting</div>
                    <div className="text-sm text-white/60">An event or activity is scheduled.</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-[#8edcff]/20 bg-[#061a3a]/25 p-4">
                  <div className="h-4 w-4 rounded-full bg-[#dff5ff]/30" />
                  <div>
                    <div className="font-semibold">Off Day</div>
                    <div className="text-sm text-white/60">No official hosting planned.</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#8edcff]/20 bg-[#061a3a]/25 p-4 text-sm leading-7 text-white/70">
                  You can purchase an Event @ our discord: https://discord.gg/RZsjQyRcFr
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
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#16b7ff]" /> Hosting</span>
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#dff5ff]/30" /> Off</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[#8edcff]/20 bg-[#061a3a]/35 shadow-2xl">
              <div className="grid grid-cols-7 border-b border-[#8edcff]/15 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#dff5ff]/60 sm:text-sm">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="px-2 py-4">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarCells.map((entry, index) => {
                  const isHost = entry?.status === "host";
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => entry && isAdminUnlocked && selectAdminDay(entry.day)}
                      className={`min-h-[110px] border-b border-r border-[#8edcff]/12 p-2 text-left transition sm:min-h-[135px] sm:p-3 ${
                        entry ? (isHost ? "bg-[#16b7ff]/12" : "bg-[#dff5ff]/[0.03]") : "bg-transparent"
                      } ${entry && isAdminUnlocked ? "cursor-pointer hover:bg-[#8edcff]/10" : "cursor-default"}`}
                    >
                      {entry && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold sm:text-base">{entry.day}</span>
                            <span className={`h-2.5 w-2.5 rounded-full ${isHost ? "bg-[#16b7ff]" : "bg-[#dff5ff]/30"}`} />
                          </div>
                          <div className="mt-3 text-xs leading-5 text-white/75 sm:text-sm">
                            {isHost ? entry.label : "No hosting"}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {isLoadingSchedule && (
              <p className="mt-4 text-sm text-white/60">Loading live schedule...</p>
            )}
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
              onClick={() => setIsAdminUnlocked(false)}
              className="rounded-xl border border-[#8edcff]/25 bg-white/[0.04] px-3 py-1.5 text-sm font-semibold text-white/90 transition hover:bg-[#8edcff]/10 hover:border-[#8edcff]/40 active:scale-[0.98]"
            >
              Close
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-white/55">{saveNotice || (isSaving ? "Saving..." : "Edits save to the shared schedule API.")}</p>
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
            {schedule.map((entry) => (
              <button
                key={entry.day}
                type="button"
                onClick={() => selectAdminDay(entry.day)}
                className={`rounded-xl border px-2 py-2 text-sm font-semibold transition hover:scale-[1.03] active:scale-[0.98] ${
                  selectedDay === entry.day
                    ? "border-[#8edcff]/45 bg-[#16b7ff]/15 text-white shadow-[0_0_18px_rgba(22,183,255,0.15)]"
                    : "border-[#8edcff]/18 bg-white/[0.04] text-white/80 hover:bg-[#8edcff]/10 hover:border-[#8edcff]/35"
                }`}
              >
                {entry.day}
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
