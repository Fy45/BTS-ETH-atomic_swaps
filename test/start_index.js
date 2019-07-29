const bts = require('./bts')
const btsForEth = require('./btsForEth')
const ethForBts = require('./ethForBts')
const prompt = require('./prompt')

async function main() {
  console.log('Enter 1 to send BTS to ETH');
  console.log('      2 to receive BTS from ETH');
  
  /* we don't have refund function in bitshares htlc contract,
   * the locked amount will return to depositor automatically when the timelock expires
   * so we are not necessary to have this function
   */
  const answer = await prompt('> ')
  switch (answer) {
    case '1':
      await btsForEth()
      break
    case '2':
      await ethForBts()
      break
  }
  process.exit()
}

main().catch(err => {
  console.log(err);
  process.exit(1)
})
