-- Создание базы данных
CREATE DATABASE mood_tracker_db;

-- Подключение к базе данных
\c mood_tracker_db;

-- Таблица настроений
CREATE TABLE tracker_mood (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    emoji VARCHAR(5) NOT NULL,
    value INTEGER CHECK (value >= 1 AND value <= 10) NOT NULL
);

-- Вставка начальных данных
INSERT INTO tracker_mood (name, emoji, value) VALUES
('Отлично', '😊', 10),
('Хорошо', '🙂', 8),
('Нормально', '😐', 6),
('Плохо', '😕', 4),
('Ужасно', '😞', 2);

-- Расширение для хэширования паролей
CREATE EXTENSION IF NOT EXISTS pgcrypto;