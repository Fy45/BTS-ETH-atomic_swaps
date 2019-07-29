const Apis = require('bitsharesjs-ws').Apis;
const TransactionBuilder = require('bitsharesjs').TransactionBuilder;
const ChainStore = require('bitsharesjs').ChainStore;
const FetchChain = require('bitsharesjs').FetchChain;
const PrivateKey = require('bitsharesjs').PrivateKey;
const hash = require('bitsharesjs').hash;

const rpc_endpoint_url = "ws://127.0.0.1:8090";
var privKey = "5Kecd9SoyHEYbSrUnadGzSokptuTWNMKi4M4CgXh7dSNSzLkNLq";
let pKey = PrivateKey.fromWif(privKey);

/* 
 * Instance the connection using the api
 * since I use the local private testnet the network_name is not defined
 * script adopted from bitsharesjs/examples/createHtlc.js
 * check your environment before use
 */

//async function connect(){
	Apis.instance(rpc_endpoint_url,true).init_promise.then(
		res => {

			console.log("Connected to: local private test network");
			ChainStore.init(false).then(() => {
				let bSenderAccount = "yfan";

				Promise.all([
					FetchChain("getAccount",bSenderAccount)]).then(res => {
						let [bSenderAccount] = res;
						console.log("Successfully connected to BTS local network and using account:", bSenderAccount.get("id"));
					})
    
});
		})
//}