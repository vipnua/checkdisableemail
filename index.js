const express = require("express")
const app = express();
app.use(express.json());
const geoIp = require('./service/geoIp')
const checkEmailAvailability = require('./service/validate-email');
const checkProxy = require('./service/check-proxy');
const request = require('request')
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
app.get('/api/proxy',async(req,res)=>{
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const geo = geoIp(clientIp)
   const data ={ip:clientIp,geo} ;
    res.send(data);
})
app.post('/check-proxy', async (req, res) => {
    try {
      const { proxy, proxyUser, proxyPass } = req.body;
  
      const options = {
        url: 'http://localhost:9000/api/proxy',
        proxy: `http://${proxyUser}:${proxyPass}@${proxy}`,
      };
  
      // Make request to get IP address using proxy
      request(options, (error, response, body) => {
        if (error) {
          console.error(error);
          return res.status(500).send('Error');
        }
        console.log(`Proxy IP address: ${body}`);
        res.send(body);
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
