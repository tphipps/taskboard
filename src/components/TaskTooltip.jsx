import { Award, ShieldQuestion, X, ClockFading, CalendarCheck} from "lucide-react";
import { format } from "date-fns";

const TaskTooltip = ({ task }) => {
    let badgeColor = "text-black-400";
    let monetaryAmountColor = "text-black-400"
    let monetaryAmountPrefix = "";
    let badgeLabel = "Unknown";
    let BadgeIcon = ShieldQuestion;

    switch(task.disposition) {
        case 'Reviewed':
            BadgeIcon = Award;
            badgeColor = "text-yellow-400";
            monetaryAmountColor = "text-green-600";
            badgeLabel = "Reviewed";
            break;
        case 'Missed':
            BadgeIcon = X;
            badgeColor = "text-red-400";
            monetaryAmountColor = "text-red-600";
            monetaryAmountPrefix = "-";
            badgeLabel = "Missed";
            break;
        case 'Pending Review':
            BadgeIcon = ClockFading;
            badgeColor = "text-gray-400";
            monetaryAmountColor = "text-gray-400"
            badgeLabel = "Pending Review";
            break;
        case 'Planned':
            BadgeIcon = CalendarCheck;
            badgeColor = "text-gray-400";
            monetaryAmountColor = "text-gray-400";
            badgeLabel = "Planned";
    }
  
  return (
    <div className="w-72 rounded-lg bg-white p-4 shadow-xl border border-gray-300">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {task.taskName}
        </h3>
        <div className="flex items-center space-x-1">
          <BadgeIcon className={`w-6 h-6 ${badgeColor}`} />
          <span className={`text-sm font-medium ${badgeColor}`}>{badgeLabel}</span>
        </div>
      </div>

      <div className="mt-3">
        <div className={`text-center ${monetaryAmountColor} text-2xl font-mono tracking-wide`}>
          {monetaryAmountPrefix}${parseFloat(task.monetaryValue || 0).toFixed(2)}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-700 space-y-1">
        {task.plannedDate && <div><strong>Planned:</strong> {format(task.plannedDate,'dd-MMM-yyyy')}</div>}
        {task.completionDate && <div><strong>Completed:</strong> {format(task.completionDate,'dd-MMM-yyyy')}</div>}
        {task.reviewedDate && <div><strong>Reviewed:</strong> {format(task.reviewedDate,'dd-MMM-yyyy')} ({task.reviewerName})</div>}
      </div>
    </div>
  );
};

export default TaskTooltip;
