const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const addButton = document.getElementById("addButton");
const filterSelect = document.getElementById("filterSelect");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const formMessage = document.getElementById("formMessage");

const STORAGE_KEY = "smartTodoListTasks";
let tasks = loadTasks();
let editingId = null;

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    formMessage.textContent = "Could not save tasks in this browser.";
  }
}

function showMessage(message = "") {
  formMessage.textContent = message;
}

function addOrUpdateTask() {
  const title = taskInput.value.trim();
  if (!title) {
    showMessage("Please enter a task before adding it.");
    taskInput.focus();
    return;
  }

  if (editingId !== null) {
    const task = tasks.find(item => item.id === editingId);
    if (task) {
      task.title = title;
      task.priority = priorityInput.value;
    }
    editingId = null;
    addButton.textContent = "Add task";
  } else {
    tasks.unshift({
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      title,
      priority: priorityInput.value,
      completed: false,
      createdAt: new Date().toISOString()
    });
  }

  taskInput.value = "";
  priorityInput.value = "medium";
  showMessage("");
  saveTasks();
  renderTasks();
  taskInput.focus();
}

function toggleTask(id, completed) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  task.completed = completed;
  saveTasks();
  renderTasks();
}

function editTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  taskInput.value = task.title;
  priorityInput.value = task.priority;
  editingId = id;
  addButton.textContent = "Save changes";
  showMessage("Edit the task, then choose Save changes.");
  taskInput.focus();
}

function deleteTask(id) {
  tasks = tasks.filter(item => item.id !== id);
  if (editingId === id) {
    editingId = null;
    taskInput.value = "";
    addButton.textContent = "Add task";
    showMessage("");
  }
  saveTasks();
  renderTasks();
}

function createButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.className = className;
  button.addEventListener("click", onClick);
  return button;
}

function renderTasks() {
  taskList.replaceChildren();
  const filter = filterSelect.value;
  const visibleTasks = tasks.filter(task => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  visibleTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(task.completed);
    checkbox.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "pending" : "completed"}`);
    checkbox.addEventListener("change", () => toggleTask(task.id, checkbox.checked));

    const content = document.createElement("div");
    content.className = "task-content";

    const name = document.createElement("span");
    name.className = "task-name";
    name.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const priority = document.createElement("span");
    priority.className = `priority ${["high", "medium", "low"].includes(task.priority) ? task.priority : "medium"}`;
    priority.textContent = `${task.priority || "medium"} priority`;

    const status = document.createElement("span");
    status.textContent = task.completed ? "Completed" : "Pending";

    meta.append(priority, status);
    content.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(
      createButton("Edit", "edit-button", () => editTask(task.id)),
      createButton("Delete", "delete-button", () => deleteTask(task.id))
    );

    item.append(checkbox, content, actions);
    taskList.append(item);
  });

  const completed = tasks.filter(task => task.completed).length;
  document.getElementById("totalCount").textContent = tasks.length;
  document.getElementById("pendingCount").textContent = tasks.length - completed;
  document.getElementById("completedCount").textContent = completed;
  emptyMessage.hidden = visibleTasks.length > 0;
  emptyMessage.textContent = tasks.length === 0
    ? "No tasks yet. Add your first task above!"
    : "No tasks match this filter.";
}

addButton.addEventListener("click", addOrUpdateTask);
taskInput.addEventListener("keydown", event => {
  if (event.key === "Enter") addOrUpdateTask();
});
filterSelect.addEventListener("change", renderTasks);

renderTasks();
