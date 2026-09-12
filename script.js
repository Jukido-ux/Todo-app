const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");

function updateTaskSummary() {
  const tasks = taskList.querySelectorAll(".task-item");
  const remaining = taskList.querySelectorAll(".task-item:not(.completed)").length;

  emptyState.hidden = tasks.length > 0;

  if (tasks.length === 0) {
    taskCount.textContent = "还没有任务";
    return;
  }

  taskCount.textContent = `还剩 ${remaining} 项任务`;
}

function createTask(taskName) {
  const item = document.createElement("li");
  item.className = "task-item";

  const toggleButton = document.createElement("button");
  toggleButton.className = "task-toggle";
  toggleButton.type = "button";
  toggleButton.setAttribute("aria-label", `完成任务：${taskName}`);
  toggleButton.setAttribute("aria-pressed", "false");

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = taskName;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "×";
  deleteButton.setAttribute("aria-label", `删除任务：${taskName}`);

  toggleButton.addEventListener("click", () => {
    const isCompleted = item.classList.toggle("completed");
    toggleButton.setAttribute("aria-pressed", String(isCompleted));
    toggleButton.setAttribute(
      "aria-label",
      `${isCompleted ? "取消完成" : "完成"}任务：${taskName}`
    );
    updateTaskSummary();
  });

  deleteButton.addEventListener("click", () => {
    item.remove();
    updateTaskSummary();
  });

  item.append(toggleButton, text, deleteButton);
  taskList.append(item);
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const taskName = taskInput.value.trim();

  if (!taskName) {
    taskInput.focus();
    return;
  }

  createTask(taskName);
  taskInput.value = "";
  taskInput.focus();
  updateTaskSummary();
});

updateTaskSummary();
