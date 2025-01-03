document.addEventListener('DOMContentLoaded', async function() {
    // Configuration for each day and its tasks
    const config = {
        'MON': [
            { task: 'Work on thesis (4 hours)', count: 52, class: 'thesis' },
            { task: 'Ecom.AI project (4 hours)', count: 52, class: 'ecom' },
            { task: 'School', count: 52, class: 'school' }
        ],
        'TUE': [
            { task: 'Work on thesis (4 hours)', count: 52, class: 'thesis' },
            { task: 'Go to gym', count: 52, class: 'gym' },
            { task: 'School', count: 52, class: 'school' }
        ],
        'WED': [
            { task: 'Work on thesis (4 hours)', count: 52, class: 'thesis' },
            { task: 'Go to gym', count: 52, class: 'gym' },
            { task: 'School', count: 52, class: 'school' }
        ],
        'THU': [
            { task: 'Work on thesis (4 hours)', count: 52, class: 'thesis' },
            { task: 'Ecom.AI project (4 hours)', count: 52, class: 'ecom' },
            { task: 'School', count: 52, class: 'school' }
        ],
        'FRI': [
            { task: 'Work on thesis (4 hours)', count: 52, class: 'thesis' },
            { task: 'School', count: 52, class: 'school' }
        ],
        'SAT': [
            { task: 'School', count: 52, class: 'school' }
        ],
        'SUN': [
            { task: 'Go to gym', count: 52, class: 'gym' },
            { task: 'Make money', count: 52, class: 'make-money' },
            { task: 'School', count: 52, class: 'school' }
        ]
    };
    // Day mapping for date calculation
    const dayMapping = {
        'SUN': 0,
        'MON': 1,
        'TUE': 2,
        'WED': 3,
        'THU': 4,
        'FRI': 5,
        'SAT': 6
    };

    // Initialize IndexedDB
    let db;
    const dbName = "calendarDB";
    const request = indexedDB.open(dbName, 1);

    request.onerror = (event) => {
        console.error("Database error: " + event.target.error);
        loadFromLocalStorage();
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains('calendarState')) {
            db.createObjectStore('calendarState');
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        initializeCalendar();
    };

    // Format date as Month Day (e.g., "January 4")
    function formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }

    // Get the date for a specific circle based on its day and index
    function getDateForCircle(day, index) {
        const year = 2025;
        const firstDay = new Date(year, 0, 1);
        
        let dayOfWeek = firstDay.getDay();
        let daysToAdd = (dayMapping[day] - dayOfWeek + 7) % 7;
        
        let date = new Date(year, 0, 1 + daysToAdd);
        date.setDate(date.getDate() + (index * 7));
        
        return date;
    }

    // Check if a date is in the future
    function isDateInFuture(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date > today;
    }

    function initializeCalendar() {
        Object.entries(config).forEach(([day, tasks]) => {
            const dayElement = document.querySelector(`[data-day="${day}"]`);
            tasks.forEach(task => {
                const taskContainer = dayElement.querySelector(`[data-task="${task.task}"]`) || dayElement;
                
                if (['SUN', 'MON', 'TUE'].includes(day)) {
                    const spacerCircle = document.createElement('div');
                    spacerCircle.className = 'circle spacer';
                    taskContainer.appendChild(spacerCircle);
                }
                
                for (let i = 0; i < task.count; i++) {
                    const circle = document.createElement('div');
                    const date = getDateForCircle(day, i);
                    
                    circle.className = `circle ${task.class}`;
                    circle.setAttribute('data-date', date.toISOString());
                    circle.setAttribute('title', formatDate(date));
                    
                    if (isDateInFuture(new Date(date))) {
                        circle.classList.add('future');
                    }
                    
                    circle.addEventListener('click', () => toggleCircle(circle));
                    taskContainer.appendChild(circle);
                }
            });
        });
        loadState();
        updateStats();
    }

    function toggleCircle(circle) {
        const circleDate = new Date(circle.getAttribute('data-date'));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        circleDate.setHours(0, 0, 0, 0);

        if (circleDate <= today) {
            circle.classList.toggle('checked');
            saveState();
            updateStats();
        } else {
            circle.classList.add('shake');
            setTimeout(() => circle.classList.remove('shake'), 500);
            showToast(`🚀 This task is for ${formatDate(circleDate)}.`);
        }
    }
    //const API_URL = 'http://localhost:3000/api';
    const API_URL = 'https://calendar-backend-6v4kvhlwa-221rdb187s-projects.vercel.app/api';
    
    const response = await fetch(API_URL);

    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState)
    });


    async function saveState() {
        const state = {}; // Define state at the beginning
        try {
            document.querySelectorAll('.squares-group .circle:not(.spacer)').forEach((circle, index) => {
                state[index] = circle.classList.contains('checked');
            });
    
            const response = await fetch(`${API_URL}/state`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(state)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save state');
            }
    
            localStorage.setItem('calendarState2025', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save state:', error);
            localStorage.setItem('calendarState2025', JSON.stringify(state));
        }
    }
    
    // Add file input for loading state
    function addStateLoader() {
        const stateLoader = document.createElement('input');
        stateLoader.type = 'file';
        stateLoader.accept = '.json';
        stateLoader.style.display = 'none';
        stateLoader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const state = JSON.parse(event.target.result);
                    applyState(state);
                    // Save to current profile's storage
                    localStorage.setItem('calendarState2025', JSON.stringify(state));
                    const transaction = db.transaction(['calendarState'], 'readwrite');
                    const store = transaction.objectStore('calendarState');
                    store.put(state, 'calendar2025');
                };
                reader.readAsText(file);
            }
        });
        document.body.appendChild(stateLoader);
    
       
    }
    
    // Call this in your initialization
    addStateLoader();

    async function loadState() {
        try {
            const response = await fetch(`${API_URL}/state`);
            if (!response.ok) {
                throw new Error('Failed to fetch state');
            }
            const state = await response.json();
            applyState(state);
        } catch (error) {
            console.error('Failed to load state:', error);
            loadFromLocalStorage();
        }
    }

    function applyState(state) {
        document.querySelectorAll('.squares-group .circle:not(.spacer)').forEach((circle, index) => {
            if (state[index]) {
                const circleDate = new Date(circle.getAttribute('data-date'));
                const today = new Date();
                if (circleDate <= today) {
                    circle.classList.add('checked');
                }
            } else {
                circle.classList.remove('checked');
            }
        });
        updateStats();
    }

    function loadFromLocalStorage() {
        const savedState = localStorage.getItem('calendarState2025');
        if (savedState) {
            const state = JSON.parse(savedState);
            applyState(state);
        }
    }

    function updateStats() {
        const totalChecked = document.querySelectorAll('.squares-group .circle.checked').length;
        const requiredTotal = 413;
        
        const today = new Date();
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-12-31');
        
        let daysRemaining;
        if (today < startDate) {
            daysRemaining = 365;
        } else if (today > endDate) {
            daysRemaining = 0;
        } else {
            daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        }
        
        document.getElementById('tasksCompleted').textContent = totalChecked;
        document.getElementById('daysRemaining').textContent = daysRemaining;
        document.getElementById('completionRate').textContent = 
            `${Math.round((totalChecked / requiredTotal) * 100)}%`;
    }

    function showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Sync across tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'calendarState2025') {
            const state = JSON.parse(e.newValue);
            applyState(state);
        }
    });
});