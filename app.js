// State
let members = JSON.parse(localStorage.getItem('flatmate_members')) || [];
let tasks = JSON.parse(localStorage.getItem('flatmate_tasks')) || [];
let assignments = JSON.parse(localStorage.getItem('flatmate_assignments')) || {};
let lastAssignedDate = localStorage.getItem('flatmate_last_date') || '';

// DOM Elements
const membersList = document.getElementById('members-list');
const tasksList = document.getElementById('tasks-list');
const assignmentsList = document.getElementById('assignments-list');
const emptyAssignments = document.getElementById('empty-assignments');
const formAddMember = document.getElementById('form-add-member');
const formAddTask = document.getElementById('form-add-task');
const currentDateEl = document.getElementById('current-date');
const btnShuffle = document.getElementById('btn-shuffle');

// Initialization
function init() {
    updateDate();
    renderMembers();
    renderTasks();
    checkDailyAssignments();
    renderAssignments();
}

// Update Date
function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    currentDateEl.innerText = today.toLocaleDateString(undefined, options);
}

// Tab Switching logic
function switchTab(tabName) {
    // Hide all sections
    document.getElementById('section-assignments').classList.add('hidden');
    document.getElementById('section-members').classList.add('hidden');
    document.getElementById('section-tasks').classList.add('hidden');
    
    // Reset tab colors
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-indigo-600');
        btn.classList.add('text-gray-500');
    });

    // Show active section and tab
    document.getElementById(`section-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.remove('text-gray-500');
    document.getElementById(`tab-${tabName}`).classList.add('text-indigo-600');
}

// Save to LocalStorage
function saveData() {
    localStorage.setItem('flatmate_members', JSON.stringify(members));
    localStorage.setItem('flatmate_tasks', JSON.stringify(tasks));
    localStorage.setItem('flatmate_assignments', JSON.stringify(assignments));
    localStorage.setItem('flatmate_last_date', lastAssignedDate);
}

// Members Logic
formAddMember.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('input-member');
    const name = input.value.trim();
    if (name && !members.includes(name)) {
        members.push(name);
        saveData();
        renderMembers();
        generateAssignments(); // Regenerate assignments when members change
        input.value = '';
    }
});

function removeMember(index) {
    members.splice(index, 1);
    saveData();
    renderMembers();
    generateAssignments();
}

function renderMembers() {
    membersList.innerHTML = '';
    if (members.length === 0) {
        membersList.innerHTML = '<li class="py-3 text-sm text-gray-500 text-center">No flatmates added yet.</li>';
        return;
    }
    members.forEach((member, index) => {
        const li = document.createElement('li');
        li.className = 'py-3 flex justify-between items-center';
        li.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold uppercase">
                    ${member.charAt(0)}
                </div>
                <span class="font-medium text-gray-800">${member}</span>
            </div>
            <button onclick="removeMember(${index})" class="text-red-500 hover:text-red-700 transition p-1">
                <i class="fas fa-trash"></i>
            </button>
        `;
        membersList.appendChild(li);
    });
}

// Tasks Logic
formAddTask.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('input-task');
    const taskName = input.value.trim();
    if (taskName && !tasks.includes(taskName)) {
        tasks.push(taskName);
        saveData();
        renderTasks();
        generateAssignments();
        input.value = '';
    }
});

function removeTask(index) {
    tasks.splice(index, 1);
    saveData();
    renderTasks();
    generateAssignments();
}

function renderTasks() {
    tasksList.innerHTML = '';
    if (tasks.length === 0) {
        tasksList.innerHTML = '<li class="py-3 text-sm text-gray-500 text-center">No tasks added yet.</li>';
        return;
    }
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'py-3 flex justify-between items-center';
        li.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <i class="fas fa-check"></i>
                </div>
                <span class="font-medium text-gray-800">${task}</span>
            </div>
            <button onclick="removeTask(${index})" class="text-red-500 hover:text-red-700 transition p-1">
                <i class="fas fa-trash"></i>
            </button>
        `;
        tasksList.appendChild(li);
    });
}

// Assignments Logic
function checkDailyAssignments() {
    const todayStr = new Date().toDateString();
    if (lastAssignedDate !== todayStr) {
        generateAssignments();
        lastAssignedDate = todayStr;
        saveData();
    }
}

function generateAssignments() {
    assignments = {};
    if (members.length === 0 || tasks.length === 0) {
        renderAssignments();
        return;
    }

    // Simple round-robin based assignment, seeded by date for "randomness" that persists through the day
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    
    // Shuffle tasks slightly based on day to rotate
    let rotatedTasks = [...tasks];
    for (let i = 0; i < dayOfYear % tasks.length; i++) {
        rotatedTasks.push(rotatedTasks.shift());
    }

    rotatedTasks.forEach((task, index) => {
        const assignee = members[index % members.length];
        if (!assignments[assignee]) {
            assignments[assignee] = [];
        }
        assignments[assignee].push(task);
    });

    saveData();
    renderAssignments();
}

btnShuffle.addEventListener('click', () => {
    // Force immediate random shuffle
    assignments = {};
    if (members.length === 0 || tasks.length === 0) return;

    let shuffledTasks = [...tasks].sort(() => 0.5 - Math.random());
    shuffledTasks.forEach((task, index) => {
        const assignee = members[index % members.length];
        if (!assignments[assignee]) {
            assignments[assignee] = [];
        }
        assignments[assignee].push(task);
    });
    saveData();
    renderAssignments();
});

function renderAssignments() {
    assignmentsList.innerHTML = '';
    
    if (Object.keys(assignments).length === 0) {
        emptyAssignments.style.display = 'block';
        return;
    } else {
        emptyAssignments.style.display = 'none';
    }

    Object.keys(assignments).forEach(member => {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm';
        
        const memberTasks = assignments[member].map(t => `<li class="flex items-center gap-2 text-gray-700"><i class="fas fa-circle text-[8px] text-indigo-500"></i>${t}</li>`).join('');

        card.innerHTML = `
            <div class="flex items-center gap-3 mb-3 border-b border-gray-200 pb-2">
                <div class="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg uppercase shadow-sm">
                    ${member.charAt(0)}
                </div>
                <h3 class="font-bold text-gray-800 text-lg">${member}</h3>
            </div>
            <ul class="space-y-1 ml-1 text-sm font-medium">
                ${memberTasks}
            </ul>
        `;
        assignmentsList.appendChild(card);
    });
}

// Start app
init();
