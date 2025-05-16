
import {
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
} from "date-fns";

// Add helper for drop validation
export function isDropAllowed(task, dropDate, tasks) {
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