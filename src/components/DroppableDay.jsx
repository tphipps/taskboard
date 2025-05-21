import {
  useDroppable,
} from "@dnd-kit/core";

import {
  format,
  isSameDay,
  parseISO,
} from "date-fns";

import { Star } from "lucide-react";

import TaskChip from "./TaskChip";
import { isDropAllowed } from "../lib/droppable";


export default function DroppableDay({ date, onDrop, tasks, activeId, handleDrop, targetMonth, setTasks }) {
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
      <div className="flex flex-wrap gap-1 task-return-area-M">
        {tasks
          .filter((t) => t.type === "D" && parseISO(t.startDate).toDateString() === date.toDateString())
          .map((task) => {   
            const isGhost = String(task.id) === activeId;
            return (!isGhost && (
              <TaskChip
                key={task.id}
                task={task}
                activeId={activeId}
                setTasks={setTasks}
              />
            ));
          })}

        {tasks
          .filter((t) => (t.type === "W" || t.type === "M") && t.plannedDate && isSameDay(parseISO(t.plannedDate), date))
          .map((task) => {
            const isGhost = String(task.id) === activeId;
            return (!isGhost && (
              <TaskChip
                key={task.id}
                task={task}
                activeId={activeId}
                setTasks={setTasks}
              />
            ));
          })}
      </div>
    </div>
  );
}
