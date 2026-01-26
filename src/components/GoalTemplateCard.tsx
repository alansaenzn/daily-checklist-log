/**
 * GoalTemplateCard
 * 
 * Minimalist disclosure card for goal templates.
 * Clean, expandable design with inline preview and actions.
 * Supports task management for user-created templates.
 */

import { useState } from "react";
import { Disclosure } from "@headlessui/react";
import { 
  ChevronDownIcon, 
  PlayIcon, 
  PencilIcon, 
  TrashIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { GoalTemplate } from "@/lib/task-types";
import { 
  getGoalTemplateWithTasks,
  addTaskToTemplate,
  updateTemplateTask,
  deleteTemplateTask,
  updateGoalTemplate,
  deleteGoalTemplate
} from "@/app/actions/goal-templates";
import type { GoalTemplateWithTasks, GoalTemplateTask } from "@/lib/task-types";

interface GoalTemplateCardProps {
  template: GoalTemplate;
  taskCount: number;
  isUserTemplate: boolean;
  onApply: () => void;
  onTemplateDeleted?: () => void;
  onTemplateUpdated?: () => void;
  isApplying?: boolean;
}

export function GoalTemplateCard({
  template,
  taskCount,
  isUserTemplate,
  onApply,
  onTemplateDeleted,
  onTemplateUpdated,
  isApplying = false,
}: GoalTemplateCardProps) {
  const [templateWithTasks, setTemplateWithTasks] = useState<GoalTemplateWithTasks | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editValues, setEditValues] = useState<{
    title: string;
    description: string;
    category: string;
    is_optional: boolean;
    estimated_duration_minutes: number | null;
  }>({ title: "", description: "", category: "", is_optional: false, estimated_duration_minutes: null });
  const [templateEditValues, setTemplateEditValues] = useState({
    name: template.name,
    description: template.description || "",
    focus_area: template.focus_area
  });

  const handleDisclosureToggle = async (isOpen: boolean) => {
    if (isOpen && !templateWithTasks && !isLoadingTasks) {
      setIsLoadingTasks(true);
      try {
        const data = await getGoalTemplateWithTasks(template.id);
        setTemplateWithTasks(data);
      } catch (error) {
        console.error("Failed to load template tasks:", error);
      } finally {
        setIsLoadingTasks(false);
      }
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !isUserTemplate) return;
    
    try {
      await addTaskToTemplate(template.id, {
        title: newTaskTitle.trim(),
        category: "General"
      });
      
      // Refresh template data
      const updatedData = await getGoalTemplateWithTasks(template.id);
      setTemplateWithTasks(updatedData);
      setNewTaskTitle("");
      setIsAddingTask(false);
      onTemplateUpdated?.();
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleUpdateTask = async (taskId: string) => {
    if (!isUserTemplate) return;
    
    try {
      await updateTemplateTask(taskId, editValues);
      
      // Refresh template data
      const updatedData = await getGoalTemplateWithTasks(template.id);
      setTemplateWithTasks(updatedData);
      setEditingTask(null);
      onTemplateUpdated?.();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!isUserTemplate || !confirm("Are you sure you want to delete this task?")) return;
    
    try {
      await deleteTemplateTask(taskId);
      
      // Refresh template data
      const updatedData = await getGoalTemplateWithTasks(template.id);
      setTemplateWithTasks(updatedData);
      onTemplateUpdated?.();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!isUserTemplate) return;
    
    try {
      await updateGoalTemplate(template.id, {
        name: templateEditValues.name.trim(),
        description: templateEditValues.description.trim() || null,
        focus_area: templateEditValues.focus_area.trim()
      });
      
      setEditingTemplate(false);
      onTemplateUpdated?.();
    } catch (error) {
      console.error("Failed to update template:", error);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!isUserTemplate || !confirm("Are you sure you want to delete this template? This cannot be undone.")) return;
    
    try {
      await deleteGoalTemplate(template.id);
      onTemplateDeleted?.();
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const startEditingTask = (task: GoalTemplateTask) => {
    setEditingTask(task.id);
    setEditValues({
      title: task.title,
      description: task.description || "",
      category: task.category,
      is_optional: task.is_optional,
      estimated_duration_minutes: task.estimated_duration_minutes
    });
  };

  const totalDuration = templateWithTasks
    ? templateWithTasks.tasks.reduce((sum, task) => {
        return sum + (task.estimated_duration_minutes || 0);
      }, 0) || null
    : null;

  return (
    <Disclosure>
      {({ open }) => (
        <>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
            <Disclosure.Button
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleDisclosureToggle(!open)}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  {editingTemplate && isUserTemplate ? (
                    <input
                      type="text"
                      value={templateEditValues.name}
                      onChange={(e) => setTemplateEditValues(prev => ({ ...prev, name: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') handleUpdateTemplate();
                        if (e.key === 'Escape') setEditingTemplate(false);
                      }}
                      className="text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {template.name}
                    </h3>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {template.focus_area}
                    </span>
                    <span className="text-gray-400 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {taskCount} {taskCount === 1 ? "task" : "tasks"}
                    </span>
                    {isUserTemplate && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {isUserTemplate && !editingTemplate && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTemplate(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate();
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </>
                )}
                {editingTemplate && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateTemplate();
                      }}
                      className="p-1 text-green-600 hover:text-green-700 transition-colors"
                    >
                      ✓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTemplate(false);
                        setTemplateEditValues({
                          name: template.name,
                          description: template.description || "",
                          focus_area: template.focus_area
                        });
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      ✕
                    </button>
                  </>
                )}
                <ChevronDownIcon
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </div>
            </Disclosure.Button>
            
            <Disclosure.Panel className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                {editingTemplate && isUserTemplate ? (
                  <div className="space-y-3">
                    <textarea
                      value={templateEditValues.description}
                      onChange={(e) => setTemplateEditValues(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Template description..."
                      className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 resize-none"
                      rows={2}
                    />
                    <input
                      type="text"
                      value={templateEditValues.focus_area}
                      onChange={(e) => setTemplateEditValues(prev => ({ ...prev, focus_area: e.target.value }))}
                      placeholder="Focus area"
                      className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {template.description}
                  </p>
                )}

                {/* Loading state */}
                {isLoadingTasks && (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading tasks...</div>
                  </div>
                )}

                {/* Preview content */}
                {templateWithTasks && (
                  <div className="space-y-4">
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Tasks</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {templateWithTasks.tasks.length}
                        </div>
                      </div>
                      {totalDuration && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <div className="text-xs text-gray-600 dark:text-gray-400">Est. Duration</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {totalDuration}m
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tasks list with management */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                          Tasks
                        </h4>
                        {isUserTemplate && (
                          <button
                            onClick={() => setIsAddingTask(true)}
                            className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Add Task
                          </button>
                        )}
                      </div>

                      {isAddingTask && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Task title..."
                            className="flex-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddTask();
                              if (e.key === 'Escape') {
                                setIsAddingTask(false);
                                setNewTaskTitle("");
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleAddTask}
                            className="text-green-600 hover:text-green-700 text-sm px-2 py-1"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingTask(false);
                              setNewTaskTitle("");
                            }}
                            className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {templateWithTasks.tasks.map((task, index) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-medium text-xs">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              {editingTask === task.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editValues.title}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full text-sm font-medium bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                                  />
                                  <textarea
                                    value={editValues.description}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Description..."
                                    className="w-full text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 resize-none"
                                    rows={2}
                                  />
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editValues.category}
                                      onChange={(e) => setEditValues(prev => ({ ...prev, category: e.target.value }))}
                                      placeholder="Category"
                                      className="text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                                    />
                                    <input
                                      type="number"
                                      value={editValues.estimated_duration_minutes || ""}
                                      onChange={(e) => setEditValues(prev => ({ ...prev, estimated_duration_minutes: e.target.value ? parseInt(e.target.value) : null }))}
                                      placeholder="Duration (min)"
                                      className="text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-20"
                                    />
                                    <label className="flex items-center text-xs">
                                      <input
                                        type="checkbox"
                                        checked={editValues.is_optional}
                                        onChange={(e) => setEditValues(prev => ({ ...prev, is_optional: e.target.checked }))}
                                        className="mr-1"
                                      />
                                      Optional
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleUpdateTask(task.id)}
                                      className="text-green-600 hover:text-green-700 text-xs px-2 py-1"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingTask(null)}
                                      className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                                    {task.is_optional && (
                                      <span className="text-xs px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded flex-shrink-0">
                                        Optional
                                      </span>
                                    )}
                                    {isUserTemplate && (
                                      <div className="flex items-center gap-1 ml-auto">
                                        <button
                                          onClick={() => startEditingTask(task)}
                                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                          <PencilIcon className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTask(task.id)}
                                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                        >
                                          <TrashIcon className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                      {task.category}
                                    </span>
                                    {task.estimated_duration_minutes && (
                                      <span>~{task.estimated_duration_minutes}m</span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Info callout */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-xs text-blue-900 dark:text-blue-200">
                        💡 {isUserTemplate ? "Edit tasks or template details as needed." : "Tasks will be added to your daily checklist. You can edit them anytime."}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Apply button */}
                <div className="pt-2">
                  <button
                    onClick={onApply}
                    disabled={isApplying}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlayIcon className="h-4 w-4" />
                    <span>{isApplying ? "Applying..." : "Apply Template"}</span>
                  </button>
                </div>
              </div>
            </Disclosure.Panel>
          </div>
        </>
      )}
    </Disclosure>
  );
}
