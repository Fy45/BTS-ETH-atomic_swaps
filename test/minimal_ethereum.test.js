const Web3 = require("web3");
const HDWalletProvider = require("truffle-hdwallet-provider");
const HTLC = require("../build/contracts/HashedTimelock");
const Ethereum = require("../src/eth.js");
const random32 = require("../src/helper/utils").random32;
const newSecretHashPair = require("../src/helper/utils").newSecretHashPair;
const getBalance = require("../src/helper/utils").getBalance;
const isSha256Hash = require('../src/helper/utils').isSha256Hash

const HTLC_ADDR = "0x243785f6b65418191ea20b45fde7069ffe4f8cef";
const MNEMONIC =
  "cycle little able wish run zoo ethics twenty switch lava magnet jungle";
const api_key = "https://ropsten.infura.io/10347709826848a9a4347a1be1d02aa8";
const id = "0";
const Addr = "0xe2B1B5d92b64846D815cd34c674973f88DcefF4d";
const r_addr = "0x209f4b189e246Ae171da5a6F1815c91C70CAA23A";

describe("connectAcc", async function() {
  it("loads user account", async function() {
    Ethereum.connectAcc(MNEMONIC, api_key, id).then(address => {
      assert.equal(Addr, address,'user is loaded');
    });
  });
  it("throws if invalid Metamask mnemonic", async function() {
    const expectedError = "Invalid Metamask mnemonic z x c v b n, please check";
    try {
      await Ethereum.connectAcc("z x c v b n", api_key, id);
      assert.fail(expectedError);
    } catch (err) {
       console.log(err)
    }
  });
  it("throws if invalid environment api", async function() {
    const expectedError =
      "Invalid environment api https://ropsten.infura.io/123, please check";
    try {
      await Ethereum.connectAcc(MNEMONIC, "https://ropsten.infura.io/123", id);
      assert.fail(expectedError);
    } catch (err) {
      console.log(err)
    }
  });
  it("throws if load an invaild testnet account", async function() {
    const expectedError =
      "The provided account id x is invalid in this blockchain network, please check";
    try {
      Ethereum.connectAcc(MNEMONIC, api_key, "x");
      assert.fail(expectedError);
    } catch (err) {
     console.log(err)
    }
  });
});

describe("createHashedTimelockContract", async () => {
  it("submits new contract tx and returns contract id", async () => {
    const hashpair = newSecretHashPair();
    const amount = 0.01;
    const newContractId =  await Ethereum.deployHTLC(
      MNEMONIC,
      api_key,
      Addr,
      r_addr,
      hashpair.hash,
      10,
      amount
    )
     assert.ok(isSha256Hash(newContractId))

  });

  it("throws if HashValue is not a bytes 32 format", async () => {
    const expectedError =
      "The Hash value is not in sha256Hash bytes32 format, please check";
    const amount = 0.01;
    try {
      await Ethereum.deployHTLC(
        MNEMONIC,
        api_key,
        Addr,
        r_addr,
        "abc",
        10,
        amount
      );
      assert.fail(expectedError);
    } catch (err) {
    console.log(err)
    }
  });
  it("throws if timelock is in the past", async (done) => {
    const expectedError = "Expected failure due to past timelock, please check";
    const amount = 0.01;
    const hashpair = newSecretHashPair();
    try {
      await Ethereum.deployHTLC(
        MNEMONIC,
        api_key,
        Addr,
        r_addr,
        hashpair.hash,
        -1,
        amount
      );
      assert.fail(expectedError);
     
    } catch (err){
       console.log(err)
    } 
  });
  it("throw if no money sent", async (done) => {
    const expectedError =
      "Expected failure due to 0 amount of value transferred";
  const hashpair = newSecretHashPair();

    try {
      await Ethereum.deployHTLC(MNEMONIC, api_key, Addr, r_addr, hashpair.hash, 10, 0);
      assert.fail(expectedError);
     
    } catch (err){
       console.log(err)
    }

  });
});

// describe("verifyHashedTimelockContract", async () => {
//   it("returns match Hashvalue with right contract id", async function() {
//    const hashpair = newSecretHashPair();
//     const amount = 0.01;
//     const contractId = await Ethereum.deployHTLC(
//       MNEMONIC,
//       api_key,
//       Addr,
//       r_addr,
//       hashpair.hash,
//       10,
//       amount
//     );

//     Ethereum.verifyHTLC(MNEMONIC, api_key, contractId).then(hashValue => {
//       assert.equal(hashValue,hashpair.hash, "Hash matches");
//       done();
//     });
//   });
//   it("throw if cotract does not exists", async () => {
//     const expectedError = "Expected failure due to invalid contract id";
//     try {
//       await Ethereum.verifyHTLC(MNEMONIC, api_key, "0xabc1");
//       assert.fail(expectedError);
//     } catch(err) { 
//       console.log(err)
//     }
//   });
// });

// describe("resolveHashTimelockContract", async () => {
//   it("redeem successfully and returns correct recipient balance", async function() {
//     const hashpair = newSecretHashPair();
//     const amount = 0.01;
//     const recipient = Addr;
//     const contractId = await Ethereum.deployHTLC(
//       MNEMONIC,
//       api_key,
//       r_addr,
//       recipient,
//       hashpair.hash,
//       10,
//       amount
//     );
//     const provider = new HDWalletProvider(MNEMONIC, api_key, 0, 10);
//     const web3 = new Web3(provider);

//     const expectedBalance = getBalance(recipient);
//     Ethereum.resolveHTLC(
//       MNEMONIC,
//       api_key,
//       recipient,
//       contractId,
//       hashpair.secret
//     ).then(balance => {
//       assert.equal(balance, expectedBalance, "balance right");
//     });
//   });

//   it("throw if preimage does not match", async () => {
//     const hashpair = newSecretHashPair();
//     const amount = 0.01;
//     const recipient = Addr;
//     const wrongSecret = random32().toString("hex");
//     const contractId = await Ethereum.deployHTLC(
//       MNEMONIC,
//       api_key,
//       r_addr,
//       recipient,
//       hashpair.hash,
//       10,
//       amount
//     );
//     const expectedError = "Expected failure due to wrong secret";
//     try {
//       await Ethereum.resolveHTLC(
//         MNEMONIC,
//         api_key,
//         recipient,
//         contractId,
//         wrongSecret
//       );
//       assert.fail(expectedError);
//     } catch(err){
//        console.log(err)
//     }
//   });

//   it("throw if caller is not receiver", async () => {
//     const hashpair = newSecretHashPair();
//     const amount = 0.01;
//     const recipient = Addr;
//     const contractId = await Ethereum.deployHTLC(
//       MNEMONIC,
//       api_key,
//       r_addr,
//       recipient,
//       hashpair.hash,
//       10,
//       amount
//     );
//     const expectedError = "Expected failure due to wrong recipient";
//     try {
//       await Ethereum.resolveHTLC(
//         MNEMONIC,
//         api_key,
//         r_addr,
//         contractId,
//         hashpair.secret
//       );
//       assert.fail(expectedError);
//     } catch(err) {
//        console.log(err)
//     }
//   });

//   it("throw if timeout", async () => {
//     const hashpair = newSecretHashPair();
//     const amount = 0.01;
//     const recipient = Addr;
//     const contractId = await Ethereum.deployHTLC(
//       MNEMONIC,
//       api_key,
//       r_addr,
//       recipient,
//       hashpair.hash,
//       1,
//       amount
//     );
//     // wait a second before we calling reslove function
//     const expectedError = "Expected failure due to reslove after time expires";
//     try {
//       await Ethereum.resolveHTLC(
//         MNEMONIC,
//         api_key,
//         recipient,
//         contractId,
//         hashpair.secret
//       );
//       assert.fail(expectedError);
//     } catch(err) {
//        console.log(err)
//     }
//   });
// });

// describe("refundHashTimelockContract", async () => {
//   it("refund successfully and returns correct sender balance", async () => {
//     const hashpair = newSecretHashPair();
//     const amount = 0.01;
//     const sender = Addr;
//     const contractId = await Ethereum.deployHTLC(
//       MNEMONIC,
//       api_key,
//       sender,
//       r_addr,
//       hashpair.hash,
//       10,
//       amount
//     );
//     const provider = new HDWalletProvider(MNEMONIC, api_key, 0, 10);
//     const web3 = new Web3(provider);

//     const expectedBalance = getBalance(sender) + amount;
//     Ethereum.refundHTLC(MNEMONIC, api_key, sender, contractId).then(balance => {
//      assert.equal(balance, expectedBalance, "balance right")
//     });
//   });
//   it("throw if timelock still remains", async () => {
//     const hashpair = newSecretHashPair();
//     const amount = 0.01;
//     const sender = Addr;
//     const contractId = await Ethereum.deployHTLC(
//       MNEMONIC,
//       api_key,
//       sender,
//       r_addr,
//       hashpair.hash,
//       1000,
//       amount
//     );

//     const expectedError = "Expected failure due to refund before time expires";
//     try {
//       await Ethereum.refundHTLC(MNEMONIC, api_key, sender, contractId);
//       assert.fail(expectedError);
//     } catch(err) {
//        console.log(err)
//     }
//   });
// });
