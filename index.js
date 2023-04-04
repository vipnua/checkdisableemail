const nodemailer = require('nodemailer');
const dns = require('dns');
const express = require("express")
const net = require('net');
const app = express();
app.use(express.json());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
});

const { promisify } = require('util');
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
async function checkEmailIsLive(email) {
    try {
        const result = await emailCheck(email);
        if (result == false) {
            return { error: 'Invalid email name' };
        }
        return result
    } catch (error) {
        return { error: error.message };
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
        return { status: "Error checking email availability", email: email };
    }
    if (!(await checkEmailIsLive(email) == true)) {
        return {
            status: "Invalid email name",
            email: email
        };
    }
    return {
        status: "Email is valid",
        email: email
    };
}

app.post('/check-mail', async (req, res) => {
    const emailList = req.body.email.split(" ");
    try {
      const results = [];
      for (let email of emailList) {
        const result = await checkEmailAvailability(email);
        results.push(result);
      }
  
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  


app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});

const port = 9000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
