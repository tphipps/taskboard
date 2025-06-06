const API_BASE = import.meta.env.VITE_API_BASE_URL;
import { getTaskDisposition } from "../lib/taskDisposition"

// These APIs are used by TaskBoard
export async function updateTaskPlannedDate(taskId, date) {
    await fetch(`${API_BASE}/api.php?mode=planTask`, {
      method: "POST",
      credentials: 'include', // Important for sending cookies
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        plannedDate: (date) ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null
      })
    });
  }

 // Fetch Tasks fetches both the tasks for a given month and also the monthly targets
 export async function fetchTasks(childId, month) {
    const res = await fetch(`${API_BASE}/api.php?mode=getTasks&assignee=${encodeURIComponent(childId)}&month=${encodeURIComponent(month)}`,{
      method: "GET",
      credentials: 'include', // Important for sending cookies
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const data = await res.json();
    let tasks = data.tasks.map((t) => ({
      id: t.id,
      type: t.type,
      taskName: t.task_name,
      startDate: t.start_date,
      completionDate: t.completion_date,
      reviewedDate: t.reviewed_date,
      plannedDate: t.planned_date,
      monetaryValue: t.monetary_value,
      reviewerName: t.reviewer_first_name + ' ' + t.reviewer_last_name,
      reviewedDate: t.reviewed_date
    }));

    // getTaskDisposition relies on the resulting variable names in the map above, so have
    // to calculate it as a separate map and not as part of the variable renaming map  
    let tasksWithDisposition = tasks.map((t) => ({
      ...t,
      disposition: getTaskDisposition(t)
    }))

    let missedTaskAmount = 0;
    tasksWithDisposition.forEach(a => {
      if (a.disposition === 'Missed') {
        missedTaskAmount += Number(a.monetaryValue || 0);
      }
    });

    return({monthlyTargetData: {targetAmount: data.month_data.target_amount,
                                achievedAmount: data.month_data.achieved_amount,
                                missedAmount: missedTaskAmount},
            tasks: tasksWithDisposition
    
    })
  }

  export async function updateTaskCompletion(taskId, date) {
      await fetch(`${API_BASE}/api.php?mode=completeTask`, {
        method: "POST",
        credentials: 'include', // Important for sending cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          completionDate: date ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null
        })
      });
    }

// These APIs are used by LoginBox and related authentication code
export async function fetchUsers() {
    const res = await fetch(`${API_BASE}/api.php?mode=getUsers`);
    if (!res.ok) throw new Error("Failed to load users");
    return res.json();   
}

export async function verifyPin(userId, pin) {
    const res = await fetch(`${API_BASE}/api.php?mode=verifyPin`, {
      method: "POST",
      credentials: 'include', // Important for sending cookies
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, pin: pin })
    });
    return res; // Returning the object *not object.json()* so the HTTP status can be checked
  }

  export async function changePin(userId, currentPin, newPin) {
    const res = await fetch(`${API_BASE}/api.php?mode=changePin`, {
      method: "POST",
      credentials: 'include', // Important for sending cookies  
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, current_pin: currentPin, new_pin: newPin })
    });
    return res; // Returning the object *not object.json()* so the HTTP status can be checked
  }

  export async function logout() {
    const res = await fetch(`${API_BASE}/api.php?mode=logout`, {
      method: "GET",
      credentials: 'include', // Important for sending cookies
      headers: { "Content-Type": "application/json" }
    });
    return res; // Returning the object *not object.json()* so the HTTP status can be checked
  }

// These APIs are Used by TaskApproval Table
export async function getPendingTasks() {
  const res = await fetch(`${API_BASE}/api.php?mode=getTasksPendingReview`, {
    method: "GET",
    credentials: 'include', // Important for sending cookies
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to load tasks");
  return res.json();
}

export async function approveTask(taskId, reviewerId) {
  const res = await fetch(`${API_BASE}/api.php?mode=approveTask`, {
    method: "POST",
    credentials: 'include', // Important for sending cookies
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId, reviewer_id: reviewerId })
  });
  if (!res.ok) throw new Error("Failed to approve task");
}

export async function rejectTask(taskId) {
  const res = await fetch(`${API_BASE}/api.php?mode=rejectTask`, {
    method: "POST",
    credentials: 'include', // Important for sending cookies
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId })
  });
  if (!res.ok) throw new Error("Failed to reject task");
}
