import { parseISO, isBefore, startOfMonth, startOfWeek, endOfWeek } from "date-fns";

export function getTaskDisposition(task) {
  const today = new Date();
  const isToday = new Date().toDateString() === parseISO(task.startDate).toDateString();
  const startDate = parseISO(task.startDate);
  const plannedDate = task.plannedDate ? parseISO(task.plannedDate) : null;

  if (task.reviewedDate) return "Reviewed";
  if (task.completionDate) return "Pending Review";

  // From here on we can assume tasks are incomplete
    switch(task.type) {
        case 'D':
            return isBefore(startDate, today) && !isToday ? "Missed" : "Planned"; 
        case 'W':
            const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(startDate, { weekStartsOn: 1 });
            if (weekEnd < today)
                return "Missed";
            if (!plannedDate)    
                return "Unplanned";
            return "Planned";
        case "M":
            const monthStart = startOfMonth(startDate);

            if(startDate < monthStart)
                return "Missed";
            if (!plannedDate)    
                return "Unplanned";
            return "Planned";
    }        
}