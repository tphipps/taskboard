import React from "react";
import { Award } from "lucide-react";

const TaskTooltip = ({ task }) => {
  const reviewed = !!task.reviewedDate;
  const badgeColor = reviewed ? "text-yellow-400" : "text-gray-400";
  const badgeLabel = reviewed ? "Reviewed" : "Pending Review";

  return (
    <div className="w-72 rounded-lg bg-white p-4 shadow-xl border border-gray-300">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {task.taskName}
        </h3>
        <div className="flex items-center space-x-1">
          <Award className={`w-6 h-6 ${badgeColor}`} />
          <span className={`text-sm font-medium ${badgeColor}`}>{badgeLabel}</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-center text-green-600 text-2xl font-mono tracking-wide">
          ${parseFloat(task.monetaryValue || 0).toFixed(2)}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-700 space-y-1">
        <div><strong>Completed:</strong> {task.completedDate || "—"}</div>
        <div><strong>Reviewed:</strong> {task.reviewedDate || "—"}</div>
      </div>
    </div>
  );
};

export default TaskTooltip;