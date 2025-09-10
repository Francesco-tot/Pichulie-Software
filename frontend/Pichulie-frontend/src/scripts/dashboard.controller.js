const token = localStorage.getItem("token");
if (!token) {
  // No está logueado → redirigir al login
  window.location.href = "index.html";
}

class TaskManager {
  constructor() {
    this.tasks = {
      todo: [],
      inprocess: [],
      finished: [],
    }

    this.trashedTasks = []
    this.currentView = "taskBoard"

    this.currentDate = new Date()
    this.loadTasks()
  }

  init() {
    this.bindEvents()
    this.updateDateDisplay()
    this.renderTasks()
  }

  // backend
  async loadTasks() {
    try {
      const res = await fetch("http://localhost:3000/api/task", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await res.json()

      this.tasks = {
        todo: data.tasks?.["to do"] || [],
        inprocess: data.tasks?.["in process"] || [],
        finished: data.tasks?.["finished"] || [],
      }

      this.renderTasks()
    } catch (err) {
      console.error("Error cargando tareas:", err)
    }
  }

  async saveTaskToBackend(task) {
    try {
      const res = await fetch("http://localhost:3000/api/task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(task),
      })
      return await res.json()
    } catch (err) {
      console.error("Error creando tarea:", err)
    }
  }

  //Ui methods
  bindEvents() {
    document.querySelector(".add-task-main").addEventListener("click", () => this.openModal())

    document.querySelector(".modal-close").addEventListener("click", () => this.closeModal())
    document.querySelector(".btn-cancel").addEventListener("click", () => this.closeModal())
    document.querySelector(".btn-save").addEventListener("click", () => this.saveTask())

    document.querySelector(".prev").addEventListener("click", () => this.changeDate(-1))
    document.querySelector(".next").addEventListener("click", () => this.changeDate(1))

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => this.handleNavigation(e))
    })

    document.querySelector(".modal-overlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal()
      }
    })
  }

  openModal() {
    const modal = document.getElementById("taskModal")
    const modalTitle = document.getElementById("modalTitle")
    const actionBtn = document.getElementById("taskActionBtn")

    modalTitle.textContent = "Create Task"
    actionBtn.textContent = "CREATE"

    modal.classList.add("active")
    document.getElementById("taskTitle").focus()
  }

  closeModal() {
    document.getElementById("taskModal").classList.remove("active")
    this.clearModalForm()
  }

  clearModalForm() {
    document.getElementById("taskTitle").value = ""
    document.getElementById("taskDescription").value = ""
    document.getElementById("taskTime").value = "12:00"
    document.getElementById("taskDate").value = new Date().toISOString().split("T")[0]
    document.getElementById("taskReminder").checked = false
  }

  async saveTask() {
    const title = document.getElementById("taskTitle").value.trim()
    const time = document.getElementById("taskTime").value
    const date = document.getElementById("taskDate").value
    const description = document.getElementById("taskDescription").value.trim()
    const reminder = document.getElementById("taskReminder").checked

    if (!title) {
      alert("Please enter a task title")
      return
    }

    const backendTask = {
      title,
      detail: description,
      status: "to do",
      task_date: date,
      remember: reminder,
    }

    await this.saveTaskToBackend(backendTask)
    await this.loadTasks()
    this.closeModal()
  }

  formatTime(time24) {
    if (!time24) return ""
    const [hours, minutes] = time24.split(":")
    const hour12 = hours % 12 || 12
    const ampm = hours >= 12 ? "PM" : "AM"
    return `${hour12}:${minutes} ${ampm}`
  }

  renderTasks() {
    Object.keys(this.tasks).forEach((column) => {
      const taskList = document.querySelector(`[data-column="${column}"]`)
      taskList.innerHTML = ""

      this.tasks[column].forEach((task) => {
        const taskCard = this.createTaskCard(task, column)
        taskList.appendChild(taskCard)
      })
    })
  }

  createTaskCard(task, column) {
    const card = document.createElement("div")
    card.className = "task-card"
    card.dataset.taskId = task._id || task.id
    card.dataset.column = column

    card.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
            </div>
            <div class="task-meta">
                ${task.remember ? '<span class="task-reminder">Remember</span>' : ""}
                ${task.time ? `<span class="task-time">${task.time}</span>` : ""}
                ${task.remember ? '<span class="task-check">🔔</span>' : ""}
            </div>
        `

    return card
  }

  changeDate(direction) {
    this.currentDate.setDate(this.currentDate.getDate() + direction)
    this.updateDateDisplay()
    this.updateHeaderDate()
  }

  updateDateDisplay() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    document.querySelector(".month").textContent = months[this.currentDate.getMonth()]
    document.querySelector(".year").textContent = this.currentDate.getFullYear()
    document.querySelector(".day").textContent = this.currentDate.getDate().toString().padStart(2, "0")
  }

  updateHeaderDate() {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const dayName = days[this.currentDate.getDay()]
    const isToday = this.isToday(this.currentDate)

    document.querySelector(".date-title").textContent = `${dayName}${isToday ? " - Today" : ""}`
  }

  isToday(date) {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  handleNavigation(e) {
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active")
    })

    e.currentTarget.classList.add("active")

    const text = e.currentTarget.textContent.trim()

    switch (text) {
      case "Search by date":
        this.handleSearchByDate()
        this.switchView("taskBoard")
        break
      case "See all tasks":
        this.showAllTasks()
        break
      case "Trash":
        this.showTrash()
        break
    }
  }

  handleSearchByDate() {
    const dateInput = prompt("Enter date (YYYY-MM-DD):")
    if (dateInput) {
      const newDate = new Date(dateInput)
      if (!isNaN(newDate)) {
        this.currentDate = newDate
        this.updateDateDisplay()
        this.updateHeaderDate()
      }
    }
  }

  showAllTasks() {
    this.switchView("allTasks")
    this.renderAllTasks()
  }

  showTrash() {
    this.switchView("trash")
    this.renderTrash()
  }

  switchView(viewName) {
    document.querySelectorAll(".content-view").forEach((view) => {
      view.classList.remove("active")
    })

    const viewMap = {
      taskBoard: "taskBoardView",
      allTasks: "allTasksView",
      trash: "trashView",
    }

    const targetView = document.getElementById(viewMap[viewName])
    if (targetView) {
      targetView.classList.add("active")
      this.currentView = viewName
    }
  }

  renderAllTasks() {
    const sections = ["todo", "inprocess", "finished"]

    sections.forEach((section) => {
      const container = document.querySelector(`[data-section="${section}"]`)
      container.innerHTML = ""

      this.tasks[section].forEach((task) => {
        const taskCard = this.createTaskCard(task, section)
        container.appendChild(taskCard)
      })
    })
  }

  renderTrash() {
    const trashContainer = document.getElementById("trashTasks")
    const emptyState = document.querySelector(".trash-empty-state")

    if (this.trashedTasks.length === 0) {
      emptyState.style.display = "block"
      trashContainer.style.display = "none"
    } else {
      emptyState.style.display = "none"
      trashContainer.style.display = "grid"
      trashContainer.innerHTML = ""

      this.trashedTasks.forEach((task) => {
        const taskCard = this.createTaskCard(task, "trash")
        trashContainer.appendChild(taskCard)
      })
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const taskManager = new TaskManager()
  taskManager.init()
})

function enableDragAndDrop() {
  console.log("Drag and drop functionality can be added here")
}

export default TaskManager