const web3 = require('web3')
const crypto = require('crypto')
const xy = require('./2')
const random32 = () => crypto.randomBytes(32)
const bufToStr = b => b.toString('hex')
const sha256 = x =>
  crypto
    .createHash('sha256')
    .update(x)
    .digest()

const nowSeconds = () => Math.floor(Date.now() / 1000)

let secret = "f.vfAhRC.xw=Y-x22pMV9H9U<+V7!Mbr";
const x = web3.utils.randomHex(32)
const toAscii = web3.utils.fromAscii(secret);
const n = toAscii.substring(2)
const buffer = new Buffer.from(secret).toString('hex').length;
//const xhh = buffer.substring(2)
//const bufferh = bufToStr(sha256(xhh))
const xh = sha256(random32())

let timelock = nowSeconds()+ 275
let changed = timelock * 1000
let format = new Date(changed)
let floor = Math.floor((timelock-nowSeconds()))
let remain = Math.max(0, floor)
xy.xx().then(res =>{
	console.log(res);
})

console.log(timelock);
console.log(changed);
console.log(format);
console.log(floor);
console.log(buffer);
console.log(toAscii);
