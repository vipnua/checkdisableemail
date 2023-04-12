const net = require('net');
const ip = require('ip');
const ipaddr = require('ipaddr.js');

const checkIpMiddleware = (req, res, next) => {
  let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Kiểm tra xem địa chỉ IP có phải là IPv6 hay không
  if (net.isIPv6(clientIp)) {
    // Nếu địa chỉ IP là IPv6, ta sẽ chuyển đổi địa chỉ IP sang định dạng yêu cầu
    if (ip.isV6Format(clientIp)) {
      clientIp = ipaddr.parse(clientIp).toIPv6Address().toString();
    }
  }

  req.clientIp = clientIp;
  next();
};

module.exports = checkIpMiddleware;
