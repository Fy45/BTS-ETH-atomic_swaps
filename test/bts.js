const Apis = require('bitsharesjs-ws').Apis;
const TransactionBuilder = require('bitsharesjs').TransactionBuilder;
const ChainStore = require('bitsharesjs').ChainStore;
const FetchChain = require('bitsharesjs').FetchChain;
const PrivateKey = require('bitsharesjs').PrivateKey;
const hash = require('bitsharesjs').hash;
//const btsForEth = require('./btsForEth') is wrong, we are not allowed to circular dependency
const web3 = require('web3')

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

				Promise.all([
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

						tr.set_required_fees().then( () =>{

							tr.add_signer(spKey, spKey.toPublicKey().toPublicKeyString());
							// console.log(

							// 	"serialized transaction: \n",
							// 	tr.serialize().operations

							// 	);

							tr

								.broadcast()
								.then (result => {
									console.log(
										"HashTimelockContract was successfully created!" );
									console.log("HTLC contract id: ", getHtlcId(result).id);
									console.log("HTLC response: ", getHtlcId(result).response);
								})
								.catch( error => {
									console.error(error);
								});
						});
					});
			};

function getHtlcId(res){
	const response = JSON.stringify(res);
	const result = res[0].trx.operation_results[0];
	const htlc_id = result[1];

	return {
		id:htlc_id, 
		response:response
	};
}

async function verifyHTLC(htlc_id, Response){
	let response = JSON.parse(Response);
	const op = response[0].trx.operations[0];
	const op_result = res[0].trx.operation_results[0];
	const hash = op[1].preimage_hash[1];
	var timelock = op[1].claim_period_seconds;
	var amount = op[1].amount.amount;
	const accountId = op[1].from;
	const htlcId = op_result[1];

	let time_lock = parseInt(timelock);

	if(htlc_id != htlcId){
		throw 'Hash Time lock Contract id does not match'
	}
	console.log("Please check the following conditions: \n");
	console.log("Transaction amount: ", amount);
	console.log("From Account id: ", accountId);
	console.log("Preimage hashed value: ", hash);
	console.log("Expiration time left (in seconds): ", time_lock);

	return hash;
}

async function resolveHTLC(Htlcid, Recipient, secret){
	const preimage = web3.utils.toAscii(secret);
	let toAccount = Recipient;
				Promise.all(
					[FetchChain("getAccount", toAccount)]).then (res => {

						let [toAccount] = res;

						let tr = new TransactionBuilder();

						let preimageValue = preimage;

						let operationJSON = {

							preimage: new Buffer(preimageValue).toString("hex"),
							fee: 
							{
								amount: 0,
								asset_id: "1.3.0"
							},
							htlc_id: Htlcid,
							redeemer: toAccount.get("id"),
							extensions: null
						};

						console.log(
							"tx prior serialization \n", 
							operationJSON);

						tr.add_type_operation("htlc_redeem", operationJSON);

						tr.set_required_fees().then(() => {

							tr.add_signer(rpKey, rpKey.toPublicKey().toPublicKeyString());

							console.log(
								"serialized transaction: \n",
								tr.serialize().operations
								);

							tr
								.broadcast()
								.then(result => {
									console.log(
										"HashTimelockContract was successfully redeemed! "
										);

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

async function extendHTLC(id, seconds){
				let fromAccount = sender;

				Promise.all([
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

						console.log(
							"extend operation serialization \n",
							operationJSON );


						tr.add_type_operation("htlc_extend", operationJSON);

						tr.set_required_fees().then(() => {
							tr.add_signer(spKey, spKey.toPublicKey().toPublicKeyString());

							console.log(
								"serialized transaction: \n",
								tr.serialize().operations
								);

							tr
								.broadcast()
								.then(result => {
									const reply =  result[0].trx.expiration;
									console.log(
										"HashTimelockContract was successfully extended!");
									console.log("Please redeem the contract before: ", reply);
									
						})
								.catch(err => {
									console.error(err);
								});

					});
				});
};


module.exports = {
	deployHTLC,
	verifyHTLC,
	resolveHTLC,
	extendHTLC
};