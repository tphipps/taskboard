# Taskboard App

A single-page React application for managing and tracking kids' chores on a monthly calendar. It supports drag-and-drop scheduling, PIN-protected child logins, completion tracking, and light/dark theming.

---

## 🧱 Architecture

- **Frontend:** React + Tailwind CSS with DaisyUI
- **Backend:** PHP API endpoints with a MySQL database
- **Drag and Drop:** @dnd-kit/core
- **Styling:** TailwindCSS, DaisyUI theme toggle
- **Date Management:** date-fns

---

## 🗂 Task Model

Each task object contains:

| Field          | Description                                 |
|----------------|---------------------------------------------|
| id             | Unique identifier                           |
| taskName       | Human-readable task name                    |
| type           | "D" (daily), "W" (weekly), "M" (monthly)    |
| startDate      | Original date created                       |
| plannedDate    | Assigned date (via drag/drop)               |
| completionDate | Date marked complete (via checkbox)         |
| reviewedDate   | Optional date when task was reviewed        |

---

## 🧩 Features

### ✅ Login and Auth

- Child logs in via name selection and PIN entry
- Theme toggle available during login
- PIN input via keyboard and on-screen keypad

### ✅ Calendar

- Displays days grouped by week
- Shows current day with a yellow star
- Drag/drop for weekly/monthly tasks to assign a plannedDate
- Daily tasks are fixed and non-draggable
- Completed and reviewed tasks are styled appropriately

### ✅ Chips

- Rendered with DaisyUI badge styles
- Stackable for unplanned tasks (badge counter)
- Checkbox to mark tasks complete (or incomplete again)
- Planned chips are draggable within current week/month
- Drag overlay is disabled for planned chips

### ✅ API Endpoints

- api.php: fetch all tasks
- plan.php: update plannedDate
- complete.php: update completionDate
- verify_pin.php: verify PIN for child login
- get_users.php: get list of users with avatars

---

## 🎨 Theming

- Uses DaisyUI themes (light, dark)
- Toggle is always visible in top-right
- Theme is applied via data-theme on <html>
- Uses theme-change JS utility to persist theme switch across views

---

## 🧼 Cleanup Notes

- Context menu logic and props fully removed
- TaskChip handles all rendering for both stack and calendar chips
- handleDrop() distinguishes between drag and checkbox updates
- Only planned, incomplete tasks are draggable within limits

---

## 🛠 Development Notes

- Planned chips re-render based on plannedDate
- Chip draggability depends on current week/month and task type
- Calendar view recomputes stacks based on real-time drag state
- Ghost overlays only appear for unplanned tasks

---

## 📋 Future Enhancements

- Review/approve flow for completed tasks
- Persistent PIN storage
- Visual animations for task placement
- Multi-month calendar navigation

---

## 👤 Onboarding Developers

1. Start in TaskBoard.jsx (main component)
2. Understand TaskChip for rendering logic
3. Look at DroppableDay for calendar cell logic
4. api object at the top handles all server communication

---

## 🚀 Setup

bash
npm install
npm run dev
