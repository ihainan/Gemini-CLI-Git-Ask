// service/tests/__mocks__/crypto.js

const mockHash = {
  update: jest.fn().mockReturnThis(),
  digest: jest.fn().mockReturnValue('deadbeefdeadbeefdeadbeefdeadbeefdeadbeef')
};

const createHash = jest.fn(function() {
  return mockHash;
});

const randomBytes = jest.fn().mockReturnValue(Buffer.from('random-bytes'));

const createHmac = jest.fn(function() {
  return mockHash;
});

const pbkdf2 = jest.fn().mockImplementation(function(password, salt, iterations, keylen, digest, callback) {
  callback(null, Buffer.from('mock-key'));
});

const scrypt = jest.fn().mockImplementation(function(password, salt, keylen, callback) {
  callback(null, Buffer.from('mock-key'));
});

module.exports = {
  createHash: createHash,
  randomBytes: randomBytes,
  createHmac: createHmac,
  pbkdf2: pbkdf2,
  scrypt: scrypt,
  default: {
    createHash: createHash,
    randomBytes: randomBytes,
    createHmac: createHmac,
    pbkdf2: pbkdf2,
    scrypt: scrypt
  }
}; 