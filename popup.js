document.addEventListener("DOMContentLoaded", () => {

  function requestNotificationPermission() {
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted.");
        } else {
          console.log("Notification permission denied.");
        }
      });
    }
  }
  
  const createTaskBtn = document.getElementById("createTaskBtn");
  const taskForm = document.getElementById("taskForm");
  const taskList = document.getElementById("taskList");
  const taskListLabel = document.getElementById("tlN");
  const taskCreatedLabel = document.getElementById("tasksCreated");
  const syncGoogleBtn = document.getElementById("syncGoogleBtn");
  let numTasks = 0;
  
  requestNotificationPermission();

  function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  function sendNotification(task) {
    if (Notification.permission === "granted") {
      new Notification("Task Reminder", {
        body: `Task "${task.name}" is due soon!`,
        icon: "./images/alarm.png", 
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Task Reminder", {
            body: `Task "${task.name}" is due soon!`,
            icon: "./images/alarm.png", 
          });
        }
      });
    }
  }
  
  function checkTasksForNotifications(tasks) {
    const now = new Date();
    tasks.forEach((task) => {
      const dueDate = new Date(task.dueDate);
      const timeLeft = dueDate - now;
  
      if (
        isSameDay(now, dueDate) &&
        timeLeft > 0 &&
        timeLeft <= 4 * 60 * 60 * 1000 &&
        !task.notified
      ) {
        sendNotification(task);
        task.notified = true; 
        saveTask(task, () => console.log(`Notification sent for task: ${task.name}`));
      }
    });
  }
  
  const dbName = "TaskManagerDB";
  const storeName = "tasks";
  let db;
  
  const requestIDB = indexedDB.open(dbName, 1);
  
  requestIDB.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
      }
  };
  
  requestIDB.onsuccess = (event) => {
      db = event.target.result;
      renderTasks();
  };
  
  requestIDB.onerror = (event) => {
      console.error("Database error:", event.target.error);
  };
  
  createTaskBtn.addEventListener("click", () => {
      taskForm.style.display = taskForm.style.display === "block" ? "none" : "block";
  });
  
  // When a task is created, save it locally then sync to Google Calendar
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
  
    const taskName = document.getElementById("taskName").value;
    const taskDescription = document.getElementById("taskDescription").value;
    const taskDueDate = document.getElementById("taskDueDate").value;
    
    const selectedDueDate = new Date(taskDueDate);
    const now = new Date();
  
    if (selectedDueDate <= now) {
        alert("Please select a date and time in the future.");
        return;
    }
  
    const newTask = {
        id: Date.now(),
        name: taskName,
        description: taskDescription,
        dueDate: selectedDueDate,
        completed: false,
        notified: false,
        source: "manual",
        calendarEventId: null  // This will store the Google Calendar event ID
    };
    
    saveTask(newTask, () => {
      renderTasks();
      // After saving locally, add the task to Google Calendar.
      addTaskEvent(newTask);
    });
    taskForm.reset();
    taskForm.style.display = "none";
  
    numTasks++;
    console.log(numTasks);
    taskCreatedLabel.textContent = `Tasks Created: ${numTasks}`;
    taskCreatedLabel.style.display = "none";
  });
  
  // Sync Google tasks button (if applicable)
  if(syncGoogleBtn) {
    syncGoogleBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "syncGoogleTasks" }, (response) => {
        if(response && response.success) {
          console.log("Google tasks synced successfully.");
          renderTasks();
        } else {
          console.error("Error syncing tasks:", response && response.error);
        }
      });
    });
  }
  
  taskCreatedLabel.style.display = "none";
  
  function isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  
  let sortOrder = "asc";
  
  const sortButton = document.getElementById("sortButton");
  sortButton.addEventListener("click", () => {
    sortOrder = sortOrder === "asc" ? "desc" : "asc"; 
    renderTasks();
    sortButton.textContent = `Sort by Due Date (${sortOrder === "asc" ? "Closest First" : "Furthest First"})`;
  });
  
  // API Integration: Google Calendar syncing functions
  function addTaskEvent(task) {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    // Call the API endpoint to add the task event
    fetch('https://a1dos-login.onrender.com/add-task-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token,
        taskTitle: task.name,
        taskDueDate: task.dueDate,
        taskDescription: task.description
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Save the returned event ID to the task object
        task.calendarEventId = data.eventId;
        console.log("Task event added to calendar, event ID:", data.eventId);
        // Optionally update the task in IndexedDB with the new calendarEventId here.
      } else {
        console.error("Failed to add task event:", data.message);
      }
    })
    .catch(err => console.error("Error adding task event:", err));
  }

  function deleteTaskEvent(task, callback) {
    const token = localStorage.getItem("authToken");
    if (!token || !task.calendarEventId) {
      callback();
      return;
    }
    fetch('https://a1dos-login.onrender.com/delete-task-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, eventId: task.calendarEventId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log("Task event removed from calendar.");
      } else {
        console.error("Failed to delete task event:", data.message);
      }
      callback();
    })
    .catch(err => {
      console.error("Error deleting task event:", err);
      callback();
    });
  }

  // New function: Delete task and its calendar event if present
  function deleteTaskWithCalendar(task, callback) {
    if (task.calendarEventId) {
      deleteTaskEvent(task, () => {
        deleteTask(task.id, callback);
      });
    } else {
      deleteTask(task.id, callback);
    }
  }
  
  // Render tasks from IndexedDB
  function renderTasks() {
    taskList.innerHTML = "";
    fetchTasks((tasks) => {
  
      tasks.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  
      checkTasksForNotifications(tasks);
      tasks.forEach((task) => {
        taskCreatedLabel.textContent = `Tasks Created: ${numTasks}`;
  
        const li = document.createElement("li");
        li.className = `task ${isUrgent(task.dueDate) ? 'urgent' : ''}`;
  
        const header = document.createElement("div");
        header.className = "task-header";
  
        const title = document.createElement("h3");
        title.textContent = task.name;
        title.style.fontFamily = "Lexend Deca";
  
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const isToday = isDueToday(dueDate);
        const timeUntilDue = dueDate - now;
        const isLessThan12Hours = timeUntilDue > 0 && timeUntilDue <= 12 * 60 * 60 * 1000;
  
        if (isToday) {
          title.style.color = isLessThan12Hours ? "#692a2a" : "#e57373";
          title.style.marginTop = "-15.5px";
  
          const urgencyIndicator = document.createElement("span");
          urgencyIndicator.textContent = isLessThan12Hours ? "!!" : "!";
          urgencyIndicator.style.color = isLessThan12Hours ? "#692a2a" : "#e57373";
          urgencyIndicator.style.fontWeight = "bold";
          urgencyIndicator.style.marginLeft = "230px";
          urgencyIndicator.style.fontSize = "1.4em";
  
          header.appendChild(urgencyIndicator);
        }
  
        const buttons = document.createElement("div");
        buttons.className = "task-buttons";
  
        const completeBtn = document.createElement("img");
        completeBtn.src = "/images/Task-gray.png";
        completeBtn.alt = "Complete";
        completeBtn.style.width = "20px";
        completeBtn.style.height = "20px";
        completeBtn.addEventListener("click", () => {
          task.completed = !task.completed;
          title.style.color = "#38a839";
          delay(2000)
          .then(() => {
              deleteTaskWithCalendar(task, renderTasks);
          });
        });
  
        const editBtn = document.createElement("img");
        editBtn.src = "/images/Edit-gray.png";
        editBtn.alt = "Edit";
        editBtn.style.width = "20px";
        editBtn.style.height = "20px";
        editBtn.addEventListener("click", () => editTask(task));
  
        const deleteBtn = document.createElement("img");
        deleteBtn.src = "/images/delete.png";
        deleteBtn.alt = "Delete";
        deleteBtn.style.width = "20px";
        deleteBtn.style.height = "20px";
        deleteBtn.addEventListener("click", () => deleteTaskWithCalendar(task, renderTasks));
  
        buttons.append(completeBtn, editBtn, deleteBtn);
        header.append(title, buttons);
  
        const content = document.createElement("div");
        content.className = "task-content";
        content.innerHTML = `<p>${task.description}</p><p>Due: ${new Date(task.dueDate).toLocaleString()}</p>`;
  
        li.append(header, content);
  
        li.addEventListener("click", () => {
          li.classList.toggle("open");
        });
  
        taskList.appendChild(li);
  
        if (isToday) {
          const timeMessageElement = document.createElement("p");
          timeMessageElement.style.fontSize = "0.9em";
          timeMessageElement.style.color = "#e57373";
  
          function updateCountdown() {
            const remainingTime = dueDate - new Date();
            if (remainingTime <= 0) {
              timeMessageElement.textContent = "Task is overdue!";
              clearInterval(countdownInterval);
            } else {
              const hoursLeft = Math.floor(remainingTime / (1000 * 60 * 60));
              const minutesLeft = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
              const secondsLeft = Math.floor((remainingTime % (1000 * 60)) / 1000);
              let timeMessage = `Due soon! Due in ${hoursLeft}:${minutesLeft}:${secondsLeft}!`;
              if (hoursLeft === 0) {
                timeMessage = `Due soon! Due in ${minutesLeft}:${secondsLeft}!`;
              }
              timeMessageElement.textContent = timeMessage;
            }
          }
          
          header.appendChild(timeMessageElement);
          updateCountdown();
          const countdownInterval = setInterval(updateCountdown, 1000);
        }
  
        if (!task.dueDate || !task.name) {
          taskListLabel.style.display = "block";
        } else {
          taskListLabel.style.display = "none";
        }
      });
    });
  }
  
  function isDueToday(dueDate) {
    const today = new Date();
    return (
      dueDate.getFullYear() === today.getFullYear() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getDate() === today.getDate()
    );
  }
  
  function saveTask(task, callback) {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.put(task);
    taskListLabel.style.display = "none";
    transaction.oncomplete = () => callback();
    transaction.onerror = (event) => console.error("Save task error:", event.target.error);
  }
  
  function fetchTasks(callback) {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    taskCreatedLabel.textContent = `Tasks Created: ${numTasks}`;
    request.onsuccess = () => callback(request.result);
    request.onerror = (event) => console.error("Fetch tasks error:", event.target.error);
  }
  
  function deleteTask(taskId, callback) {
    if (!(numTasks === 0)) {
      numTasks -= 1;
      console.log(numTasks);
    }
    taskCreatedLabel.textContent = `Tasks Created: ${numTasks}`;
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    if (numTasks === 0 || numTasks === undefined || numTasks === null) {
      taskListLabel.style.display = "block";
    }
    store.delete(taskId);
    transaction.oncomplete = () => callback();
    transaction.onerror = (event) => console.error("Delete task error:", event.target.error);
  }
  
  function editTask(task) {
    document.getElementById("taskName").value = task.name;
    document.getElementById("taskDescription").value = task.description;
  
    const taskDueDate = new Date(task.dueDate);
    const localISODate = new Date(taskDueDate.getTime() - taskDueDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, -1);
    document.getElementById("taskDueDate").value = localISODate;
    deleteTask(task.id, () => {
      taskForm.style.display = "block";
    });
  }
  
  function isUrgent(dueDate) {
    const today = new Date().setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate).setHours(0, 0, 0, 0);
    return today === taskDate;
  }
});
