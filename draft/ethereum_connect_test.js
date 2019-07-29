const fs = require('fs')
const web3 = require('web3')
const HDWalletProvider = require("truffle-hdwallet-provider")



MY_SECRET_MNEMONIC = "cycle little able wish run zoo ethics twenty switch lava magnet jungle";
env_api = "https://ropsten.infura.io/10347709826848a9a4347a1be1d02aa8";
provider = new HDWalletProvider(MY_SECRET_MNEMONIC, env_api,0,2);
const eth = new web3(provider);

let accounts= eth.eth.getAccounts();


console.log("acc:",accounts);
    //console.log("account used: " + accounts[1]);
    // result = await new web3.eth.Contract(JSON.parse(compileFactory.interface))
    //     .deploy({data: "0x"+compileFactory.bytecode})
    //     .send({from: accounts[0]});
    // console.log("deployed to address: " + result.options.address);
