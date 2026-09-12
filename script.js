const ACCOUNTS_KEY = "todo-app-accounts";
const SESSION_KEY = "todo-app-current-user";
const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const todoCard = document.querySelector("#todo-card");
const authLayer = document.querySelector("#auth-layer");
const authForm = document.querySelector("#auth-form");
const usernameInput = document.querySelector("#username-input");
const passwordInput = document.querySelector("#password-input");
const authTitle = document.querySelector("#auth-title");
const authDescription = document.querySelector("#auth-description");
const authSubmit = document.querySelector("#auth-submit");
const authSwitchText = document.querySelector("#auth-switch-text");
const authSwitchButton = document.querySelector("#auth-switch-button");
const formMessage = document.querySelector("#form-message");
const currentUser = document.querySelector("#current-user");
const signOutButton = document.querySelector("#sign-out-button");

let isRegistering = false;
let activeUser = null;

function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

async function hashPassword(password, salt) {
  const content = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", content);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createSalt() {
  const values = crypto.getRandomValues(new Uint32Array(4));
  return [...values].map((value) => value.toString(16)).join("");
}

function saveTasks() {
  if (!activeUser) return;
  const accounts = getAccounts();
  if (!accounts[activeUser]) return;

  accounts[activeUser].tasks = [...taskList.querySelectorAll(".task-item")].map((item) => ({
    text: item.querySelector(".task-text").textContent,
    completed: item.classList.contains("completed"),
  }));
  saveAccounts(accounts);
}

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

function createTask(taskName, completed = false) {
  const item = document.createElement("li");
  item.className = "task-item";

  const toggleButton = document.createElement("button");
  toggleButton.className = "task-toggle";
  toggleButton.type = "button";
  toggleButton.setAttribute("aria-label", `${completed ? "取消完成" : "完成"}任务：${taskName}`);
  toggleButton.setAttribute("aria-pressed", String(completed));

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
    saveTasks();
    updateTaskSummary();
  });

  deleteButton.addEventListener("click", () => {
    item.remove();
    saveTasks();
    updateTaskSummary();
  });

  item.append(toggleButton, text, deleteButton);
  item.classList.toggle("completed", completed);
  taskList.append(item);
}

function renderTasks() {
  taskList.replaceChildren();
  const accounts = getAccounts();
  const tasks = accounts[activeUser]?.tasks || [];
  tasks.forEach((task) => createTask(task.text, task.completed));
  updateTaskSummary();
}

function showTodo(username) {
  activeUser = username;
  currentUser.textContent = getAccounts()[username]?.displayName || username;
  authLayer.hidden = true;
  todoCard.hidden = false;
  renderTasks();
  taskInput.focus();
}

function showAuth() {
  activeUser = null;
  todoCard.hidden = true;
  authLayer.hidden = false;
  authForm.reset();
  formMessage.textContent = "";
  usernameInput.focus();
}

function setAuthMode(registering) {
  isRegistering = registering;
  authTitle.textContent = registering ? "创建账号" : "欢迎回来";
  authDescription.textContent = registering ? "创建本地账号，开始管理你的任务。" : "登录后查看属于你的任务清单。";
  authSubmit.textContent = registering ? "注册并开始" : "登录";
  authSwitchText.textContent = registering ? "已经有账号？" : "还没有账号？";
  authSwitchButton.textContent = registering ? "返回登录" : "注册账号";
  passwordInput.autocomplete = registering ? "new-password" : "current-password";
  formMessage.textContent = "";
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

authSwitchButton.addEventListener("click", () => setAuthMode(!isRegistering));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const normalizedUsername = username.toLowerCase();

  if (username.length < 2) {
    formMessage.textContent = "用户名至少需要 2 个字符。";
    return;
  }

  if (password.length < 6) {
    formMessage.textContent = "密码至少需要 6 个字符。";
    return;
  }

  const accounts = getAccounts();
  if (isRegistering) {
    if (accounts[normalizedUsername]) {
      formMessage.textContent = "该用户名已经注册，请直接登录。";
      return;
    }

    const salt = createSalt();
    accounts[normalizedUsername] = {
      displayName: username,
      salt,
      passwordHash: await hashPassword(password, salt),
      tasks: [],
    };
    saveAccounts(accounts);
    localStorage.setItem(SESSION_KEY, normalizedUsername);
    showTodo(normalizedUsername);
    return;
  }

  const account = accounts[normalizedUsername];
  if (!account || account.passwordHash !== await hashPassword(password, account.salt)) {
    formMessage.textContent = "用户名或密码不正确。";
    return;
  }

  localStorage.setItem(SESSION_KEY, normalizedUsername);
  showTodo(normalizedUsername);
});

signOutButton.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  showAuth();
});

const savedUser = localStorage.getItem(SESSION_KEY);
if (savedUser && getAccounts()[savedUser]) {
  showTodo(savedUser);
} else {
  setAuthMode(false);
  showAuth();
}
