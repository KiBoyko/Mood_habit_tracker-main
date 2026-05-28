## 🚀 **Инструкция по запуску проекта через консоль**

### **1. Откройте терминал**

Нажмите `Ctrl+Alt+T` для открытия нового терминала.

### **2. Запуск бэкенда (Django)**

#### **Шаг 1: Перейдите в папку проекта и активируйте виртуальное окружение**

```bash
cd ~/desktop/mood_habit_tracker
source venv/bin/activate
```

Вы должны увидеть `(venv)` в начале строки терминала.

#### **Шаг 2: Перейдите в папку backend**

```bash
cd backend
```

#### **Шаг 3: Запустите сервер Django**

```bash
python manage.py runserver
```

**Ожидаемый вывод:**
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
December 16, 2025 - 22:00:00
Django version 4.2, using settings 'mood_tracker.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

**Оставьте этот терминал открытым!** Сервер должен продолжать работать.

### **3. Запуск фронтенда**

#### **Шаг 1: Откройте новый терминал**

Нажмите `Ctrl+Shift+T` (новая вкладка) или откройте новое окно терминала.

#### **Шаг 2: Перейдите в папку проекта и активируйте окружение**

```bash
cd ~/desktop/mood_habit_tracker
source venv/bin/activate
```

#### **Шаг 3: Перейдите в папку frontend**

```bash
cd frontend
```

#### **Шаг 4: Запустите HTTP-сервер**

```bash
python -m http.server 8080
```

**Ожидаемый вывод:**
```
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

**Оставьте и этот терминал открытым!**

### **4. Проверка работы**

Теперь у вас должно быть **2 открытых терминала**:

#### **Терминал 1 (бэкенд):**
- Сервер Django на порту **8000**
- Вывод логов и ошибок

#### **Терминал 2 (фронтенд):**
- HTTP-сервер на порту **8080**
- Обслуживает статические файлы

### **5. Откройте браузер и проверьте:**

#### **1. Фронтенд приложение:**
```
http://localhost:8080/
```

#### **2. Админ-панель Django:**
```
http://localhost:8000/admin/
```
- Логин: `admin`
- Пароль: ваш пароль

#### **3. REST API:**
```
http://localhost:8000/api/moods/
```

## 📋 **Быстрый запуск через скрипт**

### **Создайте скрипт запуска:**

```bash
cd ~/desktop/mood_habit_tracker
cat > start_project.sh << 'EOF'
#!/bin/bash
echo "=== ЗАПУСК ПРОЕКТА 'ДНЕВНИК НАСТРОЕНИЯ И ПРИВЫЧЕК' ==="
echo ""

# Активируем виртуальное окружение
source venv/bin/activate

echo "1. Запуск бэкенда (Django) на порту 8000..."
cd backend
python manage.py runserver &
BACKEND_PID=$!
echo "   ✅ Бэкенд запущен (PID: $BACKEND_PID)"

sleep 2

echo ""
echo "2. Запуск фронтенда на порту 8080..."
cd ../frontend
python -m http.server 8080 &
FRONTEND_PID=$!
echo "   ✅ Фронтенд запущен (PID: $FRONTEND_PID)"

echo ""
echo "================================================"
echo "✅ Проект успешно запущен!"
echo ""
echo "Откройте в браузере:"
echo "   • Фронтенд: http://localhost:8080/"
echo "   • Админка:  http://localhost:8000/admin/"
echo "   • API:      http://localhost:8000/api/moods/"
echo ""
echo "Для остановки нажмите Ctrl+C в этом окне"
echo "================================================"

# Ждем прерывания
trap "kill $BACKEND_PID $FRONTEND_PID; echo ''; echo '🛑 Проект остановлен'; exit" INT
wait
EOF

# Сделайте скрипт исполняемым
chmod +x start_project.sh
```

### **Запустите скрипт:**

```bash
cd ~/desktop/mood_habit_tracker
./start_project.sh
```

## 🔧 **Если возникают проблемы:**

### **Проблема: Порт уже используется**
```bash
# Найдите процесс, использующий порт
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :8080

# Убейте процесс
sudo kill -9 <PID>
```

### **Проблема: Нет виртуального окружения**
```bash
# Создайте заново
cd ~/desktop/mood_habit_tracker
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### **Проблема: Django не запускается**
```bash
# Проверьте миграции
cd backend
python manage.py makemigrations
python manage.py migrate

# Создайте суперпользователя (если нужно)
python manage.py createsuperuser

# Проверьте настройки
python manage.py check
```

## 🎯 **Быстрая команда для запуска:**

Если всё настроено, можно запускать одной командой:

```bash
# Терминал 1 - бэкенд
cd ~/desktop/mood_habit_tracker && source venv/bin/activate && cd backend && python manage.py runserver

# Терминал 2 - фронтенд  
cd ~/desktop/mood_habit_tracker && source venv/bin/activate && cd frontend && python -m http.server 8080
```

## 📊 **После успешного запуска:**

✅ **Бэкенд:** http://localhost:8000/  
✅ **Фронтенд:** http://localhost:8080/  
✅ **Админка:** http://localhost:8000/admin/  
✅ **API:** http://localhost:8000/api/moods/  

**Проект готов к демонстрации!** 🎉