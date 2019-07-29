//const {randomBytes} = require('crypto')
const Apis = require('bitsharesjs-ws').Apis;
const TransactionBuilder = require('bitsharesjs').TransactionBuilder;
const ChainStore = require('bitsharesjs').ChainStore;
const FetchChain = require('bitsharesjs').FetchChain;
const PrivateKey = require('bitsharesjs').PrivateKey;
const hash = require('bitsharesjs').hash;
const bts = require('./bts')
const eth = require('./eth')
const prompt = require('./prompt')

async function btsForEth() {

  /* 
   * configure the ETH party(sender)
   * the comment code is use for other user,
   * since it involves important values in MetaMask wallet
   * for now it's only test locally
   */

  //let mnemonic = await prompt('Enter the secret mnemonics to get access to your metamask wallet: ')
  //let api_key = await prompt('Also specify your ropsten infrua api_key: ')
  let id = await prompt('Enter the account id of ETH wallet (sender): ')
  //const ethWallet = eth.connectAcc(mnemonic, api_key, id)

  let ethWallet = await eth.connectAcc(id);
  console.log('Ropsten ETH wallet address =', ethWallet);



  // configure the BTS party (both side)
  let btsSender = await prompt('Enter BTS account name of sender: ')
  let btsRecipient = await prompt('Enter BTS account name of recipient: ')



  /* 
   * selling BTS buying ETH,
   * generate the htlc contract on BTS side
   */
  let value = await prompt('Enter BTS amount to send: ')
  value = parseFloat(value)
  const ethRecipient = await prompt('Enter ETH address to receive funds: ')
  let secret = await prompt('Enter the preimage value you generate: ') 
  const preimageValue = secret; // pass to bts_htlc


  //const secret = randomBytes(32)
  let time_lock = await prompt('Enter the expiration time you want to lock (in seconds): ')
  let hash_lock = hash.sha256(secret)
  // var excuted = await bts.deployHTLC(btsSender, btsRecipient, hash_lock, value, time_lock)
  // // we have 2 return values from the deploy function that we need.
  // const btsHtlcid = excuted.id;
  // const btsHtlcrespone = excuted.response;


  /* 
   * generate the hash value in bytes32 format,
   * time_lock value in minutes 
   * and create htlc contract
   */
  console.log('Secret:', '0x' + Buffer.from(secret).toString('hex'));
  hash_lock = '0x' + Buffer.from(hash_lock).toString('hex')
  time_lock = parseInt(time_lock / (60*2)) // this is for less time for bts side to redeem the contract
  const ethHtlcAddress = await eth.deployHTLC(ethWallet, ethRecipient, hash_lock, time_lock)

  // Keeping logs on console
  //console.log('BTS HTLC id:', btsHtlcid);
  console.log('ETH HTLC address:', ethHtlcAddress);
  console.log(`Enter 1 if agreed amount of ETH has been sent to ${ethHtlcAddress}`);
  let answer = await prompt('Or enter 2 to extend your HTLC contract before the timeout: ')
  switch (answer) {
    case '1':
      console.log('Resolving ETH HTLC...');
      await eth.resolveHTLC(ethWallet, ethHtlcAddress, '0x' + secret.toString('hex'))
      break
    case '2':
      Extratime = await prompt('Enter the extra time you need for contract (in seconds): ')
      await bts.extendHTLC(btsHtlcid, Extratime)
      break
  }
}

module.exports = btsForEth
