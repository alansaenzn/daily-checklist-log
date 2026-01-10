"use client";

import React from "react";

type SliderProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  description?: string;
  valueSuffix?: string;
  onChange: (next: number) => void;
};

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  description,
  valueSuffix,
  onChange,
}: SliderProps) {
  return (
    <div className="space-y-2 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label htmlFor={id} className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </label>
          {description && <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>}
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
          {value}
          {valueSuffix ?? ""}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
        aria-label={label}
      />
      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
