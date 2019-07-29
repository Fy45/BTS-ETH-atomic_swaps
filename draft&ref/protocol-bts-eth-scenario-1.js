const Apis = require('bitsharesjs-ws').Apis;
const TransactionBuilder = require('bitsharesjs').TransactionBuilder;
const ChainStore = require('bitsharesjs').ChainStore;
const FetchChain = require('bitsharesjs').FetchChain;
const PrivateKey = require('bitsharesjs').PrivateKey;
const hash = require('bitsharesjs').hash;



const Web3 = require('web3');
const expect = require('expect');
const Promise = require('bluebird');

import Config from '../src/config'
import Trade from '../src/trade'
import Protocol from '../src/protocol'

import {newSecretHashPair} from '../src/utils'

/**
 * An end-to-end full test of scenario 1 of the protocol documented at
 * https://www.14yhl9t.com/
 *
 * Runs against local bitshares and Ethereum nodes both of which need to be started
 * before the script is run.
 */

/*
 * Ethereum Accounts
 * Api_key from infrua 10347709826848a9a4347a1be1d02aa8
 * using ropsten testnet
 */

const url = "https://ropsten.infura.io/v3/10347709826848a9a4347a1be1d02aa8"
const web3 = new Web3(new Web3.providers.HttpProvider(url)
const eSellerAddr = web3.eth.accounts[0]
const eBuyerAddr = web3.eth.accounts[1]

/*
 * bitshares Accounts
 * local private testnet 127.0.0.1:8090
 */
const wss_url = "wss://127.0.0.1:8090";
var privKey = "5Kecd9SoyHEYbSrUnadGzSokptuTWNMKi4M4CgXh7dSNSzLkNLq";
let pKey = PrivateKey.fromWif(privKey);
const bSellerAcc = sdk.Keypair.random()
const bBuyerAcc = sdk.Keypair.random()

/*
 * Hashlock preimage and hash for the trade
 */
const {secret: preImageStr, hash: hashXStr} = newSecretHashPair()

/*
 * Trade definition
 */
const initialTrade = {
  initialSide: Protocol.TradeSide.BITSHARES,
  timelock: Date.now() + 1200,
  commitment: hashXStr.substring(2), // slice off prefix '0x'
  bitshares: {
    token: 'BTS',
    amount: 237.799,
    depositor: bSellerAcc.publicKey(),
    withdrawer: bBuyerAcc.publicKey(),
  },
  ethereum: {
    token: 'ETH',
    amount: 0.05,
    depositor: eSellerAddr,
    withdrawer: eBuyerAddr,
  },
}

/*
 * Config for each party
 */

// party1: selling XLM, buying ETH
const configParty1 = {
  bitsharesNetwork: 'Testnet',
  bitsharesAccountSecret: sSellerKP.secret(),
  ethereumNetwork: 'ropsten',
  ethereumRPC: 'http://localhost:8545',
  ethereumPublicAddress: eBuyerAddr,
}

// party2: selling ETH, buying XLM
const configParty1 = {
  bitsharesNetwork: 'Testnet',
  bitsharesAccountSecret: sBuyerKP.secret(),
  ethereumNetwork: 'ropsten',
  ethereumRPC: 'http://localhost:8545',
  ethereumPublicAddress: eSellerAddr,
}

const log = msg => console.info(`INFO: ${msg}`)
// const logError = msg => console.error(`ERROR: ${JSON.stringify(msg, null, 2)}`)

const main = async () => {
  /*
   * Party 1 initiates trade with create_htlc method
   */
  const config1 = new Config(configParty1)
  let trade1 = new Trade(initialTrade)
  const protocol1 = new Protocol(config1, trade1)
  expect(await protocol1.status()).toEqual(Protocol.Status.INIT)

  trade1 = await protocol1.stellarPrepare()
  log(`trade id generated: ${trade1.id}`)
  log(
    `stellar holding account created: ${protocol1.trade.stellar.holdingAccount}`
  )
  expect(await protocol1.status()).toEqual(
    Protocol.Status.STELLAR_HOLDING_ACCOUNT
  )

  /*
   * Party 2 receives the trade file and checks the status
   */
  let trade2 = trade1 // party 1 sends trade def to party 2
  const config2 = new Config(configParty2)
  const protocol2 = new Protocol(config2, trade2)
  expect(await protocol2.status()).toEqual(
    Protocol.Status.STELLAR_HOLDING_ACCOUNT
  )
  log(`party2 imported and checked the trade status`)

  /*
   * Party 2 generates the refund tx envelope for Party 1 (2.4)
   */
  trade2.stellar.refundTx = await protocol2.stellarRefundTx()
  expect(await protocol2.status()).toEqual(Protocol.Status.STELLAR_REFUND_TX)
  log(`refund tx for party 1 created: [${trade2.stellar.refundTx}]`)

  /*
   * Party 1 receives the refund tx then deposits XLM into holding account (2.5)
   */
  trade1.stellar.refundTx = trade2.stellar.refundTx // party 2 sends tx to party 1
  expect(await protocol1.status()).toEqual(Protocol.Status.STELLAR_REFUND_TX)
  // TODO:
  //  protocol.validate the refundtx !
  await protocol1.stellarDeposit()
  expect(await protocol1.status()).toEqual(Protocol.Status.STELLAR_DEPOSIT)
  expect(await protocol2.status()).toEqual(Protocol.Status.STELLAR_DEPOSIT)
  log(`party1 deposited XLM`)

  /*
   * Party 2 creates the HTLC and deposits ETH (2.6)
   */
  const htlcId = await protocol2.ethereumPrepare()
  log(`htlc created: ${htlcId}`)
  expect(await protocol2.status()).toEqual(Protocol.Status.ETHEREUM_HTLC)
  expect(await protocol1.status()).toEqual(Protocol.Status.ETHEREUM_HTLC)

  /*
   * Party 1 withdraws the ETH revealing the preimage (3.1)
   */
  const ethWithdrawTxHash = await protocol1.ethereumFulfill(preImageStr)
  log(`ETH withdrawn (tx:${ethWithdrawTxHash}`)
  expect(await protocol1.status()).toEqual(Protocol.Status.ETHEREUM_WITHDRAW)
  expect(await protocol2.status()).toEqual(Protocol.Status.ETHEREUM_WITHDRAW)

  /*
   * Party 2 withdraws the XLM with the revealed preimage (3.2)
   */
  // TODO: pull the preimage from the events log ...
  //        for now cheat and just plug it in ..
  const stellarWithdrawTxHash = await protocol2.stellarFulfill(preImageStr)
  log(`XLM withdrawn (tx:${stellarWithdrawTxHash}`)
  expect(await protocol2.status()).toEqual(Protocol.Status.FINALISED)
  expect(await protocol1.status()).toEqual(Protocol.Status.FINALISED)

  log(`FINALISED!`)
}

/*
 * Main - give both stellar accounts some Lumens then run main()
 */
const stellar = new sdk.Server('http://localhost:8000', {allowHttp: true})
Promise.all([
  stellar.friendbot(sBuyerKP.publicKey()).call(),
  stellar.friendbot(sSellerKP.publicKey()).call(),
]).then(main)
