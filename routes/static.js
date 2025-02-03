// Импорт модулей
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Корневая папка для статических файлов
const publicDir = path.join(__dirname, '../public');
router.use(express.static(publicDir)); // Обработка статических файлов

// Роут для HTML-страниц без .html
router.get('/:page', (req, res, next) => {
    const { page } = req.params;
    const filePath = path.join(publicDir, `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            next(); // Если файл не найден, передаем обработку дальше (например, 404)
        }
    });
});

// Роут для корневой страницы (например, главной)
router.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'home.html'));
});

// Роут для изображений
router.get('/images/:folder/:filename', (req, res) => {
    const { folder, filename } = req.params;
    const filePath = path.join(publicDir, 'images', folder, filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Image not found' });
        }
    });
});

// Роут для видео
router.get('/videos/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(publicDir, 'videos', filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Video not found' });
        }
    });
});

export default router;
