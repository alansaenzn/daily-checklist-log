/**
 * ProjectsTabView Component
 * 
 * Displays user projects (lists) with task counts.
 * Provides contextual organization for work without urgency.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { createProject } from "@/app/actions/projects";

export interface Project {
  id: string;
  name: string;
  created_at: string;
  task_count: number;
}

interface ProjectsTabViewProps {
  projects: Project[];
}

export function ProjectsTabView({ projects: initialProjects }: ProjectsTabViewProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setError(null);
    try {
      const project = await createProject(newProjectName.trim());
      setProjects([project, ...projects]);
      setNewProjectName("");
      setIsCreating(false);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wide">
          Organization
        </p>
        <h2 className="text-3xl font-black uppercase tracking-tight">
          Projects
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Organize your tasks into meaningful contexts.
        </p>
      </div>

      {/* Create Project Form */}
      {isCreating ? (
        <form onSubmit={handleCreateProject} className="space-y-3">
          <div>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name..."
              maxLength={100}
              autoFocus
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newProjectName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewProjectName("");
                setError(null);
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">Create Project</span>
        </button>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No projects yet. Create one to organize your tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ProjectCard Component
 * Individual project card with task count and navigation
 */
function ProjectCard({ project }: { project: Project }) {
  const lastActivity = new Date(project.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/tasks?project=${project.id}`}
      className="block group"
    >
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:border-blue-500 dark:hover:border-blue-500 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Created {lastActivity}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.task_count}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {project.task_count === 1 ? "task" : "tasks"}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
