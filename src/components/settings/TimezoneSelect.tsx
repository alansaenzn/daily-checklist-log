"use client";

import React from "react";

type TimezoneSelectProps = {
  value: string | null;
  detectedTimezone: string | null;
  onChange: (tz: string | null) => void;
  disabled?: boolean;
};

function getTimezones(): string[] {
  try {
    const anyIntl = Intl as any;
    if (typeof anyIntl.supportedValuesOf === "function") {
      return anyIntl.supportedValuesOf("timeZone") as string[];
    }
  } catch {}
  return [];
}

export function TimezoneSelect({ value, detectedTimezone, onChange, disabled }: TimezoneSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const options = React.useMemo(() => getTimezones(), []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((tz) => tz.toLowerCase().includes(q));
  }, [options, query]);

  const selectedLabel = value ?? "Select timezone";

  const handlePick = (tz: string) => {
    onChange(tz);
    setOpen(false);
  };

  const handleUseCurrent = () => {
    onChange(detectedTimezone ?? "UTC");
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <div className="relative" aria-label="Timezone selector">
      <button
        type="button"
        title="Timezone"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 flex items-center justify-between focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
      >
        <span className={value ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>{selectedLabel}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-500 dark:text-gray-400">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800 backdrop-blur">
          <div className="flex items-center gap-2 p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search timezones"
              aria-label="Search timezones"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
            />
            <button
              type="button"
              onClick={handleUseCurrent}
              className="rounded-full border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              Use current
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto rounded-lg">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">No matches</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((tz) => {
                  const active = tz === value;
                  return (
                    <li key={tz}>
                      <button
                        type="button"
                        onClick={() => handlePick(tz)}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          active ? "bg-blue-600 text-white" : "text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        }`}
                        title={tz}
                      >
                        {tz}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TimezoneSelect;
