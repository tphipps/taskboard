import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

import PageHeader from "./components/PageHeader";
import TaskChip from "./components/TaskChip";
import ChangePinModal from "./components/ChangePinModal";
import LoginBox from "./components/LoginBox";
import TaskApprovalTable from "./components/TaskApprovalTable";

import { updateTaskPlannedDate, 
         fetchTasks, 
         fetchUsers} from "./lib/api";

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

  const reloadTasks = () => {
    document.querySelectorAll("#calendar .calendar-cell").forEach((el) => {
      el.classList.add("skeleton", "bg-base-300");
    });

    const dropdown = document.activeElement;

    setTimeout(() => {
      fetchTasks(authenticatedUser.id, format(targetMonth, "yyyy-MM")).then(setTasks);
      document.querySelectorAll("#calendar .calendar-cell").forEach((el) => {
        el.classList.remove("skeleton", "bg-base-300");
      });
    }, 1000);
  }

  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  
  useEffect(() => {
    fetchUsers().then(setUsers).catch(console.error);
  }, []);

  useEffect(() => {
    if (authenticatedUser && authenticatedUser.role !== "P") {
      fetchTasks(authenticatedUser.id, format(targetMonth, "yyyy-MM")).then(setTasks);
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
    updateTaskPlannedDate(task.id, date);
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

  if(authenticatedUser.role === "P") {
    return (
      <TaskApprovalTable
      onLogout={() => setAuthenticatedUser(null)}
      onChangePin={() => setPinModalOpen(true)}
      user={authenticatedUser}
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

  <PageHeader
    pageTitle="GANT Task Board"
    user={authenticatedUser}
    onLogout={() => setAuthenticatedUser(null)}
    onRefresh={reloadTasks}
    onChangePin={() => setPinModalOpen(true)}
  />

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
                            taskCompletion
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