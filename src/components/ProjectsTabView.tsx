/**
 * ProjectsTabView Component
 * 
 * Displays user projects as collapsible accordions with inline task lists.
 * Each project shows its tasks without navigating away.
 */

"use client";

import { useEffect, useState } from "react";
import { createProject, updateProject, deleteProject } from "../app/actions/projects";
import { getProjectTasks } from "../app/actions/project-tasks";
import { createTaskTemplate } from "../app/actions/tasks";
import { TaskRowDisplay, type TaskData } from "./TaskRowDisplay";
import { useRouter } from "next/navigation";
import TaskRow from "@/app/tasks/TaskRow";
import { type TaskType } from "@/lib/task-types";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  task_count: number;
}

interface ProjectsTabViewProps {
  projects: Project[];
}

export function ProjectsTabView({ projects: initialProjects }: ProjectsTabViewProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [projectTasks, setProjectTasks] = useState<Record<string, TaskData[]>>({});
  const [loadingProjects, setLoadingProjects] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<{ projectId: string; taskId: string } | null>(null);

  const projectNameLookup = projects.reduce<Record<string, string>>((acc, p) => {
    acc[p.id] = p.name;
    return acc;
  }, {});

  const ensureProjectTasks = async (projectId: string) => {
    if (projectTasks[projectId]) return projectTasks[projectId];
    setLoadingProjects((prev) => new Set([...prev, projectId]));
    try {
      const tasks = await getProjectTasks(projectId);
      setProjectTasks((prev) => ({ ...prev, [projectId]: tasks }));
      return tasks;
    } catch (err) {
      console.error("Failed to load project tasks:", err);
    } finally {
      setLoadingProjects((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
    return projectTasks[projectId];
  };

  const refreshProjectTasks = async (projectId: string) => {
    setLoadingProjects((prev) => new Set([...prev, projectId]));
    try {
      const tasks = await getProjectTasks(projectId);
      setProjectTasks((prev) => ({ ...prev, [projectId]: tasks }));
    } catch (err) {
      console.error("Failed to refresh project tasks:", err);
    } finally {
      setLoadingProjects((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

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

  const toggleProject = async (projectId: string) => {
    const isExpanded = expandedProjects.has(projectId);

    if (isExpanded) {
      if (editingTask?.projectId === projectId) setEditingTask(null);
      // Collapse
      const newExpanded = new Set(expandedProjects);
      newExpanded.delete(projectId);
      setExpandedProjects(newExpanded);
    } else {
      // Expand - fetch tasks if not already loaded
      const newExpanded = new Set(expandedProjects);
      newExpanded.add(projectId);
      setExpandedProjects(newExpanded);

      await ensureProjectTasks(projectId);
    }
  };

  const handleTaskClick = (taskId: string) => {
    // Legacy entry point retained for row click; task management stays inline.
    router.push(`/tasks#${taskId}`);
  };

  const startTaskEdit = async (projectId: string, taskId: string) => {
    setExpandedProjects((prev) => new Set([...prev, projectId]));
    await ensureProjectTasks(projectId);
    setEditingTask({ projectId, taskId });
  };

  const handleTaskUpdated = (projectId: string, updated: Partial<TaskData> & { id: string }) => {
    setProjectTasks((prev) => {
      const list = prev[projectId];
      if (!list) return prev;
      return {
        ...prev,
        [projectId]: list.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
      };
    });
  };

  const closeTaskEdit = () => setEditingTask(null);

  const handleSaveProject = async (
    projectId: string,
    nextName: string,
    nextDescription: string | null
  ) => {
    // Optimistically update UI
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, name: nextName, description: nextDescription ?? null } : p
      )
    );

    try {
      await updateProject(projectId, nextName, nextDescription);
    } catch (err) {
      console.error("Failed to update project", err);
      // On error, revert by refetching view
      router.refresh();
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      // Remove from local list after successful deletion
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      // Drop any cached tasks for this project
      setProjectTasks((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
      setExpandedProjects((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    } catch (err) {
      console.error("Failed to delete project", err);
      router.refresh();
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
            <ProjectAccordion
              key={project.id}
              project={project}
              isExpanded={expandedProjects.has(project.id)}
              isLoading={loadingProjects.has(project.id)}
              editingTask={editingTask}
              tasks={projectTasks[project.id] || []}
              onToggle={() => toggleProject(project.id)}
              onTaskClick={handleTaskClick}
              onTaskManage={(taskId) => startTaskEdit(project.id, taskId)}
              onSave={(name, description) => handleSaveProject(project.id, name, description)}
              onDelete={() => handleDeleteProject(project.id)}
              onTaskUpdated={(updated) => handleTaskUpdated(project.id, updated)}
              onCloseTaskEdit={closeTaskEdit}
              projectNameLookup={projectNameLookup}
              onTasksChanged={() => refreshProjectTasks(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ProjectAccordion Component
 * Collapsible project with inline task list
 */
interface ProjectAccordionProps {
  project: Project;
  isExpanded: boolean;
  isLoading: boolean;
  editingTask: { projectId: string; taskId: string } | null;
  tasks: TaskData[];
  onToggle: () => void;
  onTaskClick: (taskId: string) => void;
  onTaskManage: (taskId: string) => void;
  onSave: (name: string, description: string | null) => Promise<void>;
  onDelete: () => Promise<void>;
  onTaskUpdated: (updated: Partial<TaskData> & { id: string }) => void;
  onCloseTaskEdit: () => void;
  projectNameLookup: Record<string, string>;
  onTasksChanged: () => void; // callback to refresh tasks after creation
}

type SortMode =
  | "title"
  | "priority"
  | "created_desc"
  | "created_asc"
  | "due_asc"
  | "due_desc";

function ProjectAccordion({
  project,
  isExpanded,
  isLoading,
  editingTask,
  tasks,
  onToggle,
  onTaskClick,
  onTaskManage,
  onSave,
  onDelete,
  onTaskUpdated,
  onCloseTaskEdit,
  projectNameLookup,
  onTasksChanged,
}: ProjectAccordionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [sortMode, setSortMode] = useState<SortMode>("title");
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const editingTaskId = editingTask?.projectId === project.id ? editingTask.taskId : null;
  const selectedTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;
  const availableCategories = Array.from(
    new Set(tasks.map((t) => t.category).filter((c): c is string => Boolean(c)))
  );

  useEffect(() => {
    if (!isEditing) {
      setName(project.name);
      setDescription(project.description || "");
    }
  }, [project.name, project.description, isEditing]);

  const getPriorityRank = (priority: string | null | undefined) => {
    switch ((priority || "none").toLowerCase()) {
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  };

  const getCreatedTimestamp = (value: string | null | undefined) => {
    if (!value) return null;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getDueTimestamp = (task: TaskData) => {
    if (!task.due_date) return null;
    const time = task.due_time?.trim();
    const iso = time ? `${task.due_date}T${time}` : `${task.due_date}T00:00:00`;
    const parsed = Date.parse(iso);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const compareByTitle = (a: TaskData, b: TaskData) =>
    (a.title || "").localeCompare(b.title || "", undefined, {
      sensitivity: "base",
    });

  const compareTasks = (a: TaskData, b: TaskData) => {
    if (sortMode === "priority") {
      const rankDiff = getPriorityRank(b.priority) - getPriorityRank(a.priority);
      return rankDiff !== 0 ? rankDiff : compareByTitle(a, b);
    }

    if (sortMode === "created_desc" || sortMode === "created_asc") {
      const aTime = getCreatedTimestamp(a.created_at);
      const bTime = getCreatedTimestamp(b.created_at);
      if (aTime === null && bTime === null) return compareByTitle(a, b);
      if (aTime === null) return 1;
      if (bTime === null) return -1;
      return sortMode === "created_desc" ? bTime - aTime : aTime - bTime;
    }

    if (sortMode === "due_asc" || sortMode === "due_desc") {
      const aTime = getDueTimestamp(a);
      const bTime = getDueTimestamp(b);
      if (aTime === null && bTime === null) return compareByTitle(a, b);
      if (aTime === null) return 1;
      if (bTime === null) return -1;
      return sortMode === "due_desc" ? bTime - aTime : aTime - bTime;
    }

    return compareByTitle(a, b);
  };

  const sortedTasks = tasks.slice().sort(compareTasks);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(name.trim(), description.trim() === "" ? null : description.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await onDelete();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 overflow-hidden">
      {/* Project Header */}
      <div className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          {/* Expand/Collapse Icon */}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>

          {/* Project Name */}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {project.name}
            </h3>
            {project.description && !isEditing && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {project.description}
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
                setConfirmDelete(false);
                setName(project.name);
                setDescription(project.description || "");
              }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={`Cancel editing project ${project.name}`}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={`Edit project ${project.name}`}
            >
              Edit
            </button>
          )}

          {/* Task Count Badge */}
          <div className="flex-shrink-0 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
            {project.task_count}
          </div>
        </div>
      </div>

      {/* Task List (expanded) */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4 space-y-4">
          {isEditing && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Project name"
                    aria-label={`Edit project name for ${project.name}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a brief description"
                    aria-label={`Edit project description for ${project.name}`}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!name.trim() || isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setConfirmDelete(false);
                    setName(project.name);
                    setDescription(project.description || "");
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="border-t border-red-200 dark:border-red-800 pt-3 space-y-2">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Delete the project without removing its tasks. Tasks will stay and be moved to Inbox.
                </p>
                {confirmDelete ? (
                  <div className="space-y-2">
                    <p className="text-sm text-red-600 dark:text-red-400">Are you sure you want to delete this project?</p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        disabled={isSaving}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
                      >
                        {isSaving ? "Deleting..." : "Confirm delete"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={isSaving}
                    className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
                  >
                    Delete project
                  </button>
                )}
              </div>
            </div>
          )}

          {!isLoading && tasks.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor={`project-sort-${project.id}`}
                className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wide"
              >
                Sort tasks
              </label>
              <select
                id={`project-sort-${project.id}`}
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="title">Title (A-Z)</option>
                <option value="priority">Priority (High → Low)</option>
                <option value="created_desc">Date created (Newest)</option>
                <option value="created_asc">Date created (Oldest)</option>
                <option value="due_asc">Due date (Soonest)</option>
                <option value="due_desc">Due date (Latest)</option>
              </select>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-sm">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No active tasks in this project.</p>
              <div className="mt-4 max-w-xl mx-auto">
                <form
                  action={async (formData) => {
                    try {
                      setIsAdding(true);
                      const title = newTaskTitle.trim();
                      formData.set("title", title);
                      formData.set("project_id", project.id);
                      await createTaskTemplate(formData);
                      setNewTaskTitle("");
                      onTasksChanged();
                    } catch (err) {
                      console.error("Failed to add task:", err);
                    } finally {
                      setIsAdding(false);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="New task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    maxLength={200}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="New task title"
                    disabled={isAdding}
                    required
                    name="title"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim() || isAdding}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding ? "Adding..." : "Add Task"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <form
                  action={async (formData) => {
                    try {
                      setIsAdding(true);
                      const title = newTaskTitle.trim();
                      formData.set("title", title);
                      formData.set("project_id", project.id);
                      await createTaskTemplate(formData);
                      setNewTaskTitle("");
                      onTasksChanged();
                    } catch (err) {
                      console.error("Failed to add task:", err);
                    } finally {
                      setIsAdding(false);
                    }
                  }}
                  className="flex items-center gap-2 w-full"
                >
                  <input
                    type="text"
                    placeholder="Add a task to this project..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    maxLength={200}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="New task title"
                    disabled={isAdding}
                    required
                    name="title"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim() || isAdding}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding ? "Adding..." : "Add Task"}
                  </button>
                </form>
              </div>
              {sortedTasks.map((task) => (
                <TaskRowDisplay
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task.id)}
                  onManage={() => onTaskManage(task.id)}
                  showProject={false}
                />
              ))}
            </div>
          )}

          {selectedTask && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Task management</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">Edit this task without leaving Projects</p>
                </div>
                <button
                  type="button"
                  onClick={onCloseTaskEdit}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close task editor"
                >
                  Close
                </button>
              </div>

              <TaskRow
                task={{
                  id: selectedTask.id,
                  title: selectedTask.title,
                  category: selectedTask.category || "",
                  is_active: selectedTask.is_active,
                  task_type: (selectedTask.task_type as TaskType) || "recurring",
                  archived_at: selectedTask.archived_at ?? null,
                  notes: selectedTask.notes ?? null,
                  url: selectedTask.url ?? null,
                  due_date: selectedTask.due_date ?? null,
                  due_time: selectedTask.due_time ?? null,
                  list_name: selectedTask.list_name ?? null,
                  details: selectedTask.details ?? null,
                  project_id: selectedTask.project_id ?? null,
                  priority: selectedTask.priority ?? null,
                }}
                availableCategories={availableCategories}
                projectLookup={projectNameLookup}
                onUpdated={(updated) => onTaskUpdated(updated)}
                isExpanded={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
