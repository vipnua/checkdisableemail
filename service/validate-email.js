const { promisify } = require('util');
const dns = require('dns');
const net = require('net');
const emailCheck = require('email-check');

// Promisify dns.resolveMx() method
const resolveMx = promisify(dns.resolveMx);

// Validate email address format
function validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if domain is valid
async function isDomainValid(domain) {
    try {
        await resolveMx(domain);
        return true;
    } catch (error) {
        return false;
    }
}

// Check if email is disposable
function isEmailDisposable(email) {
    const disposableDomains = ['10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'temp-mail.org', 'yopmail.com', 'sharklasers.com', 'throwawaymail.com', 'getairmail.com', 'fakeinbox.com', 'tempinbox.com']; // Replace with your list of disposable domains
    const [, domain] = email.split('@');
    return disposableDomains.includes(domain);
}

// Check if email exists
async function doesEmailExist(email) {
    const [, domain] = email.split('@');
    const mxRecords = await resolveMx(domain);
    const socket = new net.Socket();
    let isEmailExists = false;

    for (let i = 0; i < mxRecords.length; i++) {
        const { exchange: smtpHost } = mxRecords[i];
        try {
            await new Promise((resolve) => socket.connect(25, smtpHost, resolve));
            await new Promise((resolve) =>
                socket.once('data', (data) => {
                    const code = parseInt(data.toString().substring(0, 3), 10);
                    if (code === 220) {
                        isEmailExists = true;
                    }
                    socket.end();
                    resolve();
                })
            );
            break;
        } catch (error) {
            // Do nothing, continue with the next MX record
        }
    }

    return isEmailExists;
}

// Check if email is live
async function checkEmailIsLive(email) {
    try {
        const result = await emailCheck(email);
        if (result == false) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

// Check email availability
async function checkEmailAvailability(email) {
    if (!validateEmailFormat(email)) {
        return { status: 'Invalid email format', email: email };
    }
    const [, domain] = email.split('@');

    if (!(await isDomainValid(domain))) {
        return { status: 'Invalid domain name', email: email };
    }

    if (isEmailDisposable(email)) {
        return { status: 'Disposable email address', email: email };
    }

    if (!(await doesEmailExist(email))) {
        return { status: 'Email does not exist', email: email };
    }

    if (!(await checkEmailIsLive(email))) {
        return { status: 'Email is disable or does not exist', email: email };
    }

    return { status: 'Email is valid', email: email };
}

module.exports = checkEmailAvailability;