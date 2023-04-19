const ProxyChecker = require('socks-proxy-checker');

const checkProtocol = (proxy) => {
  ProxyChecker.check(proxy)
    .then((result) => {
      console.log(`Proxy ${proxy} supports ${result.protocol} protocol`);
    })
    .catch((error) => {
      console.error(`Error checking proxy ${proxy}: ${error.message}`);
    });
};
