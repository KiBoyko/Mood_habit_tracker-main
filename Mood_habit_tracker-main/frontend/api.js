window.moodTrackerAPI = (function() {
    const API_BASE = 'http://localhost:8000/api';
    let token = localStorage.getItem('token') || null;

    function setToken(newToken) {
        token = newToken;
        localStorage.setItem('token', token);
    }

    function getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Token ${token}`;
        }
        
        return headers;
    }

    async function request(endpoint, options = {}) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: getHeaders(),
        });

        const contentType = response.headers.get("content-type");
        
        if (!response.ok) {
            if (contentType && contentType.includes("application/json")) {
                const error = await response.json();
                throw new Error(error.detail || JSON.stringify(error));
            } else {
                const text = await response.text();
                throw new Error(`Server error: ${response.status}`);
            }
        }

        if (contentType && contentType.includes("application/json")) {
            return response.json();
        }
        
        return response.text();
    }

    async function login(username, password) {
        const response = await fetch(`${API_BASE}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            throw new Error('Login failed');
        }
        
        const data = await response.json();
        setToken(data.token);
        return data;
    }

    async function register(username, email, password) {
        return request('/auth/register/', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }

    async function getCurrentUser() {
        try {
            return await request('/auth/user/');
        } catch (error) {
            console.log('User not authenticated');
            return null;
        }
    }

    async function getMoods() {
        return request('/moods/');
    }

    async function getHabits() {
        return request('/habits/');
    }

    async function createHabit(data) {
        return request('/habits/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async function deleteHabit(id) {
        return request(`/habits/${id}/`, {
            method: 'DELETE'
        });
    }

    async function getEntries() {
        return request('/entries/');
    }

    async function createEntry(data) {
        return request('/entries/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async function updateEntry(id, data) {
        return request(`/entries/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async function getStats(period = 'month') {
        return request(`/entries/stats/?period=${period}`);
    }

    async function getHabitLogs() {
        return request('/habit-logs/');
    }

    async function createHabitLog(data) {
        return request('/habit-logs/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async function updateHabitLog(id, data) {
        return request(`/habit-logs/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // НОВЫЕ МЕТОДЫ ДЛЯ АНАЛИТИКИ
    async function getAnalyticsDashboard() {
        return request('/analytics/dashboard/');
    }

    async function getTimelineEntries(limit = 30) {
        return request(`/entries/timeline/?limit=${limit}`);
    }

    async function getMonthlyStats(months = 6) {
        return request(`/entries/monthly-stats/?months=${months}`);
    }

    return {
        setToken,
        login,
        register,
        getCurrentUser,
        getMoods,
        getHabits,
        createHabit,
        deleteHabit,
        getEntries,
        createEntry,
        updateEntry,
        getStats,
        getHabitLogs,
        createHabitLog,
        updateHabitLog,
        getAnalyticsDashboard,
        getTimelineEntries,
        getMonthlyStats
    };
})();