const btsForEth = require('./btsForEth')
const ethForBts = require('./ethForBts')
const prompt = require('./helper/prompt')
const eth = require('./eth')
const bts = require('./bts')

async function main() {

  console.log('Enter 1 to send BTS to ETH');
  console.log('      2 to receive BTS from ETH');
  console.log('      3 to extend BTS contract time');
  
  /* 
   * we don't have refund function in bitshares htlc contract,
   * the locked amount will return to depositor automatically when the timelock expires
   * so we are not necessary to have this function
   */
  let answer = await prompt('> ')
  switch (answer) {
    case '1':
      await btsForEth()
      break
    case '2':
      await ethForBts()
      break
    case '3':
      btsSender = await prompt('Enter your BTS account name: ')
      btsHtlcid = await prompt('Enter BTS HTLC_id you want to extend: ')
      Extratime = await prompt('Enter the extra time you need for contract (in seconds): ')
      await bts.extendHTLC(btsSender, btsHtlcid, Extratime);
      break


  }
  process.exit()
}

main().catch(err => {
  console.log(err);
  process.exit(1)
})
