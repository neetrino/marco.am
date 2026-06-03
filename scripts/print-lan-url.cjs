'use strict';

const { getPreferredLanIPv4 } = require('./lib/lan-ip.cjs');

const DEV_PORT = process.env.PORT || '3000';
const ip = getPreferredLanIPv4();

if (!ip) {
  console.warn('[lan:url] No LAN IPv4 found (Wi-Fi/Ethernet). Use http://localhost:' + DEV_PORT);
  process.exit(0);
}

const url = `http://${ip}:${DEV_PORT}`;
console.log('[lan:url] Phone / same Wi-Fi:', url);
console.log('[lan:url] Ignore Next.js "Network" if it shows 172.31.x.x (WSL/Hyper-V).');
