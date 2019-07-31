const web3 = require('web3')
const crypto = require('crypto')

const random32 = () => crypto.randomBytes(32)
const bufToStr = b => b.toString('hex')
const sha256 = x =>
  crypto
    .createHash('sha256')
    .update(x)
    .digest()


let secret = "K!Q$]Z7Nyh%CTzw?3X*N)[]wnUVp_-$y";
const x = web3.utils.randomHex(32)
const toAscii = web3.utils.fromAscii(secret);
const buffer = '0x'+ new Buffer.from(secret).toString('hex');
const xhh = buffer.substring(2)
const bufferh = bufToStr(sha256(xhh))
const xh = sha256(random32())

console.log(x);
console.log(toAscii);
