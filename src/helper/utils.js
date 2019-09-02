const crypto = require('crypto')

// Format required for sending bytes through eth client:
//  - hex string representation
//  - prefixed with 0x
const bufToStr = b => '0x' + b.toString('hex')

const sha256 = x =>
  crypto
    .createHash('sha256')
    .update(x)
    .digest()

const random32 = () => crypto.randomBytes(32)

const isSha256Hash = hashStr => /^0x[0-9a-f]{64}$/i.test(hashStr)

const newSecretHashPair = () => {
  const secret = random32()
  const hash = sha256(secret)
  return {
    secret: bufToStr(secret),
    hash: bufToStr(hash),
  }
}

const nowSeconds = () => Math.floor(Date.now() / 1000)

const txGas = (txReceipt, gasPrice = defaultGasPrice) => web3.utils.toBN(txReceipt.receipt.gasUsed * gasPrice)
const txLoggedArgs = txReceipt => txReceipt.logs[0].args
const txContractId = txReceipt => txLoggedArgs(txReceipt).contractId

const htlcArrayToObj = c => {
  return {
    sender: c[0],
    receiver: c[1],
    amount: c[2],
    hashlock: c[3],
    timelock: c[4],
    withdrawn: c[5],
    refunded: c[6],
    preimage: c[7],
  }
}


const getBalance = async (address) => web3.utils.toBN(await web3.eth.getBalance(address))

module.exports = {
newSecretHashPair,
htlcArrayToObj,
random32,
sha256,
getBalance
}
