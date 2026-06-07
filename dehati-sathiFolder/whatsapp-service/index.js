const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Initialize WhatsApp Client with LocalAuth to persist session
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

let isClientReady = false;

client.on('qr', (qr) => {
    console.log('SCAN THIS QR CODE WITH YOUR WHATSAPP TO LOG IN:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Client is READY!');
    isClientReady = true;
});

client.on('authenticated', () => {
    console.log('WhatsApp Client Authenticated successfully.');
});

client.on('auth_failure', (msg) => {
    console.error('WhatsApp Authentication failure', msg);
});

client.initialize();

// API Endpoint to send OTP
app.post('/send-otp', async (req, res) => {
    try {
        const { to, code } = req.body;

        if (!to || !code) {
            return res.status(400).json({ error: 'Missing "to" or "code" in request body' });
        }

        if (!isClientReady) {
            return res.status(503).json({ error: 'WhatsApp client is not ready yet. Please scan the QR code in the terminal.' });
        }

        // WhatsApp IDs are formatted as "number@c.us"
        // Ensure "to" starts with country code, e.g., "91" for India.
        const formattedNumber = to.replace(/[^0-9]/g, '');
        const chatId = `${formattedNumber}@c.us`;

        const message = `*Dehati Sathi*\n\nYour Login OTP is: *${code}*\n\nPlease do not share this code with anyone.`;

        await client.sendMessage(chatId, message);
        console.log(`OTP sent successfully to ${to}`);
        
        res.status(200).json({ success: true, message: 'OTP sent' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

app.listen(PORT, () => {
    console.log(`WhatsApp Microservice running on http://localhost:${PORT}`);
});
