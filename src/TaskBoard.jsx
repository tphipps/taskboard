
// Assumes connection to a SQL backend via API endpoints
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
} from "date-fns";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Star, Award, MoveLeft, MoveRight, CircleX, X as LucideX } from "lucide-react";
import { motion } from "framer-motion";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const api = {
  async updateTaskPlannedDate(taskId, date) {
    await fetch(`${API_BASE}/plan.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        plannedDate: (date) ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null
      })
    });
  },
  async fetchTasks(childId, month) {
    const res = await fetch(`${API_BASE}/api.php?assignee=${encodeURIComponent(childId)}&month=${encodeURIComponent(month)}`);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const data = await res.json();
    return data.map((t) => ({
      ...t,
      taskName: t.task_name,
      startDate: t.start_date,
      completionDate: t.completion_date,
      reviewedDate: t.reviewed_date,
      plannedDate: t.planned_date, 
    }));
  },
  async updateTaskCompletion(taskId, date) {
    await fetch(`${API_BASE}/complete.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        completionDate: date ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null
      })
    });
  },
};


// Add helper for drop validation
function isDropAllowed(task, dropDate, tasks) {
  const taskDate = parseISO(task.startDate);
  const today = new Date();

  if (taskDate.getMonth() !== dropDate.getMonth() || taskDate.getFullYear() !== dropDate.getFullYear()) return false;

  const duplicate = tasks.some(t => {
    const planned = t.plannedDate && isSameDay(parseISO(t.plannedDate), dropDate);
    return planned && t.taskName === task.taskName;
  });
  if (duplicate) return false;

  if (task.type === "W") {
    const dropWeekStart = startOfWeek(dropDate, { weekStartsOn: 1 });
    const dropWeekEnd = addDays(dropWeekStart, 6);
    if (taskDate < dropWeekStart || taskDate > dropWeekEnd) return false;
  }
  return true;
}


// Updated onDragEnd handler
function handleDragEnd(event, tasks, handleDrop) {
  const { active, over } = event;
  if (!active || !over) return;

  const task = tasks.find(t => String(t.id) === String(active.id));

  if (!task) return;

  if (over) {
    const dropDate = new Date(over.id);
    if (isDropAllowed(task, dropDate, tasks)) {
      handleDrop(task, dropDate);
      return;
    }
  }

  // Unplan if dropped outside a valid area
  if (task.plannedDate && !task.completionDate) {
    handleDrop(task, null);
  }
}

// Export helper for integration elsewhere
export { isDropAllowed };

function TaskChip({ task, onMarkIncomplete, activeId, setTasks }) {
  if (!task?.id) return null;

  const today = new Date();
  const baseDate = task.plannedDate ? parseISO(task.plannedDate) : parseISO(task.startDate);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const isDraggable =(() => {
    // Tasks that are marked complete are not draggable
    if (task.completionDate) return false;
  
    if (task.type === "W") {
      return baseDate >= weekStart;
    }
  
    if (task.type === "M") {
      return baseDate.getMonth() === today.getMonth() &&
             baseDate.getFullYear() === today.getFullYear();
    }
  
    return false;
  })();

  const draggable = useDraggable({ id: String(task.id), data: task });
  const { attributes, listeners, setNodeRef, transform } = isDraggable ? draggable : { attributes: {}, listeners: {}, setNodeRef: undefined, transform: null };
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined;
  const isComplete = Boolean(task.completionDate);
  const isTodayOrPast = task.plannedDate ? new Date() < parseISO(task.plannedDate): null;
  const isReviewed = Boolean(task.reviewedDate);

  // For use in Daily tasks only  
  const isToday = new Date().toDateString() === parseISO(task.startDate).toDateString();

  let chipColor =
      task.type === "M"
      ? "badge-secondary"
      : task.type === "W"
      ? "badge-warning"
      : "badge-primary";

  // Build a chip that is in the incomplete stack
  if(!task.plannedDate && task.type !== "D") {
    return (
      <motion.div id={String(task.id)}
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`badge chip-on-calendar badge-outline badge-sm px-2 py-1 gap-1 ${chipColor}`}
        style={style}
        transition={{ duration: 0.4 }}
      >
        {(task.type == "W" && !isComplete && parseISO(task.startDate) < weekStart) ? <CircleX size={16} /> : null}
        {(task.type == "M" && !isComplete && parseISO(task.startDate).getMonth() < new Date().getMonth()) ? <CircleX size={16} /> : null}
        {task.taskName}
      </motion.div>
    );
  }

  // Build a chip that has been reviewed and therefore locked
  if (isReviewed) {
    return (
      <div
      key={task.id}
      className={`badge badge-sm chip-on-calendar ${chipColor}`}
      >
        <Award height="20" width="20" fill="goldenrod" />
        {task.taskName}
      </div>
    );
  }
  // Build a chip that has been missed
  if ((task.type == "D" && !isToday && isTodayOrPast && !isComplete) || (task.type == "W" && !isComplete && parseISO(task.startDate) < weekStart)) {
    return (
    <label
      key={task.id}
      className={`chip-on-calendar badge badge-outline badge-sm ${chipColor}`}
    >
      <CircleX size={16} />
      {task.taskName}
    </label>
    );
  }

  // Build a chip that's on the calendar
  return (
    <motion.div id={String(task.id)}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`chip-on-calendar badge badge-outline badge-sm px-2 py-1 gap-1 ${chipColor}`}
      style={style}
      transition={{ duration: 0.4 }}
    >
    <motion.input
      type="checkbox"
      className="checkbox checkbox-xs"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      defaultChecked={isComplete}
      onPointerDown={(!isTodayOrPast) ? (e) => e.stopPropagation():null} // Prevents the checkbox from triggering the drag event
      disabled={(task.type == 'D') ? !isToday: isTodayOrPast}
      onChange={(e) => {
        e.stopPropagation();
        const newCompleted = e.target.checked;
        const completionDate = newCompleted ? new Date() : null;
        api.updateTaskCompletion(task.id, completionDate);
        setTasks(prev =>
          prev.map(t =>
            t.id === task.id
              ? { ...t, completionDate: completionDate ? completionDate.toISOString() : null }
              : t
          )
        );
      }}
    />
      {task.taskName}
    </motion.div>
  );
}

const handleMarkIncomplete = (task) => {
  const chip = document.getElementById(task.id);
  const returnArea = document.querySelector(`.task-return-area-${task.type}`);

  if (!chip || !returnArea) return;

  const chipRect = chip.getBoundingClientRect();
  const ghost = chip.cloneNode(true);
  const ghostStyle = ghost.style;
  ghost.id = '';
  ghostStyle.position = 'fixed';
  ghostStyle.top = `${chipRect.top}px`;
  ghostStyle.left = `${chipRect.left}px`;
  ghostStyle.width = `${chipRect.width}px`;
  ghostStyle.height = `${chipRect.height}px`;
  ghostStyle.zIndex = '1000';
  ghostStyle.pointerEvents = 'none';

  document.body.appendChild(ghost);

  requestAnimationFrame(() => {
    const target = document.getElementById(task.id);
    if (!target) return;
    const targetRect = target.getBoundingClientRect();
    const deltaX = targetRect.left - chipRect.left;
    const deltaY = targetRect.top - chipRect.top;

    ghost.animate([
      { transform: 'translate(0, 0)', opacity: 1 },
      { transform: `translate(${deltaX}px, ${deltaY}px)`, opacity: 0.3 }
    ], {
      duration: 800,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
    }).onfinish = () => {
      const target = document.getElementById(task.id);
      document.body.removeChild(ghost);
      handleDrop(task, null);
    };
  });
};

function DroppableDay({ date, onDrop, tasks, onMarkIncomplete, activeId, handleDrop, targetMonth, setTasks }) {
  const { setNodeRef, isOver } = useDroppable({ id: date.toISOString() });
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    if (!activeId) return setActiveTask(null);
    const task = tasks.find(t => t.id === activeId);
    setActiveTask(task || null);
  }, [isOver, activeId, tasks]);

  const isInvalidDrop = (() => {
    if (!activeId) return false;
    const activeTask = tasks.find((t) => String(t.id) === String(activeId));
    if (!activeTask || activeTask.completionDate) return false;
    const dropDate = date;
    const taskDate = parseISO(activeTask.startDate);
    const today = new Date();

    if (dropDate.getMonth() !== targetMonth.getMonth()) return true;

    const duplicate = tasks.some(t =>
      t.id !== activeTask.id &&
      t.taskName === activeTask.taskName &&
      t.type === activeTask.type &&
      (
        (t.completionDate && isSameDay(parseISO(t.completionDate), dropDate)) ||
        (t.plannedDate && isSameDay(parseISO(t.plannedDate), dropDate)) ||
        (t.type === "D" && isSameDay(parseISO(t.startDate), dropDate))
      )
    );
    if (duplicate) return true;

    if (activeTask.type === "W") {
      const dropWeekStart = startOfWeek(dropDate, { weekStartsOn: 1 });
      const dropWeekEnd = addDays(dropWeekStart, 6);
      return taskDate < dropWeekStart || taskDate > dropWeekEnd;
    }

    if (activeTask.type === "M") {
      return taskDate.getMonth() !== dropDate.getMonth() ||
             taskDate.getFullYear() !== dropDate.getFullYear();
    }

    return false;
  })();

  const dropColor =
    date.getMonth() !== targetMonth.getMonth()
      ? 'bg-gray-300 text-gray-400'
      : isOver
      ? isInvalidDrop
        ? 'bg-red-100'
        : 'bg-yellow-100'
      : isInvalidDrop
      ? 'bg-red-50'
      : '';

  const isToday = isSameDay(date, new Date());

  return (
    <div
      ref={setNodeRef}
      className={`calendar-cell card rounded-2xl shadow-xl bg-base-100 p-2 min-h-[7rem] w-full ${dropColor} ${date.getMonth() !== targetMonth.getMonth() ? 'bg-base-300 text-base-content' : ''} ${isToday ? 'border-yellow-400' : 'border-base-200'}`}
    >
      {isToday && (
        <Star className="absolute top-1 right-1 w-4 h-4 text-yellow-400" fill="currentColor" />
      )}
      <div className="text-xs text-gray-500">{format(date, "EEE d")}</div>
      <div className="flex flex-wrap gap-2 task-return-area-M">
        {tasks
          .filter((t) => t.type === "D" && parseISO(t.startDate).toDateString() === date.toDateString())
          .map((task) => {   
            return (
              <TaskChip
                key={task.id}
                task={task}
                activeId={activeId}
                setTasks={setTasks}
                onMarkIncomplete={handleMarkIncomplete}
              />
            );
          })}

      {tasks
      /* Render weekly and monthly tasks - this only renders tasks that are planned (i.e. in the calendar)
        - If the task is completed and reviewed, lock it
        - It the task is completed but not reviewed, allow changes but only in the current week / month depending on the task type
        - If the task is not completed, allow changes but only in the current week / month depending on the task type
      */
        .filter((t) => (t.type === "W" || t.type === "M") && t.plannedDate && isSameDay(parseISO(t.plannedDate), date))
        .map((task) => {
          return (
            <TaskChip
              key={task.id}
              task={task}
              activeId={activeId}
              setTasks={setTasks}
              onMarkIncomplete={handleMarkIncomplete}
            />
          );
        })}
      </div>
    </div>
  );
}

import { themeChange } from 'theme-change';

export default function TaskBoard() {
  const [users, setUsers] = useState([]);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [targetMonth, setTargetMonth] = useState(startOfMonth(new Date()));

  const [changePinStep, setChangePinStep] = useState(1);
  const [currentPinEntry, setCurrentPinEntry] = useState("");
  const [newPinEntry, setNewPinEntry] = useState("");
  const [pinError, setPinError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const [step, setStep] = useState(1);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const goToPreviousMonth = () => {
    setTargetMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return startOfMonth(newMonth);
    });
  };

  const goToNextMonth = () => {
    setTargetMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return startOfMonth(newMonth);
    });
  };

  useEffect(() => {
    const handler = (e) => {
      if (!document.getElementById("change-pin-modal")?.open) return;
  
      if (/^\d$/.test(e.key)) {
        setPinError("");
  
        if (changePinStep === 1) {
          setCurrentPinEntry(prev => {
            const next = prev + e.key;
            if (next.length === 4) {
              fetch(`${API_BASE}/verify_pin.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: authenticatedUser.id, pin: next })
              })
                .then(res => {
                  if (res.ok) setChangePinStep(2);
                  else throw new Error("Invalid PIN");
                })
                .catch(() => {
                  setPinError("Incorrect current PIN");
                  setTimeout(() => setPinError(""), 3000);
                  setCurrentPinEntry("");
                });
            }
            return next;
          });
        } else {
          setNewPinEntry(prev => {
            const next = prev + e.key;
            if (next.length === 4) {
              fetch(`${API_BASE}/change_pin.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user_id: authenticatedUser.id,
                  current_pin: currentPinEntry,
                  new_pin: next
                })
              })
                .then(res => {
                  if (!res.ok) throw new Error();
                  setShowSuccessAlert(true);
                  setTimeout(() => setShowSuccessAlert(false), 3000);
                  document.getElementById("change-pin-modal")?.close();
                  setChangePinStep(1);
                  setCurrentPinEntry("");
                  setNewPinEntry("");
                  setPinError("");
                })
                .catch(() => {
                  setPinError("Failed to change PIN");
                  setNewPinEntry("");
                });
            }
            return next;
          });
        }
      }
  
      if (e.key === "Backspace") {
        if (changePinStep === 1) {
          setCurrentPinEntry(p => p.slice(0, -1));
        } else {
          setNewPinEntry(p => p.slice(0, -1));
        }
      }
    };
  
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [changePinStep, authenticatedUser, currentPinEntry]);
  

  useEffect(() => {
    themeChange();
    const bindThemeToggles = () => {
      document.querySelectorAll(".theme-controller").forEach((toggle) => {
        if (toggle._bound) return;
        toggle._bound = true;
        toggle.onchange = (e) => {
          const newTheme = e.target.checked ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", newTheme);
          localStorage.setItem("theme", newTheme);
        };
      });
    };
    const observer = new MutationObserver(bindThemeToggles);
    observer.observe(document.body, { childList: true, subtree: true });
    bindThemeToggles();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedUser) return;
      if (e.key >= '0' && e.key <= '9') {
        const newPin = pin + e.key;
        setPin(newPin);
        setLoginError("");
        if (newPin.length === 4) {
          fetch(`${API_BASE}/verify_pin.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: selectedUser.id, pin: newPin })
          })
            .then(res => {
              if (res.status === 200) return res.json();
              if (res.status === 401) throw new Error("unauthorized");
              throw new Error("network error");
            })
            .then(data => {
              setAuthenticatedUser(selectedUser);
              setSelectedUser(null);
              setPin("");
              setLoginError("");
            })
            .catch(err => {
              if (err.message === "unauthorized") {
                setLoginError("Invalid PIN. Please try again.");
                setTimeout(() => setLoginError(""), 3000);
                setPin("");
              } else {
                setLoginError("Something went wrong. Please try again.");
                setTimeout(() => setLoginError(""), 3000);
                setPin("");
              }
            });
        }
      } else if (e.key === 'Backspace') {
        setPin(pin.slice(0, -1));
      } else if (e.key === 'Escape') {
        setSelectedUser(null);
        setPin("");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, pin]);
  
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  
  useEffect(() => {
    fetch(`${API_BASE}/get_users.php`)
      .then(res => res.json())
      .then(setUsers);
  }, []);

  useEffect(() => {
    if (authenticatedUser) {
      api.fetchTasks(authenticatedUser.id, format(targetMonth, "yyyy-MM")).then(setTasks);
    }
  }, [authenticatedUser, targetMonth]);  

  const monthlyTasks = tasks.filter((t) => t.type === "M" && !t.completionDate);

  const daysInMonth = [];
  let weekStart = startOfWeek(startOfMonth(targetMonth), { weekStartsOn: 1 });
  const monthEnd = endOfMonth(targetMonth);

  while (weekStart <= monthEnd) {
    daysInMonth.push(Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)));
    weekStart = addDays(weekStart, 7);
  }

  const weeklyTasksByWeek = daysInMonth.map((weekDays) => {
    const start = weekDays[0];
    const end = weekDays[6];
    return tasks.filter((t) => {
      if (t.type !== "W" || t.completionDate || t.plannedDate) return false;
      const baseDate = t.plannedDate ? parseISO(t.plannedDate) : parseISO(t.startDate);
      return baseDate >= start && baseDate <= end;
    });
  });

  // Helper for PIN change
function handlePinInput(n) {
  if (n === "") return;
  setPinError("");

  const update = changePinStep === 1
    ? currentPinEntry + n
    : newPinEntry + n;

  if (changePinStep === 1) {
    setCurrentPinEntry(update);
    if (update.length === 4) {
      fetch(`${API_BASE}/verify_pin.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: authenticatedUser.id, pin: update })
      })
        .then(res => {
          if (res.ok) setChangePinStep(2);
          else throw new Error("Invalid PIN");
        })
        .catch(() => {
          setPinError("Incorrect current PIN");
          setCurrentPinEntry("");
        });
    }
  } else {
    setNewPinEntry(update);
    if (update.length === 4) {
      fetch(`${API_BASE}/change_pin.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: authenticatedUser.id,
          current_pin: currentPinEntry,
          new_pin: update
        })
      })
        .then(res => {
          if (!res.ok) throw new Error();
          setShowSuccessAlert(true);
          setTimeout(() => setShowSuccessAlert(false), 3000);
          document.getElementById("change-pin-modal")?.close();
          setChangePinStep(1);
          setCurrentPinEntry("");
          setNewPinEntry("");
          setPinError("");
        })
        .catch(() => {
          setPinError("Failed to change PIN");
          setNewPinEntry("");
        });
    }
  }
}

  const handleDrop = (task, date) => {
    let updated;
    updated = tasks.map((t) =>
      t.id === task.id ? { ...t, plannedDate: (date) ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null } : t
    );
    api.updateTaskPlannedDate(task.id, date);
    setTasks(updated);
  };

  if (!authenticatedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
  <div className="absolute top-4 right-4">

<label className="flex cursor-pointer gap-2">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path
      d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </svg>
  <input type="checkbox" data-toggle-theme="light,dark" data-act-class="ACTIVECLASS" className="toggle theme-controller" />
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
</label>

  </div>
        <div className="bg-base-100 shadow-xl rounded-lg p-6 w-full max-w-sm select-none">
          <div className={`transition-all ${loginError ? "shake" : ""}`}>
            {!selectedUser && <h2 className="text-xl font-semibold mb-4">Please login</h2>}
            {!selectedUser ? (
            <div className="menu bg-base-100 rounded-box w-full mb-4">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="menu-item flex items-center gap-3 hover:bg-base-200 px-4 py-3 rounded"
                >
                  <img src={user.avatar_link} alt={user.first_name} className="w-24 h-24 rounded-full object-cover" />
                  <span className="text-lg font-medium">{user.first_name} {user.last_name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-4">
              <button onClick={() => { setSelectedUser(null); setPin(""); }} className="btn btn-ghost text-base-content mb-2 text-2xl px-3 leading-none">←</button>
              <div className="flex flex-col items-center mb-4">
                <img src={selectedUser.avatar_link} alt={selectedUser.first_name} className="w-24 h-24 rounded-full object-cover" />
                <span className="text-lg font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>
              </div>
            </div>
          )}
          {selectedUser && (
            <>
              <div className="flex justify-center mb-4 gap-2">
                {[0,1,2,3].map(i => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 ${i < pin.length ? 'bg-gray-800 border-gray-800' : 'border-gray-400'} transition-all`}
                  />
                ))}
              </div>
          <div className="grid grid-cols-3 gap-4 mb-6 px-4">
                {[1,2,3,4,5,6,7,8,9,"",0].map((n, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (n !== "") {
                        setLoginError("");
                        const newPin = pin + n.toString();
                        setPin(newPin);
                        if (newPin.length === 4) {
                          fetch(`${API_BASE}/verify_pin.php`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ user_id: selectedUser.id, pin: newPin })
                          })
                            .then(res => {
                              if (res.status === 200) return res.json();
                              if (res.status === 401) throw new Error("unauthorized");
                              throw new Error("network error");
                            })
                            .then(data => {
                              setAuthenticatedUser(selectedUser);
                              setSelectedUser(null);
                              setPin("");
                              setLoginError("");
                            })
                            .catch(err => {
                              if (err.message === "unauthorized") {
                                setLoginError("Invalid PIN. Please try again.");
                                setTimeout(() => setLoginError(""), 3000);
                                setPin("");
                              } else {
                                setLoginError("Something went wrong. Please try again.");
                                setPin("");
                              }
                            });
                        }
                      }
                    }}
                    className="btn btn-lg btn-soft text-xl font-bold py-5 px-6"
                    style={n === "" ? { visibility: 'hidden' } : {}}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="text-center min-h-[1.5rem]">
                {loginError && <p className="text-error text-sm">{loginError}</p>}
              </div>
              <div className="flex justify-between px-2 text-sm text-base-content mt-0 items-center">
                <button className="btn btn-ghost btn-xs px-1 text-base-content no-underline" onClick={() => setPin("")}>Clear</button>
                <button className="btn btn-ghost btn-xs px-1 text-base-content no-underline" onClick={() => setPin(pin.slice(0, -1))}>Delete</button>
              </div>
        </>
        )}
         </div>
        </div> 
      </div>
    );
  }

  return (
    <DndContext
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={({ over }) => {
        const task = tasks.find((t) => String(t.id) === String(activeId));
        if (!task) {
          setActiveId(null);
          return;
        }
  
        if (over) {
          const dropDate = new Date(over.id);
          if (isDropAllowed(task, dropDate, tasks)) {
            handleDrop(task, dropDate);
            setActiveId(null);
            return;
          }
        }
  
        if (task.plannedDate && !task.completionDate) {
          handleDrop(task, null);
        }
  
        setActiveId(null);
      }}

    >
    <div className="p-4 max-w-screen-xlg mx-auto bg-base-200 min-h-screen select-none">
      <div className="absolute top-4 right-4">
        <label className="flex cursor-pointer gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <path
          d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </svg>
      <input type="checkbox" data-toggle-theme="light,dark" data-act-class="ACTIVECLASS" className="toggle theme-controller" />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </label>
</div>

{showSuccessAlert && (
    <div className="alert alert-success fixed top-2 left-1/2 transform -translate-x-1/2 z-50 w-fit shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>PIN changed successfully</span>
    </div>
  )}
  
<header className="mb-4 flex justify-between items-center">
  <div className="dropdown dropdown-bottom">
    <label tabIndex={0} className="btn h-14 min-h-14 btn-ghost rounded-full flex items-center gap-2">
      <img src={authenticatedUser?.avatar_link} alt="avatar" className="w-12 h-12 rounded-full" />
      <span className="text-sm font-medium">{authenticatedUser?.first_name} {authenticatedUser?.last_name}</span>
    </label>
    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40 mt-2">
      <li>
        <button onClick={() => {
          document.querySelectorAll("#calendar .calendar-cell").forEach((el) => {
            el.classList.add("skeleton", "bg-base-300");
          });

          const dropdown = document.activeElement;

          setTimeout(() => {
            api.fetchTasks(authenticatedUser.id, format(targetMonth, "yyyy-MM")).then(setTasks);
            document.querySelectorAll("#calendar .calendar-cell").forEach((el) => {
              el.classList.remove("skeleton", "bg-base-300");
            });
          }, 1000);

          if (dropdown && dropdown.blur) dropdown.blur();
        }}>Refresh</button>
      </li>
      <li>
        <button onClick={() => document.getElementById("change-pin-modal")?.showModal()}>
          Change PIN
        </button>
      </li>
      <li>
        <button onClick={() => setAuthenticatedUser(null)}>Logout</button>
      </li>
    </ul>
  </div>
</header>

<Card id="calendar" className="mb-4 border-none bg-base-200">
  <CardContent>
    <div className="flex items-center justify-center gap-4 mb-4">
      <button onClick={goToPreviousMonth} className="btn btn-sm btn-circle btn-ghost">
        <MoveLeft className="w-5 h-5" />
      </button>
      <h2 className="text-xl font-semibold">
        {format(targetMonth, "MMMM yyyy")}
      </h2>
      <button onClick={goToNextMonth} className="btn btn-sm btn-circle btn-ghost">
        <MoveRight className="w-5 h-5" />
      </button>
    </div>

    <div className="flex flex-wrap gap-2 mb-6 task-return-area-M">
        {Object.entries(
          monthlyTasks.reduce((groups, task) => {
            if (task.plannedDate) return groups; // prevent duplication if already scheduled
            (groups[task.taskName] = groups[task.taskName] || []).push(task);
            return groups;
          }, {})
        ).map(([taskName, group]) => {  
        const topTask = group[0];
        const isGhost = String(topTask.id) === activeId;
        const badgeCount = (isGhost ? group.length-1 : group.length);

        return (
          <div key={topTask.id} className="relative inline-block">
            {isGhost ? (
              <div className={`badge chip-on-calendar badge-sm ${group.length === 1 ? 'badge-dash badge-secondary':'badge-outline badge-secondary'}`}>{topTask.taskName}</div>
            ) : (
              <TaskChip
                task={topTask}
                activeId={activeId}
                setTasks={setTasks}
                onMarkIncomplete={handleMarkIncomplete}
              />
            )}
            {group.length > 1 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {badgeCount}
              </span>
)}
          </div>
        );
      })}
    </div>

    {daysInMonth.map((week, index) => {
      const isCurrentWeek = week.some(day => isSameDay(startOfWeek(new Date(), { weekStartsOn: 1 }), startOfWeek(day, { weekStartsOn: 1 })));
      return (
        <Card key={index} className={`mb-4 ${isCurrentWeek ? 'bg-yellow-50 ring-1 ring-yellow-200' : 'bg-base-300'}`}>
          <CardContent>
            <h3 className="text-md font-semibold mb-2">Week {index + 1}</h3>
            <div className="flex flex-wrap gap-2 mb-2 task-return-area-W">
              {Object.entries(
                weeklyTasksByWeek[index].reduce((groups, task) => {
                  (groups[task.taskName] = groups[task.taskName] || []).push(task);
                  return groups;
                }, {})
              ).map(([taskName, group]) => {
                const topTask = group[0];
                const isGhost = String(topTask.id) === activeId;
                const badgeCount = (isGhost ? group.length-1 : group.length);
                const isSingularGhost = (isGhost && group.length === 1);
                if(isSingularGhost)
                  return (<div className='badge badge-outline badge-sm badge-dash badge-warning'>{topTask.taskName}</div>);

                return (
                  <div key={topTask.id} className="relative inline-block">
                    {(!isGhost) ? (
                      <TaskChip
                        task={topTask}
                        activeId={activeId}
                        setTasks={setTasks}
                        onMarkIncomplete={handleMarkIncomplete}/>
                    ) : (
                      <div className="badge badge-outline badge-sm badge-warning">
                        {topTask.taskName}
                      </div>
                    )}
                    {group.length > 1 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {badgeCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {week.map((day) => (
                <DroppableDay
                  key={day.toISOString()}
                  activeId={activeId}
                  date={day}
                  onDrop={(task) => {
                    const dropDate = day;
                    const taskStart = parseISO(task.startDate);
                    const today = new Date();

                    if (task.type === "D" && dropDate > today) return;
                    if (task.type === "D" && dropDate.getMonth() !== targetMonth.getMonth()) return;

                    if (task.type === "W") {
                      const dropWeekStart = startOfWeek(dropDate, { weekStartsOn: 1 });
                      const dropWeekEnd = addDays(dropWeekStart, 6);
                      if (taskStart < dropWeekStart || taskStart > dropWeekEnd) return;
                    }

                    if (task.type === "M") {
                      if (
                        taskStart.getMonth() !== dropDate.getMonth() ||
                        taskStart.getFullYear() !== dropDate.getFullYear()
                      ) return;
                    }

                    handleDrop(task, dropDate);
                  }}
                  targetMonth={targetMonth}
                  tasks={tasks}
                  onMarkIncomplete={handleMarkIncomplete}
                  handleDrop={handleDrop}
                  setTasks={setTasks}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )
    })}
  </CardContent>
</Card>
      </div>
      <DragOverlay>
      {(() => {
        const draggedTask = tasks.find((t) => String(t.id) === String(activeId));
        return draggedTask && !draggedTask.plannedDate ? (
          <TaskChip
            task={draggedTask}
            activeId={activeId}
            setTasks={setTasks}
            onMarkIncomplete={() => {}}
          />
        ) : null;
      })()}
      </DragOverlay>

      <dialog id="change-pin-modal" className="modal">
        <div className={`transition-all ${pinError ? "shake" : ""}`}>
          <div className="modal-box w-full max-w-sm">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => {
                document.getElementById("change-pin-modal")?.close();
                setChangePinStep(1);
                setCurrentPinEntry("");
                setNewPinEntry("");
                setPinError("");
              }}
            >
              <LucideX className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-lg mb-4">
              {changePinStep === 1 ? "Verify Current PIN" : "Enter New PIN"}
            </h3>

            <div className="flex justify-center mb-4 gap-2">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 ${
                    i < (changePinStep === 1 ? currentPinEntry.length : newPinEntry.length)
                      ? "bg-gray-800 border-gray-800"
                      : "border-gray-400"
                  } transition-all`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 px-4">
              {[1,2,3,4,5,6,7,8,9,"",0].map((n, i) => (
                <button
                  key={i}
                  onClick={() => handlePinInput(n)}
                  className="btn btn-lg btn-soft text-xl font-bold py-5 px-6"
                  style={n === "" ? { visibility: "hidden" } : {}}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="text-center min-h-[1.5rem]">
              {pinError && <p className="text-error text-sm">{pinError}</p>}
            </div>

            <div className="flex justify-between px-2 text-sm text-base-content mt-0 items-center">
              <button
                className="btn btn-ghost btn-xs px-1 text-base-content no-underline"
                onClick={() =>
                  changePinStep === 1
                    ? setCurrentPinEntry("")
                    : setNewPinEntry("")
                }
              >
                Clear
              </button>
              <button
                className="btn btn-ghost btn-xs px-1 text-base-content no-underline"
                onClick={() =>
                  changePinStep === 1
                    ? setCurrentPinEntry(currentPinEntry.slice(0, -1))
                    : setNewPinEntry(newPinEntry.slice(0, -1))
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </dialog>

    </DndContext>
  );
}

