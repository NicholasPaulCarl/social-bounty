// CommonJS shim for uuid v13 (ESM-only) so Jest can load it via
// moduleNameMapper without needing to transform node_modules.
// Only the v4 helper is used in the codebase (see grep in jest.config.ts).
const { randomUUID, randomBytes } = require('crypto');

function v4() {
  // Node 14.17+ / 15.6+ ships randomUUID natively and is RFC 4122 compliant.
  if (typeof randomUUID === 'function') {
    return randomUUID();
  }
  // Fallback: manual v4 from random bytes.
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return (
    hex.substring(0, 8) +
    '-' +
    hex.substring(8, 12) +
    '-' +
    hex.substring(12, 16) +
    '-' +
    hex.substring(16, 20) +
    '-' +
    hex.substring(20, 32)
  );
}

module.exports = { v4, default: { v4 } };
module.exports.v4 = v4;
