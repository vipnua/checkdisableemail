const geoip = require('geoip-lite');
 // Địa chỉ IP muốn định vị
 // Định vị địa lý cho địa chỉ IP
const geoIp = (ip) =>{
return geo = geoip.lookup(ip);
}
module.exports = geoIp;