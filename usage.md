# Bitshares Private Testnet

> Requirement: bitsharejs

First, setup the private testnet and running testnet witness node. Find the `rpc_endpoint` url in your _config.ini_ . 

Then change the `rpc_endpoint_url` in *bts.js* file with the one you found. If you are running with public testnet, then according to [example](https://github.com/bitshares/bitsharesjs/blob/master/examples/chainStore.js), it should be: `wss://eu.nodes.bitshares.ws`

Change the `privKey` to specify the private key of your account.

You are halfway there!

# Ethereum Ropsten Testnet

> Requirement: web3js, truffle-hdwallet-provider, Metamask, HTLC contract

First, create one Metamask wallet and keep your 12 random words `SECRET_MNEMONIC` safe.

Then, sign up and create your own project in [here](https://infura.io/login), get your infura endpoint `api_key` of the choosen testnet.

The contract I am using is [hashed-timelock-contract-ethereum](https://github.com/chatch/hashed-timelock-contract-ethereum).  Take a look and get the contract address you need.

Substitute `MY_SECRET_MNEMONIC`, `env_api` and `HTLC_contract_address` with the parameters I mentioned above, then have fun with this swap program!

Enjoy the code!