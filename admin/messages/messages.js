'use strict';

fetch('../components/sidebar.html', { cache: 'no-store' })
    .then(response => response.ok ? response.text() : '')
    .then(html => {
        document.getElementById('sidebar').innerHTML = html;
        document.dispatchEvent(new Event('adminSidebarReady'));
    })
    .catch(() => {});

const access = document.getElementById('inboxAccess');
const input = document.getElementById('inboxKey');
const statusLine = document.getElementById('inboxStatus');
const panel = document.getElementById('inboxPanel');
const messages = document.getElementById('inboxMessages');
let inboxKey = '';

async function inboxRequest(suffix = '', method = 'GET') {
    const response = await fetch('../../api/admin/contact' + suffix, {
        method,
        headers: { Authorization: 'Bearer ' + inboxKey }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) {
            inboxKey = '';
            messages.replaceChildren();
            panel.hidden = true;
            access.hidden = false;
        }
        throw new Error(result.error || 'The inbox server is unavailable.');
    }
    return result;
}

function text(tag, value, className) {
    const node = document.createElement(tag);
    node.textContent = value;
    if (className) node.className = className;
    return node;
}

function reportError(error) {
    statusLine.dataset.state = 'error';
    statusLine.textContent = error.message;
}

function renderInbox(entries) {
    messages.replaceChildren();
    const unread = entries.filter(entry => !entry.readAt).length;
    statusLine.dataset.state = 'success';
    statusLine.textContent = entries.length ? unread + ' unread · ' + entries.length + ' total' : 'No messages yet.';
    for (const entry of entries) {
        const row = document.createElement('details');
        row.className = 'contact-card inbox-entry';
        const summary = document.createElement('summary');
        summary.append(text('span', entry.subject), text('small', entry.readAt ? 'Read' : 'New', 'inbox-badge'));
        const sender = text('p', entry.name + ' · ' + entry.email + ' · ' + new Date(entry.createdAt).toLocaleString(), 'inbox-sender');
        const body = text('p', entry.message, 'inbox-body');
        const reply = text('a', 'Reply by email', 'inbox-reply');
        reply.href = 'mailto:' + encodeURIComponent(entry.email).replace(/%40/g, '@') + '?subject=' + encodeURIComponent('Re: ' + entry.subject);
        row.append(summary, sender, body, reply);
        row.addEventListener('toggle', async () => {
            if (!row.open || entry.readAt) return;
            try {
                await inboxRequest('/' + encodeURIComponent(entry.id), 'PATCH');
                entry.readAt = new Date().toISOString();
                summary.querySelector('small').textContent = 'Read';
                const remaining = entries.filter(message => !message.readAt).length;
                statusLine.textContent = remaining + ' unread · ' + entries.length + ' total';
            } catch (error) { reportError(error); }
        });
        messages.append(row);
    }
}

async function refreshInbox() {
    const result = await inboxRequest();
    if (!Array.isArray(result.messages)) throw new Error('The inbox server is unavailable.');
    access.hidden = true;
    panel.hidden = false;
    renderInbox(result.messages);
}

access.addEventListener('submit', async event => {
    event.preventDefault();
    const button = access.querySelector('button');
    button.disabled = true;
    inboxKey = input.value.trim();
    try { await refreshInbox(); input.value = ''; }
    catch (error) { reportError(error); }
    finally { button.disabled = false; }
});
document.getElementById('inboxRefresh').addEventListener('click', () => refreshInbox().catch(reportError));
