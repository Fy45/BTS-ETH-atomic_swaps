const web3 = require('web3')
const crypto = require('crypto')

const random32 = () => crypto.randomBytes(32)
const bufToStr = b => b.toString('hex')
const sha256 = x =>
  crypto
    .createHash('sha256')
    .update(x)
    .digest()

const nowSeconds = () => Math.floor(Date.now() / 1000)


let secret = "K!Q$]Z7Nyh%CTzw?3X*N)[]wnUVp_-$y";
const x = web3.utils.randomHex(32)
const toAscii = web3.utils.fromAscii(secret);
const buffer = '0x'+ new Buffer.from(secret).toString('hex');
const xhh = buffer.substring(2)
const bufferh = bufToStr(sha256(xhh))
const xh = sha256(random32())

let timelock = nowSeconds()+ 275
let changed = timelock * 1000
let format = new Date(changed)
let floor = Math.floor((timelock-nowSeconds()))
let remain = Math.max(0, floor)

console.log(timelock);
console.log(changed);
console.log(format);
console.log(floor);
console.log(remain);
console.log(toAscii);
