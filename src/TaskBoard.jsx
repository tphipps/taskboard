import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

import TaskChip from "./components/TaskChip";
import ChangePinModal from "./components/ChangePinModal";
import LoginBox from "./components/LoginBox";

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
  useDroppable,
} from "@dnd-kit/core";
import { Star, MoveLeft, MoveRight } from "lucide-react";

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
  const planned = task.plannedDate ? parseISO(task.plannedDate) : null;

  if (taskDate.getMonth() !== dropDate.getMonth() || taskDate.getFullYear() !== dropDate.getFullYear()) return false;

  if (planned && isSameDay(planned, dropDate)) return true;

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

function DroppableDay({ date, onDrop, tasks, activeId, handleDrop, targetMonth, setTasks }) {
  const { setNodeRef, isOver } = useDroppable({ id: date.toISOString() });

  const isInvalidDrop = (() => {
    if (!activeId) return false;
    const activeTask = tasks.find((t) => String(t.id) === String(activeId));
    if (!activeTask || activeTask.completionDate) return false;
    return !isDropAllowed(activeTask, date, tasks);
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
              />
            );
          })}

        {tasks
          .filter((t) => (t.type === "W" || t.type === "M") && t.plannedDate && isSameDay(parseISO(t.plannedDate), date))
          .map((task) => {
            return (
              <TaskChip
                key={task.id}
                task={task}
                activeId={activeId}
                setTasks={setTasks}
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
  
  const [loginError, setLoginError] = useState("");
  const [targetMonth, setTargetMonth] = useState(startOfMonth(new Date()));

  const [successAlertText, setSuccessAlertText] = useState("");

  const [pinModalOpen, setPinModalOpen] = useState(false);

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
      <LoginBox
        users={users}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        loginError={loginError}
        setLoginError={setLoginError}
        setAuthenticatedUser={setAuthenticatedUser}
      />
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

  {successAlertText && (
    <div className="alert alert-success fixed top-2 left-1/2 transform -translate-x-1/2 z-50 w-fit shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
      <span>{successAlertText}</span>
    </div>
  )} 

  <ChangePinModal
    open={pinModalOpen}
    userId={authenticatedUser.id}
    onClose={() => setPinModalOpen(false)}
    showAlert={(text) => {
      setSuccessAlertText(text);
      setTimeout(() => setSuccessAlertText(""), 3000);
    }}
  />


<header className="mb-4 flex justify-between items-center">
  <div className="dropdown dropdown-end">
    <div
      tabIndex={0}
      role="button"
      className="flex items-center gap-2 px-3 py-1 rounded-full border border-base-300 hover:shadow-md hover:bg-base-200 transition-all cursor-pointer"
    >
      <img
        src={authenticatedUser.avatar_link}
        alt="avatar"
        className="w-10 h-10 rounded-full object-cover"
      />
      <span className="font-medium text-sm whitespace-nowrap">
        {authenticatedUser.first_name} {authenticatedUser.last_name}
      </span>
    </div>

    <ul
      tabIndex={0}
      className="dropdown-content menu menu-sm p-2 shadow bg-base-100 rounded-box w-44 mt-1"
    >
      <li>
        <button onClick={() => location.reload()}>Refresh</button>
      </li>
      <li>
        <button
          onClick={() => {
            document.activeElement?.blur();
            setPinModalOpen(true);
          }}
        >
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
                      />
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
    </DndContext>
  );
}