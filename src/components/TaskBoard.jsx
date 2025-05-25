import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

import { Transition } from '@headlessui/react';

import PageHeader from "./PageHeader";
import TaskChip from "./TaskChip";
import DroppableDay from "./DroppableDay";

import { updateTaskPlannedDate, 
         fetchTasks } from "../lib/api";

import { isDropAllowed } from "../lib/droppable";
import { useAuth } from "../context/AuthContext";
import { DragProvider } from "../context/DragContext";
  
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
} from "@dnd-kit/core";
import { MoveLeft, MoveRight } from "lucide-react";

export default function TaskBoard() {
  
  const { authenticatedUser } = useAuth();

  const [targetMonth, setTargetMonth] = useState(startOfMonth(new Date()));

  const [tasks, setTasks] = useState([]);
  const [monthlyTarget, setMonthlyTarget] = useState({month: startOfMonth(new Date()), targetAmount: 0, achievedAmount: 0 })
  const [activeId, setActiveId] = useState(null);

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

  function setMonthlyTaskData(monthlyTaskData) {
    setTasks(monthlyTaskData.tasks);
    setMonthlyTarget(monthlyTaskData.monthlyTargetData);
  }

  const reloadTasks = () => {
    document.querySelectorAll("#calendar .calendar-cell").forEach((el) => {
      el.classList.add("skeleton", "bg-base-300");
    });

    setTimeout(() => {
      fetchTasks(authenticatedUser.id, format(targetMonth, "yyyy-MM")).then(result => setMonthlyTaskData(result));
      document.querySelectorAll("#calendar .calendar-cell").forEach((el) => {
        el.classList.remove("skeleton", "bg-base-300");
      });
    }, 1000);
  }

  const monthlyTasks = tasks.filter((t) => t.type === "M" && !t.completionDate);

  useEffect(() => {
        fetchTasks(authenticatedUser.id, format(targetMonth, "yyyy-MM")).then(result => setMonthlyTaskData(result));
  }, [authenticatedUser, targetMonth]);  

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

  const draggedTask = tasks.find((t) => String(t.id) === String(activeId));

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
      <DragProvider>

      <div className="p-4 max-w-screen-xlg mx-auto bg-base-300 min-h-screen select-none">

      <PageHeader
        pageTitle="GANT Task Board"
        onRefresh={reloadTasks}
      />   

          <Card id="calendar" className="mb-4 border-none bg-base-200">
            <CardContent>
              <div className="relative flex justify-between items-center mb-4">
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4">
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
                <div className="ml-auto text-right text-sm">
                  <div>
                    <span className="font-semibold">Target monthly earnings:</span>
                    <span className="ml-2 text-green-600 font-mono">
                      ${parseFloat(monthlyTarget.targetAmount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Missed task value:</span>
                    <span className="ml-2 text-red-500 font-mono">${parseFloat(monthlyTarget.missedAmount || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Still achievable this month:</span>
                    <span className="ml-2 text-yellow-600 font-mono">
                      ${(parseFloat(monthlyTarget.targetAmount || 0) - parseFloat(monthlyTarget.missedAmount || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
                <Transition
                  show={(monthlyTasks.filter(task => !task.plannedDate).length) > 0}
                  enter="transition-opacity duration-300 ease-in-out"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition-opacity duration-300 ease-in-out"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  as="div"
                >
                <div className="bg-gray-950 text-white text-sm mt-2 px-3 py-2 rounded">
                  <h4 className="text-sm font-medium">Monthly tasks to plan</h4>
                  <div className="flex flex-wrap gap-2 mt-1 task-return-area-M">
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
                      {!isGhost && (
                        <TaskChip
                          task={topTask}
                          activeId={activeId}
                          setTasks={setTasks}
                        />
                      )}
                      {isGhost && (
                        <div className={`badge chip-on-calendar badge-sm ${group.length === 1 ? 'badge-dash badge-secondary':'badge-outline badge-secondary'}`}>{topTask.taskName}</div>
                      )}
                      {group.length > 1 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {badgeCount}
                        </span>
                      )}
                    </div>
                  )
                    })} 
                  </div>
                </div>
                <div>&nbsp;</div>
              </Transition>

    {daysInMonth.map((week, index) => {
    const isCurrentWeek = week.some(day => isSameDay(startOfWeek(new Date(), { weekStartsOn: 1 }), startOfWeek(day, { weekStartsOn: 1 })));
    const weekStart = format(week[0], "MMM d");
    const weekEnd = format(week[6], "MMM d");
    const unallocatedWeeklyTasks = weeklyTasksByWeek[index];
    const hasUnallocated = unallocatedWeeklyTasks.length > 0;

    return (
      <Card key={index} style={{ paddingTop: 0 }} className={`mb-4 border border-gray-300 ${isCurrentWeek ? 'ring-2 ring-yellow-300' : ''}`}>
        <div className="bg-gray-800 text-white px-4 pt-3 pb-2 rounded overflow-hidden">
          <h3 className="text-lg font-semibold">Week of {weekStart} - {weekEnd}</h3>

          <Transition
            show={hasUnallocated}
            enter="transition-opacity duration-300 ease-in-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-300 ease-in-out"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="bg-gray-950 text-sm mt-2 px-3 py-2 rounded">
              <h4 className="text-sm font-medium">Weekly tasks to plan</h4>
              <div className="flex flex-wrap gap-2 mt-1 task-return-area-W">
                {Object.entries(
                  unallocatedWeeklyTasks.reduce((groups, task) => {
                    (groups[task.taskName] = groups[task.taskName] || []).push(task);
                    return groups;
                  }, {})
                ).map(([taskName, group]) => {
                  const topTask = group[0];
                  const isGhost = String(topTask.id) === activeId;
                  const badgeCount = (isGhost ? group.length - 1 : group.length);
                  const isSingularGhost = (isGhost && group.length === 1);

                  if (isSingularGhost)
                    return (<div className='chip-on-calendar badge badge-outline badge-sm badge-dash badge-warning'>{topTask.taskName}</div>);

                  return (
                    <div key={topTask.id} className="relative inline-block">
                      {!isGhost ? (
                        <TaskChip task={topTask} activeId={activeId} setTasks={setTasks} taskCompletion />
                      ) : (
                        <div className="badge chip-on-calendar badge-outline badge-sm badge-warning">{topTask.taskName}</div>
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
            </div>
          </Transition>
        </div>
        <CardContent className="pt-4">
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
    );
  })}
        </CardContent>
      </Card>
        </div>
        <DragOverlay>
          <div className="z-50 relative">
            {draggedTask && (
              <TaskChip
                task={draggedTask}
                activeId={activeId}
                setTasks={setTasks}
                onMarkIncomplete={() => {}}
              />
            )}
          </div>
        </DragOverlay>
      </DragProvider>
    </DndContext>
 
  );
}
