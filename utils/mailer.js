import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Проверяем, что переменные окружения не пустые
if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error("Ошибка: SMTP_USER или SMTP_PASSWORD отсутствуют.");
    process.exit(1);
}

console.log("Используем SMTP:");
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "******" : "NOT LOADED");

// Создаем transporter для Mail.ru
const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true, // Используем TLS
    auth: {
        user: process.env.SMTP_USER.trim(),
        pass: process.env.SMTP_PASSWORD.trim(),
    },
    tls: {
        rejectUnauthorized: false, // Отключает проверку сертификата (иногда помогает)
    }
});

/**
 * Функция для отправки email.
 * @param {string} to - Email получателя.
 * @param {string} subject - Тема письма.
 * @param {string} text - Текст письма.
 */
export const sendEmail = async (to, subject, text) => {
    try {
        console.log(`Отправка email на: ${to}`);
        console.log(`Отправитель: ${process.env.SMTP_USER}`);

        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject,
            text,
        });

        console.log(`Email успешно отправлен: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`Ошибка при отправке email: ${error.message}`);
        throw new Error('Не удалось отправить email');
    }
};
