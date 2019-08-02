const Apis = require('bitsharesjs-ws').Apis;
const TransactionBuilder = require('bitsharesjs').TransactionBuilder;
const ChainStore = require('bitsharesjs').ChainStore;
const FetchChain = require('bitsharesjs').FetchChain;
const PrivateKey = require('bitsharesjs').PrivateKey;
const hash = require('bitsharesjs').hash;
//const btsForEth = require('./btsForEth') is wrong, we are not allowed to circular dependency
const fs = require('fs')

function log(message){
	fs.writeFileSync('contract_info.txt', message, 'utf8');
}
function logg(message){
	fs.writeFileSync('contract_extend_info.txt', message, 'utf8');
}
function logge(message){
	fs.writeFileSync('contract_redeem.txt', message, 'utf8');
}

/*
 * Here we need to specify the rpc_endpoint_url since I am using the local private testnet
 * you can change to your own network wss address
 * Keep the both side private key to perform the signature generate
 * could be update to input parameters.
 */
const rpc_endpoint_url = "ws://127.0.0.1:8090";
var sprivKey = "5Kecd9SoyHEYbSrUnadGzSokptuTWNMKi4M4CgXh7dSNSzLkNLq";
let spKey = PrivateKey.fromWif(sprivKey);
var rprivKey = "5Hwv9FXXrMd4o3FaHFJRLwuMmsihLz29bAGQYon4arK6ZzXCQhB";
let rpKey = PrivateKey.fromWif(rprivKey);
Apis.instance(rpc_endpoint_url, true).init_promise.then(
		res => {
			console.log("Successfully connected to BTS local test network.")
			return ChainStore.init(false);
		});

/* 
 * Instance the connection using the api
 * since I use the local private testnet the network_name is not defined
 * script adopted from bitsharesjs/examples/createHtlc.js
 * check your environment before use
 */


async function deployHTLC(sender, recipient, Hash, amount, timelock, secret){

				let fromAccount = sender;
				let toAccount = recipient;
				
				let time_lock = parseInt(timelock);
				let hash = Hash;

				return Promise.all([
					ChainStore.FetchChain("getAccount", fromAccount),
					ChainStore.FetchChain("getAccount", toAccount)
					]).then( res => {

						let [fromAccount, toAccount] =  res;

						let tr = new TransactionBuilder();

						let preimageValue = secret;
						let preimage_hash_calculated = hash;

						let operationJSON = {
							from: fromAccount.get("id"),
							to: toAccount.get("id"),
							fee: {
								amount: 0,
								asset_id: "1.3.0"
							},
							amount:{
								amount: amount,
								asset_id: "1.3.0"
							},
							preimage_hash: [2, preimage_hash_calculated],
							preimage_size: preimageValue.length,
							claim_period_seconds: time_lock
						};

						tr.add_type_operation("htlc_create", operationJSON);

						 return tr.set_required_fees().then( () =>{

							tr.add_signer(spKey, spKey.toPublicKey().toPublicKeyString());
							
							return tr

								.broadcast()
								.then (function(result) {
									console.log(
										"BTS HashTimelockContract was successfully created!" );
									return result
								})
								.catch( error => {
									console.error(error);
								})
						})
					});
				
			};


async function verifyHTLC(htlc_id){
				let id = htlc_id;

				return Promise.all([
					ChainStore.FetchChain("getObject", id)]).then( res => {
						return JSON.stringify(res)
						
					});

	// let response = Response;
	// const op = response[0].trx.operations[0];
	// const op_result = response[0].trx.operation_results[0];
	// const expiration = response[0].trx.expiration

	// const hash = op[1].preimage_hash[1];
	// var amount = op[1].amount.amount;
	// const accountId = op[1].from;
	// const timelock = op[1].claim_period_seconds;
	// let time_lock = parseInt(timelock);

	// const htlcId = op_result[1];


	// if(htlc_id != htlcId){
	// 	throw 'Hash Time lock Contract id does not match with current contract record'
	// }
	// console.log(`Transaction amount      | ${amount} BTS`);
	// console.log(`From Account id         | ${accountId}`);
	// console.log(`HashLock                | ${hash}`);
	// console.log(`Total timeLock(seconds) | ${time_lock}`);
	// console.log(`Expiration time         | ${expiration}`);

	// return hash;
}

async function resolveHTLC(Htlcid, Recipient, secret){
	
	let toAccount = Recipient;
				return Promise.all(
					[FetchChain("getAccount", toAccount)]).then (res => {

						let [toAccount] = res;

						let tr = new TransactionBuilder();

						let preimageValue = secret;

						let operationJSON = {

							preimage: new Buffer.from(preimageValue).toString("hex"),
							fee: 
							{
								amount: 0,
								asset_id: "1.3.0"
							},
							htlc_id: Htlcid,
							redeemer: toAccount.get("id"),
							extensions: null
						};

						// console.log(
						// 	"tx prior serialization \n", 
						// 	operationJSON);

						tr.add_type_operation("htlc_redeem", operationJSON);

						return tr.set_required_fees().then(() => {

							tr.add_signer(rpKey, rpKey.toPublicKey().toPublicKeyString());

							// console.log(
							// 	"serialized transaction: \n",
							// 	tr.serialize().operations
							// 	);

							return tr
								.broadcast()
								.then(result => {
									
										return "BTS HashTimelockContract was successfully redeemed! \n"+ JSON.stringify(result)
										

								})
								.catch(err => {
									console.error(err);
								});
						});

					});
				};

/*
 * Bitshares blockchain doesn't provide refund function
 * but allows sender to extend the contract expiration time as he/she wants
 * Taking transactionBuilder test code function as example
 */

async function extendHTLC(sender, id, seconds){
				let fromAccount = sender;

				return Promise.all([
					FetchChain("getAccount", fromAccount)]).then(res => {
						let [fromAccount] = res;

						let tr = new TransactionBuilder();
						let Htlc_id = id;
						let extend_time = parseInt(seconds);

						let operationJSON = {
							fee: {
								amount: 0,
								asset_id: "1.3.0"
							},
							htlc_id: Htlc_id,
							update_issuer: fromAccount.get("id"),
							seconds_to_add: extend_time,
							extensions: null
						};

						// console.log(
						// 	"extend operation serialization \n",
						// 	operationJSON );


						tr.add_type_operation("htlc_extend", operationJSON);

						return tr.set_required_fees().then(() => {
							tr.add_signer(spKey, spKey.toPublicKey().toPublicKeyString());

							// console.log(
							// 	"serialized transaction: \n",
							// 	tr.serialize().operations
							// 	);

							return tr
								.broadcast()
								.then(result => {
									const reply =  result[0].trx.expiration;
									return 
										"BTS HashTimelockContract was successfully extended! \nPlease redeem the contract before: " + reply
									
						})
								.catch(err => {
									console.error(err);
								});

					});
				});
};

	
async function refundHTLC(sender, id){
				let fromAccount = sender;

				return Promise.all([
					FetchChain("getAccount", fromAccount)]).then(res => {
						let [fromAccount] = res;

						let tr = new TransactionBuilder();
						let Htlc_id = id;

						let operationJSON = {
							fee: {
								amount: 0,
								asset_id: "1.3.0"
							},
							htlc_id: Htlc_id,
							to: fromAccount.get("id"),
							extensions: null
						};

						// console.log(
						// 	"extend operation serialization \n",
						// 	operationJSON );


						tr.add_type_operation("htlc_refund", operationJSON);

						return tr.set_required_fees().then(() => {
							tr.add_signer(spKey, spKey.toPublicKey().toPublicKeyString());

							// console.log(
							// 	"serialized transaction: \n",
							// 	tr.serialize().operations
							// 	);

							return tr
								.broadcast()
								.then(result => {
									
									return result
									
						})
								.catch(err => {
									console.error(err);
								});

					});
				});
};
	/*
	 * As I tried to update the log for verify HTLC to 
	 * get right information 
	 * after sender extend the contract,
	 * I notice the second time json response doesn't provide with operation results
	 * official bitsharesjs informed in the code to update the get_htlc function implementation someday
	 * wait for update
	 */

module.exports = {
	deployHTLC,
	verifyHTLC,
	resolveHTLC,
	extendHTLC
};