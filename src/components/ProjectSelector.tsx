"use client";

import { useState, useEffect } from "react";
import { createProject } from "@/app/actions/projects";

interface Project {
  id: string;
  name: string;
  created_at: string;
}

interface ProjectSelectorProps {
  value: string; // project_id or empty string
  onChange: (projectId: string) => void;
  disabled?: boolean;
}

/**
 * Project selector dropdown with inline creation
 * 
 * Options:
 * - (Unassigned project, value = "")
 * - Existing user projects
 * - "+ Create new project" (triggers inline form)
 */
export default function ProjectSelector({
  value,
  onChange,
  disabled = false,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    }
    loadProjects();
  }, []);

  // Handle dropdown change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === "__create_new__") {
      setIsCreating(true);
    } else {
      onChange(selectedValue);
    }
  };

  // Handle new project creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      setError("Project name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newProject = await createProject(trimmedName);
      
      // Add to local list
      setProjects((prev) => [newProject, ...prev]);
      
      // Select the new project
      onChange(newProject.id);
      
      // Reset form
      setNewProjectName("");
      setIsCreating(false);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel creation
  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewProjectName("");
    setError(null);
  };

  // Inline creation form
  if (isCreating) {
    return (
      <div className="space-y-2">
        <form onSubmit={handleCreateProject} className="flex gap-2">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name"
            className="flex-1 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {isSubmitting ? "..." : "Add"}
          </button>
          <button
            type="button"
            onClick={handleCancelCreate}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
          >
            Cancel
          </button>
        </form>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  // Standard dropdown
  return (
    <select
      value={value}
      onChange={handleSelectChange}
      disabled={disabled}
      className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">No project</option>
      
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
      
      <option value="__create_new__">+ Create new project</option>
    </select>
  );
}
