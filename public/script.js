let currentSchedule = [];

async function fetchSchedule() {
    try {
        const response = await fetch('/api/schedule');
        const data = await response.json();
        
        // Check for updates
        const isUpdated = JSON.stringify(data) !== JSON.stringify(currentSchedule);
        if (isUpdated) {
            // Only play sound if it's not the first load
            if (currentSchedule.length > 0) {
                const audio = document.getElementById('notify-sound');
                audio.play().catch(e => console.log('Audio play blocked:', e));
            }
            currentSchedule = data;
            renderSchedule();
        }
    } catch (error) {
        console.error('Error fetching schedule:', error);
    }
}

function renderSchedule() {
    const tbody = document.getElementById('schedule-body');
    tbody.innerHTML = '';
    
    currentSchedule.forEach(row => {
        const tr = document.createElement('tr');
        if (row.is_done) {
            tr.classList.add('row-done');
        }
        
        tr.innerHTML = `
            <td>${row.date_num}</td>
            <td>${row.day_str}</td>
            <td class="assigned-person">${row.user_name}</td>
            <td>
                <label class="checkbox-container">
                    <input type="checkbox" ${row.is_done ? 'checked' : ''} onchange="toggleDone(${row.id}, this.checked)">
                    <span class="checkmark"></span>
                </label>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function toggleDone(id, isDone) {
    try {
        await fetch(`/api/schedule/${id}/toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_done: isDone })
        });
        
        // Optimistically update
        const item = currentSchedule.find(s => s.id === id);
        if (item) {
            item.is_done = isDone ? 1 : 0;
            renderSchedule();
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

async function addUser() {
    const input = document.getElementById('new-user-name');
    const name = input.value.trim();
    if (!name) return;
    
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        
        if (response.ok) {
            input.value = '';
            alert(`${name} added to the rotation! They will be scheduled in the next auto-generation.`);
        }
    } catch (error) {
        console.error('Error adding user:', error);
    }
}

// Initial fetch
fetchSchedule();

// Poll every 3 seconds for updates
setInterval(fetchSchedule, 3000);
