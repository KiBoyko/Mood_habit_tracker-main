document.addEventListener('DOMContentLoaded', function() {
    const api = window.moodTrackerAPI;
    let currentUser = null;
    let selectedMood = null;
    let moods = [];
    let charts = {};

    // Функция для получения текущей даты и времени
    function getCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return {
            date: `${year}-${month}-${day}`,
            time: `${hours}:${minutes}`,
            formattedDate: `${day}.${month}.${year}`,
            formattedTime: `${hours}:${minutes}`
        };
    }

    // Функция для форматирования даты и времени
    function formatDateTime(dateString, timeString = '') {
        if (!dateString) return '';
        
        try {
            // Разбираем дату
            const [year, month, day] = dateString.split('-');
            const formattedDate = `${day}.${month}.${year}`;
            
            // Если есть время, добавляем его
            if (timeString) {
                // Убираем секунды если они есть
                const timeParts = timeString.split(':');
                const hours = timeParts[0];
                const minutes = timeParts[1] || '00';
                return `${formattedDate} ${hours}:${minutes}`;
            }
            
            return formattedDate;
        } catch (error) {
            return dateString;
        }
    }

    // Функция для форматирования времени
    function formatTime(timeString) {
        if (!timeString) return '';
        
        try {
            const [hours, minutes] = timeString.split(':');
            return `${hours}:${minutes || '00'}`;
        } catch (error) {
            return timeString;
        }
    }

    // Инициализация графиков
    function initCharts() {
        const container = document.getElementById('chartsContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="charts-grid">
                <div class="chart-wrapper">
                    <h4><i class="fas fa-chart-pie"></i> Распределение настроений</h4>
                    <div class="chart-container">
                        <canvas id="moodDistributionChart"></canvas>
                    </div>
                </div>
                <div class="chart-wrapper">
                    <h4><i class="fas fa-chart-line"></i> Тренд настроения</h4>
                    <div class="chart-container">
                        <canvas id="moodTrendChart"></canvas>
                    </div>
                </div>
                <div class="chart-wrapper">
                    <h4><i class="fas fa-chart-bar"></i> Активность по времени</h4>
                    <div class="chart-container">
                        <canvas id="timeActivityChart"></canvas>
                    </div>
                </div>
                <div class="chart-wrapper">
                    <h4><i class="fas fa-tasks"></i> Выполнение привычек</h4>
                    <div class="chart-container">
                        <canvas id="habitsChart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    // Отрисовка графиков
    async function renderCharts(stats) {
        if (!stats || !stats.success || !currentUser) return;
        
        try {
            // 1. График распределения настроений
            if (stats.mood_distribution) {
                createMoodDistributionChart(stats.mood_distribution);
            }
            
            // 2. График тренда настроения
            if (stats.mood_trend) {
                createMoodTrendChart(stats.mood_trend);
            }
            
            // 3. График активности по времени
            if (stats.time_stats) {
                createTimeActivityChart(stats.time_stats);
            }
            
            // 4. График привычек
            if (stats.habit_stats && stats.habit_stats.length > 0) {
                createHabitsChart(stats.habit_stats);
            }
            
        } catch (error) {
            console.error('Ошибка создания графиков:', error);
        }
    }

    function createMoodDistributionChart(moodDistribution) {
        const ctx = document.getElementById('moodDistributionChart');
        if (!ctx) return;
        
        const labels = [];
        const data = [];
        const colors = ['#4CAF50', '#2196F3', '#FFC107', '#FF9800', '#F44336'];
        
        for (const [moodName, moodData] of Object.entries(moodDistribution)) {
            if (moodData.count > 0) {
                labels.push(`${moodData.emoji} ${moodName}`);
                data.push(moodData.count);
            }
        }
        
        if (data.length === 0) return;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function createMoodTrendChart(moodTrend) {
        const ctx = document.getElementById('moodTrendChart');
        if (!ctx) return;
        
        const labels = moodTrend.map(item => {
            const date = new Date(item.date);
            return `${date.getDate()}.${date.getMonth() + 1}`;
        });
        
        const data = moodTrend.map(item => item.avg_mood || 0);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Настроение',
                    data: data,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 0,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Оценка настроения'
                        }
                    }
                }
            }
        });
    }

    function createTimeActivityChart(timeStats) {
        const ctx = document.getElementById('timeActivityChart');
        if (!ctx) return;
        
        const times = ['Утро (5-12)', 'День (12-17)', 'Вечер (17-22)', 'Ночь (22-5)'];
        const data = [
            timeStats.morning || 0,
            timeStats.afternoon || 0,
            timeStats.evening || 0,
            timeStats.night || 0
        ];
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: times,
                datasets: [{
                    label: 'Записей',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 193, 7, 0.7)',
                        'rgba(76, 175, 80, 0.7)',
                        'rgba(33, 150, 243, 0.7)',
                        'rgba(103, 58, 183, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Количество записей'
                        }
                    }
                }
            }
        });
    }

    function createHabitsChart(habitStats) {
        const ctx = document.getElementById('habitsChart');
        if (!ctx) return;
        
        const labels = habitStats.map(h => h.name);
        const data = habitStats.map(h => h.completion_rate);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Выполнение (%)',
                    data: data,
                    backgroundColor: 'rgba(76, 175, 80, 0.7)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Процент выполнения'
                        }
                    }
                }
            }
        });
    }

    // Загрузка настроений
    async function loadMoods() {
        try {
            moods = await api.getMoods();
            const container = document.getElementById('moodButtons');
            if (!container) return;
            
            container.innerHTML = '';
            moods.forEach(mood => {
                const btn = document.createElement('button');
                btn.className = 'mood-option';
                btn.innerHTML = `
                    <span class="mood-emoji">${mood.emoji}</span>
                    <span class="mood-name">${mood.name}</span>
                `;
                btn.onclick = () => selectMood(mood);
                container.appendChild(btn);
            });
            
            // Заполняем фильтр настроений
            const filterSelect = document.getElementById('moodFilter');
            if (filterSelect) {
                filterSelect.innerHTML = '<option value="">Все настроения</option>';
                moods.forEach(mood => {
                    const option = document.createElement('option');
                    option.value = mood.id;
                    option.textContent = `${mood.emoji} ${mood.name}`;
                    filterSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки настроений:', error);
        }
    }

    function selectMood(mood) {
        selectedMood = mood;
        document.querySelectorAll('.mood-option').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
        document.getElementById('saveEntryBtn').disabled = false;
    }

    // Загрузка статистики
    async function loadStats(period = 'month') {
        if (!currentUser) return;
        
        try {
            const stats = await api.getStats(period);
            if (!stats || !stats.success) {
                console.error('Ошибка статистики:', stats);
                return;
            }
            
            updateStatsDisplay(stats);
            renderCharts(stats);
            
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
            showMessage('Ошибка загрузки статистики', 'error');
        }
    }

    function updateStatsDisplay(stats) {
        const container = document.getElementById('statsContent');
        if (!container) return;
        
        let moodDistributionHtml = '';
        if (stats.mood_distribution) {
            for (const [moodName, moodData] of Object.entries(stats.mood_distribution)) {
                if (moodData.count > 0) {
                    moodDistributionHtml += `
                        <div class="mood-dist-item">
                            <span class="mood-emoji-small">${moodData.emoji}</span>
                            <span class="mood-name">${moodName}</span>
                            <span class="mood-count">${moodData.count} (${moodData.percentage}%)</span>
                        </div>
                    `;
                }
            }
        }
        
        let habitStatsHtml = '';
        if (stats.habit_stats && stats.habit_stats.length > 0) {
            stats.habit_stats.forEach(habit => {
                habitStatsHtml += `
                    <div class="habit-stat-item">
                        <span class="habit-name">${habit.name}</span>
                        <span class="habit-progress">
                            <span class="progress-bar">
                                <span class="progress-fill" style="width: ${habit.completion_rate}%"></span>
                            </span>
                            <span class="habit-rate">${habit.completion_rate}%</span>
                        </span>
                    </div>
                `;
            });
        }
        
        container.innerHTML = `
            <div class="main-stats">
                <div class="stat-big">
                    <div class="stat-value">${stats.mood_avg || 0}/10</div>
                    <div class="stat-label">Среднее настроение</div>
                </div>
                <div class="stat-big">
                    <div class="stat-value">${stats.total_entries || 0}</div>
                    <div class="stat-label">Всего записей</div>
                </div>
            </div>
            
            <div class="stats-details">
                <div class="stats-section">
                    <h4>Распределение настроений</h4>
                    ${moodDistributionHtml || '<p class="no-data-text">Нет данных</p>'}
                </div>
                
                <div class="stats-section">
                    <h4>Выполнение привычек</h4>
                    ${habitStatsHtml || '<p class="no-data-text">Нет привычек</p>'}
                </div>
            </div>
        `;
    }

    // Загрузка записей с временем
    async function loadEntries() {
        if (!currentUser) return;
        
        try {
            const entries = await api.getEntries();
            displayEntries(entries);
        } catch (error) {
            console.error('Ошибка загрузки записей:', error);
        }
    }

    function displayEntries(entries) {
        const container = document.getElementById('entriesList');
        if (!container) return;
        
        if (!entries || entries.length === 0) {
            container.innerHTML = `
                <div class="no-entries">
                    <i class="fas fa-book"></i>
                    <p>Нет записей</p>
                    <p class="subtext">Создайте первую запись настроения!</p>
                </div>
            `;
            return;
        }
        
        // Сортируем по дате и времени (новые сверху)
        entries.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
            const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
            return dateB - dateA;
        });
        
        container.innerHTML = entries.map(entry => {
            const dateTime = formatDateTime(entry.date, entry.time);
            const timeOnly = entry.time ? formatTime(entry.time) : '';
            
            return `
                <div class="entry-item">
                    <div class="entry-header">
                        <div class="entry-date-time">
                            <i class="far fa-calendar"></i>
                            <span class="date">${formatDateTime(entry.date)}</span>
                            ${timeOnly ? `<span class="time"><i class="far fa-clock"></i> ${timeOnly}</span>` : ''}
                        </div>
                        <div class="entry-mood-badge">
                            <span class="mood-emoji">${entry.mood_emoji}</span>
                            <span class="mood-name">${entry.mood_name}</span>
                        </div>
                    </div>
                    ${entry.note ? `
                        <div class="entry-note">
                            <i class="far fa-sticky-note"></i>
                            <p>${entry.note}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    // Загрузка привычек
    async function loadHabits() {
        if (!currentUser) return;
        
        try {
            const habits = await api.getHabits();
            const container = document.getElementById('habitsList');
            if (!container) return;
            
            const activeHabits = habits.filter(h => h.is_active);
            
            if (activeHabits.length === 0) {
                container.innerHTML = `
                    <div class="no-habits">
                        <i class="fas fa-clipboard-check"></i>
                        <p>Нет активных привычек</p>
                        <p class="subtext">Добавьте свою первую привычку!</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = activeHabits.map(habit => `
                <div class="habit-item">
                    <div class="habit-info">
                        <i class="fas fa-star habit-icon"></i>
                        <span class="habit-name">${habit.name}</span>
                        ${habit.description ? `<p class="habit-desc">${habit.description}</p>` : ''}
                    </div>
                    <div class="habit-actions">
                        <button class="btn btn-success btn-small" onclick="completeHabit(${habit.id})" title="Отметить выполнение">
                            <i class="fas fa-check"></i> Выполнено
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteHabit(${habit.id})" title="Удалить привычку">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки привычек:', error);
        }
    }

    // Обновление интерфейса
    function updateUI() {
        const authSection = document.getElementById('authSection');
        const userSection = document.getElementById('userSection');
        const usernameDisplay = document.getElementById('usernameDisplay');
        const analyticsSection = document.getElementById('analyticsSection');
        const quickActions = document.getElementById('quickActions');
        const currentDateEl = document.getElementById('currentDate');
        
        // Обновляем текущую дату
        if (currentDateEl) {
            const now = getCurrentDateTime();
            currentDateEl.textContent = now.formattedDate;
        }
        
        if (currentUser) {
            // Пользователь авторизован
            if (authSection) authSection.style.display = 'none';
            if (userSection) userSection.style.display = 'flex';
            if (usernameDisplay) usernameDisplay.textContent = currentUser.username;
            if (analyticsSection) analyticsSection.style.display = 'block';
            if (quickActions) quickActions.style.display = 'grid';
            
            // Активируем элементы
            document.getElementById('saveEntryBtn').disabled = false;
            document.getElementById('newHabitName').disabled = false;
            document.getElementById('addHabitBtn').disabled = false;
            
            // Инициализируем графики
            initCharts();
            
        } else {
            // Пользователь не авторизован
            if (authSection) authSection.style.display = 'flex';
            if (userSection) userSection.style.display = 'none';
            if (analyticsSection) analyticsSection.style.display = 'none';
            if (quickActions) quickActions.style.display = 'none';
            
            // Деактивируем элементы
            document.getElementById('saveEntryBtn').disabled = true;
            document.getElementById('newHabitName').disabled = true;
            document.getElementById('addHabitBtn').disabled = true;
            
            // Показываем сообщения о необходимости входа
            document.getElementById('statsContent').innerHTML = `
                <div class="no-data">
                    <i class="fas fa-user-lock"></i>
                    <p>Войдите, чтобы увидеть статистику</p>
                </div>
            `;
            
            document.getElementById('entriesList').innerHTML = `
                <div class="no-data">
                    <i class="fas fa-user-lock"></i>
                    <p>Войдите, чтобы увидеть историю записей</p>
                </div>
            `;
            
            document.getElementById('habitsList').innerHTML = `
                <div class="no-data">
                    <i class="fas fa-user-lock"></i>
                    <p>Войдите, чтобы управлять привычками</p>
                </div>
            `;
        }
    }

    // Показ сообщений
    function showMessage(text, type = 'success') {
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${text}</span>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 3000);
    }

    // Обработчики событий
    document.getElementById('saveEntryBtn').onclick = async function() {
        if (!selectedMood) {
            showMessage('Выберите настроение!', 'error');
            return;
        }
        
        try {
            const now = getCurrentDateTime();
            const note = document.getElementById('moodNote').value;
            
            await api.createEntry({
                date: now.date,
                time: now.time,
                mood: selectedMood.id,
                note: note
            });
            
            showMessage(`Запись настроения сохранена! (${now.formattedDate} ${now.formattedTime})`);
            
            // Очищаем форму
            document.getElementById('moodNote').value = '';
            selectedMood = null;
            document.querySelectorAll('.mood-option').forEach(btn => {
                btn.classList.remove('selected');
            });
            this.disabled = true;
            
            // Обновляем данные
            await loadStats();
            await loadEntries();
            await loadHabits();
            
        } catch (error) {
            showMessage('Ошибка сохранения записи: ' + error.message, 'error');
        }
    };

    document.getElementById('addHabitBtn').onclick = async function() {
        const nameInput = document.getElementById('newHabitName');
        const name = nameInput.value.trim();
        
        if (!name) {
            showMessage('Введите название привычки!', 'error');
            return;
        }
        
        try {
            await api.createHabit({ 
                name: name, 
                description: '' 
            });
            
            showMessage(`Привычка "${name}" добавлена!`);
            nameInput.value = '';
            
            await loadHabits();
            await loadStats();
            
        } catch (error) {
            showMessage('Ошибка создания привычки: ' + error.message, 'error');
        }
    };

    window.completeHabit = async function(habitId) {
        try {
            const now = getCurrentDateTime();
            
            // Сначала получаем существующие записи
            const entries = await api.getEntries();
            let todayEntry = entries.find(e => e.date === now.date);
            
            if (!todayEntry) {
                // Создаем запись с нейтральным настроением
                const neutralMood = moods.find(m => m.value === 6) || moods[0];
                todayEntry = await api.createEntry({
                    date: now.date,
                    time: now.time,
                    mood: neutralMood.id,
                    note: 'Автоматически создано для отметки привычки'
                });
            }
            
            // Создаем HabitLog
            await api.createHabitLog({
                habit: habitId,
                entry: todayEntry.id,
                completed: true,
                note: 'Выполнено'
            });
            
            showMessage('Привычка отмечена как выполненная!');
            
            await loadStats();
            await loadHabits();
            await loadEntries();
            
        } catch (error) {
            showMessage('Ошибка отметки привычки: ' + error.message, 'error');
        }
    };

    window.deleteHabit = async function(habitId) {
        if (!confirm('Удалить эту привычку? Это действие нельзя отменить.')) return;
        
        try {
            await api.deleteHabit(habitId);
            showMessage('Привычка удалена!');
            
            await loadHabits();
            await loadStats();
            
        } catch (error) {
            showMessage('Ошибка удаления: ' + error.message, 'error');
        }
    };

    // Фильтрация записей
    document.getElementById('applyFilterBtn').onclick = async function() {
        if (!currentUser) {
            showMessage('Войдите, чтобы использовать фильтры', 'error');
            return;
        }
        
        try {
            const entries = await api.getEntries();
            const dateFilter = document.getElementById('dateFilter').value;
            const moodFilter = document.getElementById('moodFilter').value;
            
            let filteredEntries = [...entries];
            
            if (dateFilter) {
                filteredEntries = filteredEntries.filter(entry => entry.date === dateFilter);
            }
            
            if (moodFilter) {
                filteredEntries = filteredEntries.filter(entry => {
                    return String(entry.mood_id) === String(moodFilter);
                });
            }
            
            displayEntries(filteredEntries);
            
        } catch (error) {
            showMessage('Ошибка фильтрации: ' + error.message, 'error');
        }
    };

    document.getElementById('resetFilterBtn').onclick = function() {
        document.getElementById('dateFilter').value = '';
        document.getElementById('moodFilter').value = '';
        loadEntries();
    };

    // Выбор периода статистики
    document.getElementById('periodSelect').onchange = function() {
        loadStats(this.value);
    };

    // Аутентификация
    document.getElementById('loginBtn').onclick = function() {
        document.getElementById('loginModal').style.display = 'flex';
    };

    document.getElementById('registerBtn').onclick = function() {
        document.getElementById('registerModal').style.display = 'flex';
    };

    document.getElementById('submitLoginBtn').onclick = async function() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            showMessage('Заполните все поля', 'error');
            return;
        }
        
        try {
            const user = await api.login(username, password);
            currentUser = user;
            api.setToken(user.token);
            
            updateUI();
            document.getElementById('loginModal').style.display = 'none';
            
            // Очищаем форму
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            
            await initUserData();
            
            showMessage(`Добро пожаловать, ${username}!`);
            
        } catch (error) {
            showMessage('Ошибка входа: ' + error.message, 'error');
        }
    };

    document.getElementById('submitRegisterBtn').onclick = async function() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (!username || !email || !password) {
            showMessage('Заполните все поля', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Пароль должен содержать не менее 6 символов', 'error');
            return;
        }
        
        try {
            const user = await api.register(username, email, password);
            currentUser = user;
            api.setToken(user.token);
            
            showMessage('Регистрация успешна! Добро пожаловать!');
            document.getElementById('registerModal').style.display = 'none';
            
            // Очищаем форму
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            
            updateUI();
            await initUserData();
            
        } catch (error) {
            showMessage('Ошибка регистрации: ' + error.message, 'error');
        }
    };

    document.getElementById('logoutBtn').onclick = function() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            currentUser = null;
            localStorage.removeItem('token');
            
            updateUI();
            
            showMessage('Вы успешно вышли из системы');
        }
    };

    // Переключение между модальными окнами
    document.getElementById('switchToRegister').onclick = function(e) {
        e.preventDefault();
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('registerModal').style.display = 'flex';
    };

    document.getElementById('switchToLogin').onclick = function(e) {
        e.preventDefault();
        document.getElementById('registerModal').style.display = 'none';
        document.getElementById('loginModal').style.display = 'flex';
    };

    // Закрытие модальных окон
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        };
    });

    // Закрытие по клику вне модального окна
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    // Инициализация данных пользователя
    async function initUserData() {
        await loadStats();
        await loadEntries();
        await loadHabits();
    }

    // Основная инициализация
    async function init() {
        await loadMoods();
        updateUI();
        
        // Проверяем авторизацию при загрузке
        const token = localStorage.getItem('token');
        if (token) {
            api.setToken(token);
            try {
                const user = await api.getCurrentUser();
                if (user) {
                    currentUser = user;
                    updateUI();
                    await initUserData();
                }
            } catch (error) {
                localStorage.removeItem('token');
                console.error('Ошибка проверки авторизации:', error);
            }
        }
    }

    // Запуск приложения
    init();
});