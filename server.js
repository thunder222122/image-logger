const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Get webhook URL from environment variable which u added
const WEBHOOK_URL = process.env.WEBHOOK_URL;

async function logVisitor(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toISOString();

    if (WEBHOOK_URL) {
        try {
            await axios.post(WEBHOOK_URL, {
                embeds: [{
                    title: '🚨 Link Clicked!',
                    color: 0xff0000,
                    fields: [
                        { name: 'IP Address', value: ip, inline: true },
                        { name: 'User-Agent', value: userAgent, inline: false },
                        { name: 'Time', value: time, inline: true },
                        { name: 'URL', value: req.url, inline: false }
                    ],
                    footer: { text: 'Link Logger' }
                }]
            });
            console.log(`[${time}] Logged visit from ${ip}`);
        } catch (error) {
            console.error('Webhook error:', error.message);
        }
    }

    next();
}

// Log ANY request to the logger
app.get('*', logVisitor, (req, res) => {
    // 1x1 transparent pixel
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': pixel.length
    });
    res.end(pixel);
});

app.listen(PORT, () => {
    console.log(`Logger running on port ${PORT}`);
});
