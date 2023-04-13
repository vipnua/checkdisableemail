const checkIp = (req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  req.clientIp = clientIp;
  next();
};

module.exports = checkIp;
