'use strict';

const os = require('os');

/** Adapters that are not reachable from phones/other devices on the LAN. */
const VIRTUAL_ADAPTER_PATTERN =
  /wsl|hyper-v|vethernet|docker|vmware|virtualbox|bluetooth|loopback|npcap|tunnel|tailscale|zerotier/i;

/** Typical physical LAN adapters (Windows, macOS, Linux). */
const PREFERRED_ADAPTER_PATTERN =
  /wi-?fi|wlan|wireless|ethernet|^eth\d|^en\d|^enp|^wl/i;

/**
 * Returns private IPv4 addresses from non-virtual network adapters.
 * Prefers Wi-Fi / Ethernet over Hyper-V / WSL virtual interfaces.
 *
 * @returns {string[]} Unique addresses, preferred first.
 */
function getPreferredLanIPv4Addresses() {
  const preferred = [];
  const fallback = [];
  const seen = new Set();

  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    if (!entries?.length || VIRTUAL_ADAPTER_PATTERN.test(name)) {
      continue;
    }

    const isPreferred = PREFERRED_ADAPTER_PATTERN.test(name);

    for (const entry of entries) {
      if (entry.internal || entry.family !== 'IPv4') {
        continue;
      }

      const address = entry.address;
      if (!isPrivateIpv4(address) || seen.has(address)) {
        continue;
      }

      seen.add(address);
      if (isPreferred) {
        preferred.push(address);
      } else {
        fallback.push(address);
      }
    }
  }

  return [...preferred, ...fallback];
}

/** @returns {string | null} Best LAN IPv4 for phone / same-Wi-Fi access. */
function getPreferredLanIPv4() {
  return getPreferredLanIPv4Addresses()[0] ?? null;
}

function isPrivateIpv4(address) {
  if (address.startsWith('10.') || address.startsWith('192.168.')) {
    return true;
  }

  const match = /^172\.(\d+)\./.exec(address);
  if (!match) {
    return false;
  }

  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
}

module.exports = {
  getPreferredLanIPv4,
  getPreferredLanIPv4Addresses,
  isPrivateIpv4,
};
