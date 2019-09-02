const expect = require('expect')
const Web3 = require('web3')
const HDWalletProvider = require("truffle-hdwallet-provider");
const HTLC = require('../build/contracts/HashedTimelock')
const Ethereum = require('../src/eth.js')
const random32 = require('../src/helper/utils').random32
const newSecretHashPair = require('../src/helper/utils').newSecretHashPair
const getBalance = require('../src/helper/utils').getBalance

const HTLC_ADDR = '0x243785f6b65418191ea20b45fde7069ffe4f8cef'
const MNEMONIC = "cycle little able wish run zoo ethics twenty switch lava magnet jungle";
const ENV_API = "https://ropsten.infura.io/10347709826848a9a4347a1be1d02aa8"; 
const id = "0"; 
const Addr = "0xe2B1B5d92b64846D815cd34c674973f88DcefF4d"
const r_addr='0x209f4b189e246Ae171da5a6F1815c91C70CAA23A'

describe('connectAcc', async function() {
  it('loads user account',  async function() {
    Ethereum
    .connectAcc(MNEMONIC, ENV_API, id)
    .then(address => {
      expect(address).toEqual(Addr)
      done()
    })
  })
  it('throws if invalid Metamask mnemonic', async function(){
    const expectedError = 
    'Invalid Metamask mnemonic z x c v b n, please check'
    try{
      await Ethereum.connectAcc('z x c v b n', ENV_API, id)
      assert.fail(expectedError)
    }
    catch(err){
      assert.isFalse(err.message.startsWith('stop'))
    }
      
  })
  it('throws if invalid environment api',  async function(){
    const expectedError = 
    'Invalid environment api https://abc.testnet, please check'
     try{
       await Ethereum.connectAcc(MNEMONIC, 'https://abc.testnet', id)
       assert.fail(expectedError)
    }
    catch(err){
      assert.isFalse(err.message.startsWith('stop'))
    }
  })
  it('throws if load an invaild testnet account',  async function(){
    const expectedError = 
    'The provided account id x is invalid in this blockchain network, please check'
     try{ Ethereum.connectAcc(MNEMONIC, ENV_API, 'x')
       assert.fail(expectedError)
    }
    catch(err){
      assert.isFalse(err.message.startsWith('stop'))
    }
  })
})

describe('createHashedTimelockContract', async () => {
  it('submits new contract tx and returns contract id', done => {

    const provider = new HDWalletProvider(MNEMONIC, ENV_API, 0, 10);
    const web3 = new Web3(provider);
    const htlc = new web3.eth.Contract(HTLC, HTLC_ADDR)
    const contractId = random32().toString('hex')
    const txReceipt = {logs: [{args: {contractId: contractId}}]}
    htlc.methods.newContract = jest.fn(() => Promise.resolve(txReceipt))

    const hashX = random32().toString('hex')
    const amount = 0.01
    Ethereum
    .deployHTLC(MNEMONIC, ENV_API, Addr, r_addr, hashX, 10, amount)
    .then(newContractId => {
      expect(newContractId).toEqual(contractId)
      done()
    })
  })

  it('throws if HashValue is not a bytes 32 format',  async () =>{
    const expectedError = 
    'The Hash value is not in sha256Hash bytes32 format, please check'  
    const amount = 0.01 
    expect(() => Ethereum
      .deployHTLC(MNEMONIC, ENV_API, Addr, r_addr, 'abc', 10 , amount)).toThrowError(
      expectedError) 

    })
  it('throws if timelock is in the past', async () =>{
    const expectedError =
    'Expected failure due to past timelock, please check'
    const amount = 0.01
    const hashX = random32().toString('hex')
    expect(() => Ethereum
      .deployHTLC(MNEMONIC, ENV_API, Addr, r_addr, hashX, -1, amount)).toThrowError(
      expectedError)
    })
  it('throw if no money sent', async () =>{
    const expectedError = 
    'Expected failure due to 0 amount of value transferred'
    const hashX = random32().toString('hex')
    expect(() => Ethereum
      .deployHTLC(MNEMONIC, ENV_API, Addr, r_addr, hashX, 10, 0)).toThrowError(
      expectedError)
    })
})

describe('verifyHashedTimelockContract', async () =>{
  it('returns match Hashvalue with right contract id',  async function(){
    const hashX = random32().toString('hex')
    const amount = 0.01
    const contractId = await Ethereum.deployHTLC(MNEMONIC, ENV_API, Addr, r_addr, hashX, 10, amount)

    Ethereum
    .verifyHTLC(MNEMONIC, ENV_API, contractId)
    .then(hashValue =>{
      expect(hashValue).toEqual(hashX)
      done()
    })
  })
  it('throw if cotract does not exists', async () =>{
    const expectedError = 
    'Expected failure due to invalid contract id'
    expect(() => Ethereum
      .verifyHTLC(MNEMONIC, ENV_API, '0xabc1')).toThrowError(
      expectedError)
    })
})

describe('resolveHashTimelockContract',  async () =>{
 it('redeem successfully and returns correct recipient balance', async function(){
    const hashpair = newSecretHashPair()
    const amount = 0.01
    const recipient = Addr
    const contractId = await Ethereum.deployHTLC(MNEMONIC, ENV_API, r_addr, recipient, hashpair.hash, 10, amount)
    const provider = new HDWalletProvider(MNEMONIC, ENV_API, 0, 10);
    const web3 = new Web3(provider);

    const expectedBalance = getBalance(recipient)
    Ethereum
    .resolveHTLC(MNEMONIC, ENV_API, recipient, contractId, hashpair.secret)
    .then(balance => {

      expect(balance).toEqual(expectedBalance)
      done()
    })
   })

 it('throw if preimage does not match', async () =>{
    const hashpair = newSecretHashPair()
    const amount = 0.01
    const recipient = Addr
    const wrongSecret = random32().toString('hex')
    const contractId = await Ethereum.deployHTLC(MNEMONIC, ENV_API, r_addr, recipient, hashpair.hash, 10, amount)
    const expectedError =
    'Expected failure due to wrong secret'
    expect(() => Ethereum.resolveHTLC(MNEMONIC, ENV_API, recipient, contractId, wrongSecret)).toThrowError(
      expectedError)

   })

 it('throw if caller is not receiver', async () =>{
    const hashpair = newSecretHashPair()
    const amount = 0.01
    const recipient = Addr
    const contractId = await Ethereum.deployHTLC(MNEMONIC, ENV_API, r_addr, recipient, hashpair.hash, 10, amount)
    const expectedError =
    'Expected failure due to wrong recipient'
    expect(() => Ethereum.resolveHTLC(MNEMONIC, ENV_API, r_addr, contractId, hashpair.secret)).toThrowError(
      expectedError)
   })

 it('throw if timeout', async () =>{
    const hashpair = newSecretHashPair()
    const amount = 0.01
    const recipient = Addr
    const contractId = await Ethereum.deployHTLC(MNEMONIC, ENV_API, r_addr, recipient, hashpair.hash, 1, amount)
    // wait a second before we calling reslove function
    const expectedError =
    'Expected failure due to reslove after time expires'
    expect(() => Ethereum.resolveHTLC(MNEMONIC, ENV_API, recipient, contractId, hashpair.secret)).toThrowError(
      expectedError)
   })
})


describe('refundHashTimelockContract', async () =>{
  it('refund successfully and returns correct sender balance', async () =>{
    const hashpair = newSecretHashPair()
    const amount = 0.01
    const sender = Addr
    const contractId = await Ethereum.deployHTLC(MNEMONIC, ENV_API, sender, r_addr, hashpair.hash, 10, amount)
    const provider = new HDWalletProvider(MNEMONIC, ENV_API, 0, 10);
    const web3 = new Web3(provider);

    const expectedBalance = getBalance(sender)+amount
    Ethereum
    .refundHTLC(MNEMONIC, ENV_API, sender, contractId)
    .then(balance => {

      expect(balance).toEqual(expectedBalance)
      done()
    })
  })
  it('throw if timelock still remains', async () =>{
    const hashpair = newSecretHashPair()
    const amount = 0.01
    const sender = Addr
    const contractId = await Ethereum.deployHTLC(MNEMONIC, ENV_API, sender, r_addr, hashpair.hash, 1000, amount)

    const expectedError =
    'Expected failure due to refund before time expires'
    expect(() => Ethereum.refundHTLC(MNEMONIC, ENV_API, sender, contractId)).toThrowError(
      expectedError)

   })
})
