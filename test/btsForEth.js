//const {randomBytes} = require('crypto')
const Apis = require('bitsharesjs-ws').Apis;
const TransactionBuilder = require('bitsharesjs').TransactionBuilder;
const ChainStore = require('bitsharesjs').ChainStore;
const FetchChain = require('bitsharesjs').FetchChain;
const PrivateKey = require('bitsharesjs').PrivateKey;
const hash = require('bitsharesjs').hash;
const bts = require('./bts')
const eth = require('./eth')
const prompt = require('./helper/prompt')
const web3 = require('web3')

async function btsForEth(htlc) {
  

  // configure the BTS party (both side)
  let btsSender = await prompt('Enter BTS account name of sender: ')
  let btsRecipient = await prompt('Enter BTS account name of recipient: ') 
  let value = await prompt('Enter BTS amount to send: ')
  let rate = await prompt('Enter the exchange rate both parties are agreed on: ')
  console.log("In order to log contract uniformly, we highly recommended generating secret in length of 32!");
  let secret = await prompt('Enter the preimage value you generate: ') 
  let time_lock = await prompt('Enter the expiration time you want to lock (in seconds): ')



  /* 
   * configure the ETH party(both side)
   * in this case we require the receiver side specify address
   * the comment code is use for other user,
   * since it involves important values in MetaMask wallet
   * for now it's only test locally
   */

  //let mnemonic = await prompt('Enter the secret mnemonics to get access to your metamask wallet: ')
  //let api_key = await prompt('Also specify your ropsten infrua api_key: ')
  //const ethWallet = eth.connectAcc(mnemonic, api_key, id)

  let id = await prompt('Enter the account id of ETH wallet (sender e.g. firstAcc is 0): ')
  let ethWallet = await eth.connectAcc(id);
  console.log('Ropsten ETH wallet address =', ethWallet);
  const ethRecipient = await prompt('Enter ETH address to receive funds: ')



  /* 
   * selling BTS buying ETH,
   * generate the htlc contract on BTS side
   */
  value = parseFloat(value);
  let Secret = new Buffer.from(secret).toString('hex');
  let hash_lock = hash.sha256(Secret);
  await bts.deployHTLC(btsSender, btsRecipient, hash_lock, value, time_lock, Secret)
      .then(async function(result){
          // resolve json response from bts HTLC and get the info we need
          let btsHtlcresponse = result;
          htlc = btsHtlcresponse[0].trx.operation_results[0];
          let btsHtlcid = htlc[1];
          console.log('BTS HTLC id:', btsHtlcid)
      })


  /* 
   * generate the hash value in bytes32 format,
   * time_lock value in minutes 
   * and create htlc contract
   */

  hash_lock = '0x' + Buffer.from(hash_lock).toString('hex')
  time_lock = parseInt(time_lock / 2) // this is to create less time than btsHTLC for bts side to redeem the contract
  let ethAmount = Math.fround(value * rate) ;
  const ethHtlcId = await eth.deployHTLC(ethWallet, ethRecipient, hash_lock, time_lock, ethAmount)



  


  // Keeping logs on console
 
  console.log('ETH HTLC id:', ethHtlcId);
  console.log(`Enter y if you want to redeem the agreed amount of ETH from contract: \n${ethHtlcId} \nOr enter exit if you want to quit: `);
  let answer = await prompt('> ')
  switch (answer) {
    case 'y':
      console.log('Resolving ETH HTLC...');
      await eth.resolveHTLC(ethRecipient, ethHtlcId, web3.utils.asciiToHex(secret))
      break
    case 'exit':
      console.log('Exiting...');
      break
      
  }
 
}




module.exports = btsForEth

