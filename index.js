const express = require("express")
const app = express();
app.use(express.json());
const checkEmailAvailability = require('./service/validate-email');
const checkIpMiddleware = require('./service/checkip');
const geoIp = require("./service/geoIp");
app.use(checkIpMiddleware);
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

app.get('/check-ip', checkIpMiddleware, async (req,res)=>{
    const clientIp = req.clientIp;
    const dataIp = {
        geoIp : geoIp('2001:ee0:46e2:14c0:4187:2f49:123f:151b'),
        ipAddress : clientIp
    }
   return res.json(dataIp);
})
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
