const fs = require('fs')
const Eth = require('web3')
const HDWalletProvider = require("truffle-hdwallet-provider")
MY_SECRET_MNEMONIC = "cycle little able wish run zoo ethics twenty switch lava magnet jungle";
env_api = "https://ropsten.infura.io/10347709826848a9a4347a1be1d02aa8";

const HTLC_abi = require('../build/contracts/HTLC')
const HTLC_bin = fs.readFileSync(__dirname + '/../build/contracts/HTLC.bin').toString()

/*
 * the function connectAcc() and getAcc() aim to 
 * connect to ropsten testnet using metamask account info
 * and get the send/receive account as desired
 * the first account id is 0
 * the commented line are meant for other users
 * till now is test only
 */
// async function connectAcc(mnemonic, api_key, id) {
//   MY_SECRET_MNEMONIC = mnemonic;
//   env_api = api_key;
//   provider = new HDWalletProvider(MY_SECRET_MNEMONIC, env_api);
//   const eth = new Eth(provider);
//   eth.eth.getAccounts().then( function(e) => {
//     getAcc(e,id);
//   });
// }

function connectAcc() {
  provider = new HDWalletProvider(MY_SECRET_MNEMONIC, env_api);
  const eth = new Eth(provider);
  eth.eth.getAccounts().then(res =>{
    getAddr(res,id);
    //console.log("account used:", res[id]);
  });
  
}
async function getAddr(res,id){
  acc = res[id];
  return acc;
}


/*
 * deployHTLC pass one more parameter: time_lock
 * format is the string number
 * e.g. 30
 * it will pass as the unlock time = now + 30 mins in contract
 */

async function deployHTLC(sender, recipient, hash, time_lock) {
  console.log('Deploying ETH HTLC contract...');
  const HTLC = new eth.Contract(HTLC_abi)
  const contract = await HTLC.deploy({
    data: '0x' + HTLC_bin,
    arguments: [recipient, hash, time_lock]
  }).send({
    from: sender,
    gas: 4e5
  })
  return contract.options.address
}

async function verifyHTLC(address) {
  const contract = new eth.Contract(HTLC_abi, address)
  const hashSecret = await contract.methods.hashSecret().call()
  let unlockTime = await contract.methods.unlockTime().call()
  unlockTime = new Date(unlockTime * 1000)
  console.log(`Hash root     | ${hashSecret}`)
  console.log(`Unlock time   | ${unlockTime} (~ ${Math.max(0, Math.floor((unlockTime-Date.now())/6e4))} mins)`)
  return hashSecret
}

async function resolveHTLC(sender, address, secret) {
  const contract = new eth.Contract(HTLC_abi, address)
  await contract.methods.resolve(secret).send({
    from: sender,
    gas: 5e4
  })
}

async function waitForHTLC(address) {
  const contract = new eth.Contract(HTLC_abi, address)
  const unlockTime = await contract.methods.unlockTime().call()
  return new Promise((resolve, reject) => {
    const poll = setInterval(async function() {
      const secret = await contract.methods.secret().call()
      const block = await eth.getBlock('latest')
      if (secret !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        clearInterval(poll)
        resolve(secret)
      } else if (block.timestamp > unlockTime) {
        clearInterval(poll)
        reject('ETH HTLC timed out')
      }
    }, 5e3)
  })
}

async function refundHTLC(sender, address) {
  const contract = new eth.Contract(HTLC_abi, address)
  await contract.methods.refund().send({
    from: sender,
    gas: 5e4
  })
}

module.exports = {
  connectAcc,
  getAddr,
  deployHTLC,
  verifyHTLC,
  resolveHTLC,
  waitForHTLC,
  refundHTLC
}
