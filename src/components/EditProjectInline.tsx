"use client";

import React, { useState } from "react";

interface EditProjectInlineProps {
  initialName: string;
  initialDescription?: string | null;
  onCancel: () => void;
  onSave: (name: string, description: string | null) => Promise<void>;
}

export function EditProjectInline({
  initialName,
  initialDescription = null,
  onCancel,
  onSave,
}: EditProjectInlineProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setPending(true);
    setError(null);
    try {
      // Persist edits then rely on parent to refresh state optimistically
      await onSave(name.trim(), description.trim() === "" ? null : description.trim());
    } catch (err: any) {
      setError(err.message || "Failed to update project");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3" aria-label="Edit project">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Project name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900/70 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Project name"
          disabled={pending}
          autoFocus
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900/70 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="What is this project for?"
          disabled={pending}
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            // Reset to original values and exit
            setName(initialName);
            setDescription(initialDescription || "");
            onCancel();
          }}
          disabled={pending}
          className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
