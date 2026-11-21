'use strict';

loadStockMindNavbar();
fetch('../components/footer.html')
    .then(response => response.ok ? response.text() : '')
    .then(html => { document.getElementById('footer-container').innerHTML = html; })
    .catch(() => {});

const draftDate = document.getElementById('contactDraftDate');
const today = new Date();
draftDate.dateTime = today.toISOString();
draftDate.textContent = new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', year:'numeric'}).format(today);

const form = document.getElementById('contactForm');
const statusLine = document.getElementById('contactStatus');
const sendButton = form.querySelector('button[type="submit"]');
const previews = Array.from(document.querySelectorAll('[data-preview]'), node => ({
    node, field: node.dataset.preview, placeholder: node.textContent
}));

function updatePreview() {
    const message = form.elements.message;
    document.getElementById('contactCount').textContent = message.value.length + ' / ' + message.maxLength;
    previews.forEach(({node, field, placeholder}) => {
        node.textContent = form.elements[field].value.trim() || placeholder;
    });
}

form.addEventListener('input', updatePreview);
window.addEventListener('pageshow', updatePreview);
updatePreview();
form.addEventListener('submit', async event => {
    event.preventDefault();
    sendButton.disabled = true;
    statusLine.hidden = false;
    statusLine.dataset.state = 'busy';
    statusLine.textContent = 'Sending your message…';
    try {
        const response = await fetch('../api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.reference) {
            throw new Error(result.error || 'The site server is unavailable. Your message has not been sent.');
        }
        statusLine.dataset.state = 'success';
        statusLine.textContent = 'Your message was sent to the Stock Mind team.';
        form.reset();
        updatePreview();
    } catch (error) {
        statusLine.dataset.state = 'error';
        statusLine.textContent = error instanceof TypeError
            ? 'Could not reach the server. Your message has not been sent.'
            : error.message;
    } finally {
        sendButton.disabled = false;
    }
});
