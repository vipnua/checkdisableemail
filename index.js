const express = require("express")
const app = express();
app.use(express.json());
const checkEmailAvailability = require('./service/validate-email');
const request = require('request')
const { performance } = require('perf_hooks');
const { SocksProxyAgent } = require('socks-proxy-agent');
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

app.post('/check-proxy-socks', async (req, res) => {
  try {
    const proxyStr = req.body.proxy;
    const [proxyUrl, proxyPort, proxyUser, proxyPass] = proxyStr.split(':');

    const proxyOptions = {
      hostname: proxyUrl,
      port: proxyPort,
      userId: '',
      password: '',
    };

    if (proxyUser && proxyPass) {
      proxyOptions.userId = proxyUser;
      proxyOptions.password = proxyPass;
    }

    const agent = new SocksProxyAgent(proxyOptions);

    console.log(proxyOptions);
    const options = {
      url: 'https://ipscore.io/api/v1/score?risk=1&vpn=1&seen=1&port=1',
      agent: agent, agentOptions: {
        rejectUnauthorized: true,
      },
    };

    const startTime = performance.now();
    const response = await new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
    const elapsedTime = performance.now() - startTime;

    res.setHeader('Content-Type', 'application/json');
    res.send({
      status: 'success',
      data: {
        response: response.body,
        elapsed_time: elapsedTime,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      status: 'error',
      message: err.message,
    });
  }
});

app.post('/check-proxy-https', async (req, res) => {
  try {
    const proxyStr = req.body.proxy;
    const [proxyUrl, proxyPort, proxyUser, proxyPass] = proxyStr.split(':');

    const options = {
      url: 'https://ipscore.io/api/v1/score?risk=1&vpn=1&seen=1&port=1',
      proxy: `http://${proxyUrl}:${proxyPort}`,
      headers: {},
      timeout: 3000
    };

    if (proxyUser && proxyPass) {
      options.headers['Proxy-Authorization'] = 'Basic ' + Buffer.from(proxyUser + ':' + proxyPass).toString('base64');
    }
    const start = performance.now();
    request(options, (error, response, body) => {
      const end = performance.now();
      const time = (end - start).toFixed();
      if (error) {
        console.error(error);
        res.status(500).send('Cannot connect to proxy server');
      } else {
        const result = JSON.parse(body);
        result.response_time = time; // Thêm thông báo response time vào body của phản hồi
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(result));
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});




app.post('/check-mail', async (req, res) => {
  const emailList = req.body.email.split(" ").join("\n").split("\n");
  const verifiedEmailList = [];
  try {
    const results = [];
    for (let email of emailList) {
      if (!verifiedEmailList.includes(email)) {
        const result = await checkEmailAvailability(email);
        results.push(result);
        verifiedEmailList.push(email);
      }
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
