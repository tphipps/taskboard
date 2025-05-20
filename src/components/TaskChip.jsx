import React from "react";

import { parseISO, startOfWeek, addDays} from "date-fns";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion"; // if animated

import {Award, CircleX, UserRound} from "lucide-react";

import { updateTaskCompletion } from "../lib/api";

export default function TaskChip({ task, setTasks }) {
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
  const isTodayOrPast = task.plannedDate ? new Date() >= parseISO(task.plannedDate): null;
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
        className={`chip-on-calendar badge badge-outline badge-sm max-w-[160px] truncate overflow-hidden whitespace-nowrap text-left px-2 py-1 gap-1  ${chipColor}`}
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
      className={`chip-on-calendar badge badge-sm max-w-[160px] truncate overflow-hidden whitespace-nowrap text-left px-2 py-1 gap-1 ${chipColor}`}
      >
        <Award height="20" width="20" fill="goldenrod" />
        {task.taskName}
      </div>
    );
  }
  // Build a chip that has been missed or is pending review
  if ((task.type == "D" && !isToday && isTodayOrPast ) 
    || (task.type == "W" && parseISO(task.startDate) < weekStart)) {
    return (
    <label
      key={task.id}
      className={`chip-on-calendar badge badge-outline badge-sm max-w-[160px] truncate overflow-hidden whitespace-nowrap text-left px-2 py-1 gap-1 ${chipColor}`}
    >
      {isComplete ? <UserRound size={16} /> :  <CircleX size={16} />}
      {task.taskName}
    </label>
    );
  }

  // Only include a checkbox if the task is:
  // - Daily and today
  // - Weekly and within the current week (previous weeks will already be rendered as missed)
  // - Monthly and within the current month and PRIOR to today
 
  const checkbox = <motion.input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  defaultChecked={isComplete}
                  disabled={false}
                  onPointerDown={(e) => e.stopPropagation()} // Prevents the checkbox from triggering the drag event
                  onChange={(e) => {  
                    e.stopPropagation();
                    const newCompleted = e.target.checked;
                    const completionDate = newCompleted ? new Date() : null;
                    updateTaskCompletion(task.id, completionDate);
                    setTasks(prev =>
                      prev.map(t =>
                        t.id === task.id
                          ? { ...t, completionDate: completionDate ? completionDate.toISOString() : null }
                          : t
                      )
                    );
                  }}
                />

  let renderCheckbox = null;

  switch(task.type)
  {
    case "D":
      if (isToday) 
        renderCheckbox = checkbox;
      break;
    case "W":
      if ((parseISO(task.startDate) >= weekStart && parseISO(task.startDate) <= weekEnd) &&
        (parseISO(task.plannedDate) <= today))
          renderCheckbox = checkbox;
      break;
    default: // "M"
      if ((parseISO(task.startDate).getMonth() === new Date().getMonth() && parseISO(task.startDate) < new Date()) &&
       (parseISO(task.plannedDate) <= today))
        renderCheckbox = checkbox;
      break;
  }

  // Build a chip that's on the calendar
  return (
    <motion.div id={String(task.id)}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`chip-on-calendar badge badge-outline badge-sm max-w-[160px] truncate overflow-hidden whitespace-nowrap text-left px-2 py-1 gap-1 ${chipColor}`}
      style={style}
      transition={{ duration: 0.4 }}
    >
      {renderCheckbox}
      {task.taskName}
    </motion.div>
  );
}