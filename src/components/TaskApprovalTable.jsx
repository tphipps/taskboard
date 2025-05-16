import React, { useEffect, useState } from "react";
import { Calendar, CalendarCheck, CalendarRange } from "lucide-react";
import { format, parseISO } from "date-fns";

import PageHeader from "./PageHeader";
import { getPendingTasks, approveTask, rejectTask } from "../lib/api";

import emptyStateImage from "../assets/images/empty-state.png";


export default function TaskApprovalTable({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [approvalStatus, setApprovalStatus] = useState({});
 
  // getTasks must be declared before useEffect references it.
  // In JavaScript, functions declared with const are not hoisted, 
  // so if declared after useEffect, then useEffect sees loadTasks
  // sees loadTasks as undefined on the first pass and re-runs every render.
  const getTasks = async () => {
    const result = await getPendingTasks().then(setTasks).catch(console);
  }
  
  useEffect(() => {
    getTasks();
  }, []);

  const handleApprove = async (taskId) => {
    setApprovalStatus((prev) => ({ ...prev, [taskId]: "loading" }));
    try {
      await approveTask(taskId, user.id);
      setApprovalStatus((prev) => ({ ...prev, [taskId]: "approved" }));
    } catch (err) {
      console.error(err);
      setApprovalStatus((prev) => ({ ...prev, [taskId]: "error" }));
    }
  };


  const handleReject = async (taskId) => {
    setApprovalStatus((prev) => ({ ...prev, [taskId]: "loading" }));
    try {
      await rejectTask(taskId, user.id);
      setApprovalStatus((prev) => ({ ...prev, [taskId]: "rejected" }));
    } catch (err) {
      console.error(err);
      setApprovalStatus((prev) => ({ ...prev, [taskId]: "error" }));
    }
  };

  const renderTaskTypeIcon = (type) => {
    const iconProps = { size: 20, strokeWidth: 2 };
    switch (type) {
      case "D":
        return (
          <div title="Daily">
            <Calendar {...iconProps} />
          </div>
        );
      case "W":
        return (
          <div title="Weekly">
            <CalendarCheck {...iconProps} />
          </div>
        );
      case "M":
        return (
          <div title="Monthly">
            <CalendarRange {...iconProps} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4">

    <PageHeader
        pageTitle="Task Approval"
        user={user}
        onLogout={onLogout}
        onRefresh={getTasks}
    />

      {/* Table */}
        <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
            <thead>
                <tr>
                <th>Person</th>
                <th>Task Type</th>
                <th>Task</th>
                <th>Planned Date</th>
                <th>Completed Date</th>
                <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {tasks.map((task) => (
                <tr key={task.id}>
                    <td>
                    <div className="flex items-center gap-3">
                        <div className="avatar">
                        <div className="mask mask-squircle w-12 h-12">
                            <img src={task.avatar_link} alt="{task.first_name} {task.last_name}" />
                        </div>
                        </div>
                        <div>
                        <div className="text-sm">{task.first_name}</div>
                        <div className="text-sm">{task.last_name}</div>
                        </div>
                    </div>
                    </td>
                    <td>
                        <div className="flex gap-2">
                            {renderTaskTypeIcon(task.type)} {{'D':'Daily', 'W':'Weekly', 'M':'Monthly'}[task.type]}
                        </div>
                    </td>
                    <td>{task.task_name}</td>
                    <td>{format(new Date(parseISO(task.planned_date)), "d-MMM-yy")}</td>
                    <td>{format(new Date(parseISO(task.completion_date)), "d-MMM-yy")}</td>
                    <td>
                        {approvalStatus[task.id] === "loading" ? (
                            <span className="loading loading-dots loading-lg"></span>
                        ) : approvalStatus[task.id] === "approved" ? (
                            <span className="text-success font-semibold">Approved</span>
                        ) : approvalStatus[task.id] === "rejected" ? (
                            <span className="text-error font-semibold">Rejected</span>
                        ) : (
                            <div className="flex gap-2">
                            <button className="btn btn-xs btn-success" onClick={() => handleApprove(task.id)}>
                                Approve
                            </button>
                            <button className="btn btn-xs btn-error" onClick={() => handleReject(task.id)}>
                                Reject
                            </button>
                            </div>
                        )}
                    </td>
                </tr>
                ))}
                {tasks.length === 0 && (
                    <tr>
                        <td colSpan="6">
                            <div className="w-full flex justify-center">
                            <div className="flex flex-col items-center text-center py-10 text-gray-500 text-sm">
                                <img
                                src={emptyStateImage}
                                alt="No tasks"
                                style={{ width: "150px", height: "auto" }}
                                className="mb-4"
                                />
                                <p>No tasks pending review.</p>
                            </div>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
      </div>
    </div>
  );
}
