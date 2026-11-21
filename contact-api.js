'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function createContactApi({ send, fail, json }) {
    const directory = process.env.STOCKMIND_CONTACT_DIR || path.join(os.homedir(), '.stockmind', 'contact');
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    const inboxPath = path.join(directory, 'inbox.json');
    const keyPath = path.join(directory, 'admin-key.txt');
    if (!fs.existsSync(keyPath)) {
        try { fs.writeFileSync(keyPath, crypto.randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 }); }
        catch (error) { if (error.code !== 'EEXIST') throw error; }
    }
    const key = Buffer.from(fs.readFileSync(keyPath, 'utf8').trim());
    let inbox = fs.existsSync(inboxPath) ? JSON.parse(fs.readFileSync(inboxPath, 'utf8')) : [];
    const recent = new Map();

    function requireInboxKey(req) {
        const given = Buffer.from((req.headers.authorization || '').replace(/^Bearer /i, ''));
        if (given.length !== key.length || !crypto.timingSafeEqual(given, key)) {
            fail(401, 'Enter the administrator inbox key.');
        }
    }

    function save(next) {
        const temporary = inboxPath + '.tmp';
        fs.writeFileSync(temporary, JSON.stringify(next, null, 2), { mode: 0o600 });
        fs.renameSync(temporary, inboxPath);
        inbox = next;
    }

    return async function contactApi(req, res, route) {
        if (route === '/api/contact' && req.method === 'POST') {
            const now = Date.now();
            const address = req.socket.remoteAddress;
            for (const [ip, count] of recent) if (count.expires <= now) recent.delete(ip);
            const count = recent.get(address) || { expires: now + 600000, attempts: 0 };
            recent.set(address, count);
            if (++count.attempts > 12) fail(429, 'Please wait a few minutes before trying again.');

            const data = await json(req);
            const limits = { name: 100, email: 254, subject: 140, message: 2000 };
            const fields = {};
            for (const [field, max] of Object.entries(limits)) {
                const value = typeof data?.[field] === 'string' ? data[field].trim() : '';
                if (!value || value.length > max) fail(400, 'Check each field and try again.');
                fields[field] = value;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || fields.message.length < 10) {
                fail(400, 'Enter a valid email and a message of at least 10 characters.');
            }
            const entry = { id: crypto.randomUUID(), ...fields, createdAt: new Date().toISOString(), readAt: null };
            save([entry, ...inbox]);
            send(res, 201, { reference: entry.id });
            return true;
        }

        if (route === '/api/admin/contact' && req.method === 'GET') {
            requireInboxKey(req);
            send(res, 200, { messages: inbox });
            return true;
        }

        const match = route.match(/^\/api\/admin\/contact\/([a-f0-9-]+)$/);
        if (match && req.method === 'PATCH') {
            requireInboxKey(req);
            const entry = inbox.find(message => message.id === match[1]);
            if (!entry) fail(404, 'Message not found.');
            if (!entry.readAt) {
                save(inbox.map(message => message.id === entry.id ? { ...message, readAt: new Date().toISOString() } : message));
            }
            send(res, 200, { ok: true });
            return true;
        }
        return false;
    };
}

module.exports = { createContactApi };
