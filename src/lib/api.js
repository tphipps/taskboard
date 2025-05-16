const API_BASE = import.meta.env.VITE_API_BASE_URL;

// These APIs are used by TaskBoard
export async function updateTaskPlannedDate(taskId, date) {
    await fetch(`${API_BASE}/api.php?mode=planTask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        plannedDate: (date) ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null
      })
    });
  }

 export async function fetchTasks(childId, month) {
    const res = await fetch(`${API_BASE}/api.php?mode=getTasks&assignee=${encodeURIComponent(childId)}&month=${encodeURIComponent(month)}`);
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
  }

  export async function updateTaskCompletion(taskId, date) {
      await fetch(`${API_BASE}/api.php?mode=completeTask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          completionDate: date ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null
        })
      });
    }

export async function fetchUsers() {
    const res = await fetch(`${API_BASE}/api.php?mode=getUsers`);
    if (!res.ok) throw new Error("Failed to load users");
    return res.json();   
}

export async function verifyPin(userId, pin) {
    const res = await fetch(`${API_BASE}/api.php?mode=verifyPin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, pin: pin })
    });
    return res; // Returning the object not the object.json()
  }

  export async function changePin(userId, currentPin, newPin) {
    const res = await fetch(`${API_BASE}/api.php?mode=changePin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, current_pin: currentPin, new_pin: newPin })
    });
    return res; // Returning the object not the object.json()
  }

// These APIs are Used by TaskApproval Table
export async function getPendingTasks() {
  const res = await fetch(`${API_BASE}/api.php?mode=getTasksPendingReview`);
  if (!res.ok) throw new Error("Failed to load tasks");
  return res.json();
}

export async function approveTask(taskId, reviewerId) {
  const res = await fetch(`${API_BASE}/api.php?mode=approveTask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId, reviewer_id: reviewerId })
  });
  if (!res.ok) throw new Error("Failed to approve task");
}

export async function rejectTask(taskId) {
  const res = await fetch(`${API_BASE}/api.php?mode=rejectTask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId })
  });
  if (!res.ok) throw new Error("Failed to reject task");
}
