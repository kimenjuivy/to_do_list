// Initialize variables
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['Personal', 'Work', 'Shopping'];
let currentView = 'all';

// DOM elements
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const categoryList = document.getElementById('category-list');
const categorySelect = document.getElementById('category-select');
const newCategoryInput = document.getElementById('new-category');
const addCategoryBtn = document.getElementById('add-category');
const searchInput = document.getElementById('search-input');
const viewOptions = document.querySelectorAll('input[name="view"]');
const viewToggleBtn = document.getElementById('view-toggle');
const clearCompletedBtn = document.getElementById('clear-completed');

// Initialize the app
function init() {
    generateCalendar(new Date().getFullYear(), new Date().getMonth() + 1);
    renderCategories();
    renderTasks();
    setupEventListeners();
}

// Calendar functionality
function generateCalendar(year, month) {
    // ... (same as before)
}

// Task management
function addTask(event) {
    event.preventDefault();
    const taskInput = document.getElementById('task-input');
    const dueDate = document.getElementById('due-date');
    const priority = document.getElementById('priority');
    const category = document.getElementById('category-select');

    const task = {
        id: Date.now(),
        text: taskInput.value,
        completed: false,
        dueDate: dueDate.value,
        priority: priority.value,
        category: category.value
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    taskForm.reset();
}

function renderTasks() {
    taskList.innerHTML = '';
    const filteredTasks = filterTasks(tasks);
    
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });

    // Initialize drag and drop
    dragula([taskList]);
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.classList.add('task-item');
    if (task.completed) taskElement.classList.add('completed');
    
    taskElement.innerHTML = `
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-text">${task.text}</span>
        <span>Due: ${task.dueDate}</span>
        <span>Priority: ${task.priority}</span>
        <span>Category: ${task.category}</span>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
    `;

    const checkbox = taskElement.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

    const editBtn = taskElement.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => editTask(task.id));

    const deleteBtn = taskElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    return taskElement;
}

function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    const newText = prompt('Edit task:', task.text);
    if (newText !== null) {
        task.text = newText;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function filterTasks(tasksToFilter) {
    const searchTerm = searchInput.value.toLowerCase();
    return tasksToFilter.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchTerm) ||
                              task.category.toLowerCase().includes(searchTerm);
        const matchesView = (currentView === 'all') ||
                            (currentView === 'active' && !task.completed) ||
                            (currentView === 'completed' && task.completed);
        return matchesSearch && matchesView;
    });
}

// Category management
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

function addCategory() {
    const newCategory = newCategoryInput.value.trim();
    if (newCategory && !categories.includes(newCategory)) {
        categories.push(newCategory);
        saveCategories();
        renderCategories();
        newCategoryInput.value = '';
    }
}

// Local Storage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

// Event Listeners
function setupEventListeners() {
    taskForm.addEventListener('submit', addTask);
    searchInput.addEventListener('input', renderTasks);
    addCategoryBtn.addEventListener('click', addCategory);
    viewOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            currentView = e.target.value;
            renderTasks();
        });
    });
    viewToggleBtn.addEventListener('click', toggleView);
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
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

function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

// Initialize the app
init();