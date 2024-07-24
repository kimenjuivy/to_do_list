let tasks = [];
let categories = ['Personal', 'Work', 'Shopping', 'Health', 'Education', 'Finance'];
let tags = [];
let currentView = 'all';
let isDarkMode = false;
let userId = null;

const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const categoryList = document.getElementById('category-list');
const tagList = document.getElementById('tag-list');
const categorySelect = document.getElementById('category-select');
const newCategoryInput = document.getElementById('new-category');
const newTagInput = document.getElementById('new-tag');
const addCategoryBtn = document.getElementById('add-category');
const addTagBtn = document.getElementById('add-tag');
const searchInput = document.getElementById('search-input');
const searchFilter = document.getElementById('search-filter');
const viewOptions = document.querySelectorAll('input[name="view"]');
const viewToggleBtn = document.getElementById('view-toggle');
const clearCompletedBtn = document.getElementById('clear-completed');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const voiceInputBtn = document.getElementById('voice-input');
const statsDisplay = document.getElementById('stats-display');
const logoutButton = document.getElementById('logout-button');

async function init() {
    userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'index.html';
        return;
    }

    isDarkMode = localStorage.getItem('darkMode') === 'true';

    await fetchTasks();
    await fetchCategories();
    await fetchTags();

    generateCalendar(new Date().getFullYear(), new Date().getMonth() + 1);
    renderCategories();
    renderTags();
    renderTasks();
    setupEventListeners();
    updateDarkMode();
    updateStats();
    setupRecurringTasksCheck();
}

async function fetchTasks() {
    try {
        const response = await fetch(`http://localhost:3001/tasks/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        tasks = await response.json();
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

async function saveTasks() {
    try {
        const response = await fetch(`http://localhost:3001/tasks/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tasks),
        });
        if (!response.ok) throw new Error('Failed to save tasks');
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
}

async function fetchCategories() {
    try {
        const response = await fetch(`http://localhost:3001/categories/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const fetchedCategories = await response.json();
        categories = [...new Set([...categories, ...fetchedCategories])];
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function saveCategories() {
    try {
        const response = await fetch(`http://localhost:3001/categories/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(categories),
        });
        if (!response.ok) throw new Error('Failed to save categories');
    } catch (error) {
        console.error('Error saving categories:', error);
    }
}

async function fetchTags() {
    try {
        const response = await fetch(`http://localhost:3001/tags/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch tags');
        tags = await response.json();
    } catch (error) {
        console.error('Error fetching tags:', error);
    }
}

async function saveTags() {
    try {
        const response = await fetch(`http://localhost:3001/tags/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tags),
        });
        if (!response.ok) throw new Error('Failed to save tags');
    } catch (error) {
        console.error('Error saving tags:', error);
    }
}

function logout() {
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

async function addTask(event) {
    event.preventDefault();
    const taskInput = document.getElementById('task-input');
    const dueDate = document.getElementById('due-date');
    const priority = document.getElementById('priority');
    const category = document.getElementById('category-select');
    const tagsInput = document.getElementById('tags-input');
    const repeatSelect = document.getElementById('repeat-select');
    const attachmentInput = document.getElementById('attachment-input');

    const task = {
        id: Date.now(),
        text: taskInput.value,
        completed: false,
        dueDate: dueDate.value,
        priority: priority.value,
        category: category.value,
        tags: tagsInput.value.split(',').map(tag => tag.trim()),
        repeat: repeatSelect.value,
        attachments: Array.from(attachmentInput.files).map(file => file.name),
        subtasks: [],
        progress: 0
    };

    tasks.push(task);
    await saveTasks();
    renderTasks();
    scheduleNotification(task);
    taskForm.reset();
    updateStats();
}

function renderTasks() {
    taskList.innerHTML = '';
    const filteredTasks = filterTasks(tasks);
    
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });

    dragula([taskList]);
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.classList.add('task-item');
    taskElement.classList.add(`priority-${task.priority}`);
    if (task.completed) taskElement.classList.add('completed');
    
    taskElement.innerHTML = `
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-text">${task.text}</span>
        <span>Due: ${task.dueDate}</span>
        <span>Priority: ${task.priority}</span>
        <span>Category: ${task.category}</span>
        <span>Tags: ${task.tags.join(', ')}</span>
        <span>Repeat: ${task.repeat}</span>
        <span>Attachments: ${task.attachments.join(', ')}</span>
        <progress value="${task.progress}" max="100"></progress>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
        <button class="share-btn">Share</button>
        <button class="add-subtask-btn">Add Subtask</button>
    `;

    const checkbox = taskElement.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

    const editBtn = taskElement.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => editTask(task.id));

    const deleteBtn = taskElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    const shareBtn = taskElement.querySelector('.share-btn');
    shareBtn.addEventListener('click', () => shareTask(task));

    const addSubtaskBtn = taskElement.querySelector('.add-subtask-btn');
    addSubtaskBtn.addEventListener('click', () => addSubtask(task.id));

    const progressBar = taskElement.querySelector('progress');
    progressBar.addEventListener('click', (e) => updateTaskProgress(task.id, e));

    if (task.subtasks.length > 0) {
        const subtasksList = document.createElement('ul');
        task.subtasks.forEach(subtask => {
            const subtaskItem = document.createElement('li');
            subtaskItem.innerHTML = `
                <input type="checkbox" ${subtask.completed ? 'checked' : ''}>
                <span>${subtask.text}</span>
            `;
            subtaskItem.querySelector('input').addEventListener('change', () => toggleSubtaskCompletion(task.id, subtask.id));
            subtasksList.appendChild(subtaskItem);
        });
        taskElement.appendChild(subtasksList);
    }

    return taskElement;
}

async function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    task.completed = !task.completed;
    await saveTasks();
    renderTasks();
    updateStats();
}

async function editTask(id) {
    const task = tasks.find(t => t.id === id);
    const newText = prompt('Edit task:', task.text);
    if (newText !== null) {
        task.text = newText;
        await saveTasks();
        renderTasks();
        updateStats();
    }
}

async function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    await saveTasks();
    renderTasks();
    updateStats();
}

function shareTask(task) {
    if (navigator.share) {
        navigator.share({
            title: 'Shared Task',
            text: `Task: ${task.text}\nDue Date: ${task.dueDate}\nPriority: ${task.priority}`
        }).then(() => {
            console.log('Task shared successfully');
        }).catch((error) => {
            console.log('Error sharing task:', error);
        });
    } else {
        alert(`Task Details:\nTask: ${task.text}\nDue Date: ${task.dueDate}\nPriority: ${task.priority}`);
    }
}

async function addSubtask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const subtaskText = prompt('Enter subtask:');
    if (subtaskText) {
        task.subtasks.push({
            id: Date.now(),
            text: subtaskText,
            completed: false
        });
        await saveTasks();
        renderTasks();
    }
}

async function toggleSubtaskCompletion(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    subtask.completed = !subtask.completed;
    await saveTasks();
    renderTasks();
    updateStats();
}

async function updateTaskProgress(taskId, event) {
    const task = tasks.find(t => t.id === taskId);
    const progressBar = event.target;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const progressPercentage = (clickPosition / rect.width) * 100;
    task.progress = Math.round(progressPercentage);
    await saveTasks();
    renderTasks();
    updateStats();
}

function filterTasks(tasksToFilter) {
    const searchTerm = searchInput.value.toLowerCase();
    const filterType = searchFilter.value;
    
    return tasksToFilter.filter(task => {
        const matchesSearch = (() => {
            switch (filterType) {
                case 'text':
                    return task.text.toLowerCase().includes(searchTerm);
                case 'date':
                    return task.dueDate.includes(searchTerm);
                case 'priority':
                    return task.priority.toLowerCase().includes(searchTerm);
                case 'category':
                    return task.category.toLowerCase().includes(searchTerm);
                case 'tag':
                    return task.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                default:
                    return task.text.toLowerCase().includes(searchTerm) ||
                           task.category.toLowerCase().includes(searchTerm) ||
                           task.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            }
        })();

        const matchesView = (currentView === 'all') ||
                            (currentView === 'active' && !task.completed) ||
                            (currentView === 'completed' && task.completed);
        
        return matchesSearch && matchesView;
    });
}

function renderCategories() {
    categoryList.innerHTML = '';
    categorySelect.innerHTML = '';
    
    categories.forEach(category => {
        const li = document.createElement('li');
        li.textContent = category;
        categoryList.appendChild(li);

        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

async function addCategory() {
    const newCategory = newCategoryInput.value.trim();
    if (newCategory && !categories.includes(newCategory)) {
        categories.push(newCategory);
        await saveCategories();
        renderCategories();
        newCategoryInput.value = '';
    }
}

function renderTags() {
    tagList.innerHTML = '';
    
    tags.forEach(tag => {
        const li = document.createElement('li');
        li.textContent = tag;
        tagList.appendChild(li);
    });
}

async function addTag() {
    const newTag = newTagInput.value.trim();
    if (newTag && !tags.includes(newTag)) {
        tags.push(newTag);
        await saveTags();
        renderTags();
        newTagInput.value = '';
    }
}

function scheduleNotification(task) {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                const now = new Date().getTime();
                const taskDue = new Date(task.dueDate).getTime();
                const timeUntilDue = taskDue - now;

                if (timeUntilDue > 0) {
                    setTimeout(() => {
                        new Notification('Task Reminder', {
                            body: `Your task "${task.text}" is due soon!`
                        });
                    }, timeUntilDue);
                }
            }
        });
    }
}

function updateDarkMode() {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
}

function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0;

    const statsHTML = `
        <p>Total Tasks: ${totalTasks}</p>
        <p>Completed Tasks: ${completedTasks}</p>
        <p>Completion Rate: ${completionRate}%</p>
    `;

    statsDisplay.innerHTML = statsHTML;
}

function startVoiceInput() {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = function(event) {
            const voiceInput = event.results[0][0].transcript;
            document.getElementById('task-input').value = voiceInput;
        };
        recognition.start();
    } else {
        alert('Voice input is not supported in your browser.');
    }
}

function setupEventListeners() {
    taskForm.addEventListener('submit', addTask);
    searchInput.addEventListener('input', renderTasks);
    searchFilter.addEventListener('change', renderTasks);
    addCategoryBtn.addEventListener('click', addCategory);
    addTagBtn.addEventListener('click', addTag);
    viewOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            currentView = e.target.value;
            renderTasks();
        });
    });
    viewToggleBtn.addEventListener('click', toggleView);
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    darkModeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        updateDarkMode();
    });
    voiceInputBtn.addEventListener('click', startVoiceInput);
    logoutButton.addEventListener('click', logout);
}

function toggleView() {
    const appContainer = document.querySelector('.app-container');
    appContainer.classList.toggle('calendar-view');
    if (appContainer.classList.contains('calendar-view')) {
        viewToggleBtn.textContent = 'List View';
    } else {
        viewToggleBtn.textContent = 'Calendar View';
    }
}

async function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    await saveTasks();
    renderTasks();
    updateStats();
}

async function handleRecurringTasks() {
    const today = new Date();
    const tasksToAdd = [];
    tasks.forEach(task => {
        if (task.repeat !== 'none' && new Date(task.dueDate) <= today) {
            let newDueDate;
            switch (task.repeat) {
                case 'daily':
                    newDueDate = new Date(today.setDate(today.getDate() + 1));
                    break;
                case 'weekly':
                    newDueDate = new Date(today.setDate(today.getDate() + 7));
                    break;
                case 'monthly':
                    newDueDate = new Date(today.setMonth(today.getMonth() + 1));
                    break;
                case 'custom':
                    // Implement custom repeat logic here
                    break;
            }
            if (newDueDate) {
                const newTask = { 
                    ...task, 
                    id: Date.now(), 
                    dueDate: newDueDate.toISOString().split('T')[0], 
                    completed: false 
                };
                tasksToAdd.push(newTask);
            }
        }
    });
    tasks = [...tasks, ...tasksToAdd];
    await saveTasks();
    renderTasks();
}

function setupRecurringTasksCheck() {
    setInterval(handleRecurringTasks, 24 * 60 * 60 * 1000); // Check once a day
    handleRecurringTasks(); // Initial check
}

function generateCalendar(year, month) {

}


init();