const bts = require('./bts')
const eth = require('./eth')
const btsHtlcresponse = require('./btsForEth').btsHtlcresponse
const prompt = require('./prompt')

async function ethForBts() {


  /* 
   * configure the ETH party(receiver)
   * the comment code is use for other user,
   * since it involves important values in MetaMask wallet
   * for now it's only test locally
   */
  //let mnemonic = await prompt('Enter the secret mnemonics to get access to your metamask wallet: ')
  //let api_key = await prompt('Also specify your ropsten infrua api_key: ')

  let id = await prompt('Enter the account id of recipient ETH wallet: ')
  //const ethWallet = eth.connectAcc(mnemonic, api_key, id)
  const ethWallet = await eth.connectAcc(id);
  console.log('Ropsten ETH wallet address =', ethWallet);

  /* 
   * specify contract information
   * the deployHTLC should return the htlc_id
   * check both HashSecret to see if they are match
   * maybe don't need client to input the preimage
   */
  const btsHtlcid = await prompt('Enter the BTS HTLC id: ')
  const ethHtlcAddress = await prompt('Enter the ETH HTLC address: ')
  console.log('\nBTS HTLC:');
  const btsHashSecret = await bts.verifyHTLC(btsHtlcid, btsHtlcresponse)
  console.log('\nETH HTLC:');
  const ethHashSecret = await eth.verifyHTLC(ethHtlcAddress)
  if (btsHashSecret !== ethHashSecret) {
    throw "Hashes don't match"
  }
  console.log(`\nIf details are correct then send the agreed amount of ETH to ${ethHtlcAddress}`);
  console.log('Waiting for ETH contract to be resolved...');

  // complete the transaction
  await eth.waitForHTLC(ethHtlcAddress)
    .then(async function(secret) {
      const btsRecipient = await prompt('Enter the BTS account name to send the funds to: ')
      await bts.resolveHTLC(btsHtlcid, btsRecipient, secret)
    })
    .catch(async function(err) {
      console.log(err);
      console.log('Refunding ETH...');
      await eth.refundHTLC(ethWallet, ethHtlcAddress)
    })
}

module.exports = ethForBts
