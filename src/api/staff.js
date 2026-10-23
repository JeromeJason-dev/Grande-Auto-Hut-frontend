import { api } from "./client";

/** Active staff + admins with workload counts (open_tickets, open_tasks, overdue_tasks, done_tasks). */
export async function listStaff() {
  const { data } = await api.get("/staff/");
  return data;
}

/**
 * Admins see everyone's tasks; staff only ever get their own.
 * params: { assignee (user id | "me"), status ("open" | "todo" | "in_progress" | "done"), ticket, q, page, page_size }
 */
export async function listTasks(params) {
  const { data } = await api.get("/tasks/", { params });
  return data;
}

export async function createTask(payload) {
  const { data } = await api.post("/tasks/", payload);
  return data;
}

export async function updateTask(id, changes) {
  const { data } = await api.patch(`/tasks/${id}/`, changes);
  return data;
}

export async function deleteTask(id) {
  await api.delete(`/tasks/${id}/`);
}

/** Admins only: create a staff/admin account. { first_name, last_name, email, phone_number, role, password } */
export async function createStaff(payload) {
  const { data } = await api.post("/staff/", payload);
  return data;
}

/** Admins only: edit a team member. Include `password` to reset it; leave it out to keep it. */
export async function updateStaff(id, changes) {
  const { data } = await api.patch(`/staff/${id}/`, changes);
  return data;
}

export async function deleteStaff(id, reassignTo) {
  const { data } = await api.delete(`/staff/${id}/`, { params: reassignTo ? { reassign_to: reassignTo } : undefined });
  return data;
}