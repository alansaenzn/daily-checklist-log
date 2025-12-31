"use client";

import { useState, useTransition } from "react";
import { toggleTaskForToday } from "../actions/tasks";

type Item = {
  id: string;
  title: string;
  category: string;
  checked: boolean;
};

export default function TodayChecklist({
  initialItems,
}: {
  initialItems: Item[];
}) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();

  function onToggle(id: string) {
    const next = items.map((i) =>
      i.id === id ? { ...i, checked: !i.checked } : i
    );
    setItems(next);

    const nextChecked = next.find((i) => i.id === id)!.checked;

    startTransition(async () =>
      toggleTaskForToday(id, nextChecked).catch((error: Error) => {
        setItems(items);
        alert(error.message ?? "Failed to save");
      })
    );
  }

  return (
    <section className="space-y-3">
      {items.length === 0 ? (
        <p className="text-gray-600">No active tasks yet. Add some in Tasks.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between rounded border p-3"
            >
              <div>
                <div className="font-medium">{i.title}</div>
                <div className="text-xs text-gray-500">{i.category}</div>
              </div>

              <button
                onClick={() => onToggle(i.id)}
                disabled={isPending}
                className={`h-9 w-24 rounded border ${
                  i.checked ? "bg-black text-white" : "bg-white"
                }`}
              >
                {i.checked ? "Done" : "Mark"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
