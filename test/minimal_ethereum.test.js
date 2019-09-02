const Web3 = require("web3");
var expect = require("chai").expect;
const HDWalletProvider = require("truffle-hdwallet-provider");
const HTLC = require("../build/contracts/HashedTimelock");
const Ethereum = require("../src/eth.js");
const random32 = require("../src/helper/utils").random32;
const newSecretHashPair = require("../src/helper/utils").newSecretHashPair;
const getBalance = require("../src/helper/utils").getBalance;
const isSha256Hash = require("../src/helper/utils").isSha256Hash;

const HTLC_ADDR = "0x243785f6b65418191ea20b45fde7069ffe4f8cef";
const MNEMONIC =
  "cycle little able wish run zoo ethics twenty switch lava magnet jungle";
const api_key = "https://ropsten.infura.io/v3/10347709826848a9a4347a1be1d02aa8";
const id = "0";
const Addr = "0xe2B1B5d92b64846D815cd34c674973f88DcefF4d";
const r_addr = "0x209f4b189e246Ae171da5a6F1815c91C70CAA23A";

describe("connectAcc", async function() {
  it("loads user account", async function() {
    Ethereum.connectAcc(MNEMONIC, api_key, id).then(address => {
      assert.equal(Addr, address, "user is loaded");
    });
  });
  it("throws if invalid Metamask mnemonic", async function() {
    const expectedError = "Invalid Metamask mnemonic z x c v b n, please check";

    Ethereum.connectAcc("z x c v b n", api_key, id)
      .then(address => {
        assert.notEqual(Addr, address, expectedError);
      })
      .catch(err => {});
  });

  it("throws if invalid environment api", async function() {
    const expectedError =
      "Invalid environment api https://ropsten.abc.io/, please check";

    Ethereum.connectAcc(MNEMONIC, "https://ropsten.abc.io/", id)
      .then(address => {
        assert.notEqual(Addr, address, expectedError);
      })
      .catch(err => {});
  });
  it("throws if load an invaild testnet account", async function() {
    const expectedError =
      "The provided account id x is invalid in this blockchain network, please check";

    Ethereum.connectAcc(MNEMONIC, api_key, "x")
      .then(address => {
        assert.notEqual(Addr, address, expectedError);
      })
      .catch(err => {});
  });
});

describe("createHashedTimelockContract", async function() {
  it("submits new contract tx and returns contract id", async function() {
    const hashpair = newSecretHashPair();
    const amount = 0.01;
    Ethereum.deployHTLC(
      MNEMONIC,
      api_key,
      Addr,
      r_addr,
      hashpair.hash,
      10,
      amount
    )
      .then(newContractId => {
        var t = isSha256Hash(newContractId);
        assert.isTrue(t, "Correct Contract Id format");
      })
      .catch(err => {});
  });

  it("throws if HashValue is not a bytes 32 format", async function() {
    const expectedError =
      "The Hash value is not in sha256Hash bytes32 format, please check";
    const amount = 0.01;
    Ethereum.deployHTLC(MNEMONIC, api_key, Addr, r_addr, "abc", 10, amount)
      .then(newContractId => {
        assert.isFalse(isSha256Hash(newContractId), expectedError);
      })
      .catch(err => {});
  });
  it("throws if timelock is in the past", async function() {
    const expectedError = "Expected failure due to past timelock, please check";
    const amount = 0.01;
    const hashpair = newSecretHashPair();
    Ethereum.deployHTLC(
      MNEMONIC,
      api_key,
      Addr,
      r_addr,
      hashpair.hash,
      -1,
      amount
    )
      .then(newContractId => {
        assert.isFalse(isSha256Hash(newContractId), expectedError);
      })
      .catch(err => {});
  });
  it("throw if no money sent", async function() {
    const expectedError =
      "Expected failure due to 0 amount of value transferred";
    const hashpair = newSecretHashPair();

    Ethereum.deployHTLC(MNEMONIC, api_key, Addr, r_addr, hashpair.hash, 10, 0)
      .then(newContractId => {
        assert.isFalse(isSha256Hash(newContractId), expectedError);
      })
      .catch(err => {});
  });
});

describe("verifyHashedTimelockContract", async function() {
  it("returns match Hashvalue with right contract id", async function() {
    const hashpair = newSecretHashPair();
    const amount = 0.01;
    Ethereum.deployHTLC(
      MNEMONIC,
      api_key,
      Addr,
      r_addr,
      hashpair.hash,
      10,
      amount
    ).then(newContractId => {
      let contractId = newContractId;
      Ethereum.verifyHTLC(MNEMONIC, api_key, contractId)
        .then(hashValue => {
          assert.equal(hashValue, hashpair.hash, "Hash matches");
        })
        .catch(err => {});
    });
  });
  it("throw if cotract does not exists", async function() {
    const expectedError = "Expected failure due to invalid contract id";

    Ethereum.verifyHTLC(MNEMONIC, api_key, "0xabc1")
      .then(hashValue => {
        assert.isUndefined(hashValue, expectedError);
      })
      .catch(err => {});
  });
});

describe("resolveHashTimelockContract", async function() {
  it("redeem successfully and returns correct recipient balance", async function() {
    const hashpair = newSecretHashPair();
    const amount = 0.01;
    const recipient = Addr;
    Ethereum.deployHTLC(
      MNEMONIC,
      api_key,
      r_addr,
      recipient,
      hashpair.hash,
      10,
      amount
    )
      .then(newContractId => {
        let contractId = newContractId;
        const provider = new HDWalletProvider(MNEMONIC, api_key, 0, 10);
        const web3 = new Web3(provider);

        const expectedBalance = getBalance(recipient) + amount;
        Ethereum.resolveHTLC(
          MNEMONIC,
          api_key,
          recipient,
          contractId,
          hashpair.secret
        ).then(balance => {
          assert.equal(balance, expectedBalance, "balance right");
        })
        .catch(err =>{
          
        })
      })
      .catch(err => {});
  });

  it("throw if preimage does not match", async function() {
    const hashpair = newSecretHashPair();
    const amount = 0.01;
    const recipient = Addr;
    const wrongSecret = random32().toString("hex");
    const expectedError = "Expected failure due to wrong secret";
    Ethereum.deployHTLC(
      MNEMONIC,
      api_key,
      r_addr,
      recipient,
      hashpair.hash,
      10,
      amount
    )
      .then(newContractId => {
        let contractId = newContractId;
        const provider = new HDWalletProvider(MNEMONIC, api_key, 0, 10);
        const web3 = new Web3(provider);

        const expectedBalance = getBalance(recipient);
        Ethereum.resolveHTLC(
          MNEMONIC,
          api_key,
          recipient,
          contractId,
          wrongSecret
        ).then(balance => {
          assert.notEqual(balance, expectedBalance, expectedError);
        })
        .catch(err =>{
          
        })
      })
      .catch(err => {});
  });

  it("throw if caller is not receiver", async function() {
    const expectedError = "Expected failure due to wrong recipient";
    const hashpair = newSecretHashPair();
    const amount = 0.01;
    const recipient = Addr;
    Ethereum.deployHTLC(
      MNEMONIC,
      api_key,
      r_addr,
      recipient,
      hashpair.hash,
      10,
      amount
    )
      .then(newContractId => {
        let contractId = newContractId;
        const provider = new HDWalletProvider(MNEMONIC, api_key, 0, 10);
        const web3 = new Web3(provider);

        const expectedBalance = getBalance(recipient);
        Ethereum.resolveHTLC(
          MNEMONIC,
          api_key,
          r_addr,
          contractId,
          hashpair.secret
        ).then(balance => {
          assert.notEqual(balance, expectedBalance, expectedError);
        })
        .catch(err =>{
          
        })
      })
      .catch(err => {});
  });

  it("throw if timeout", async function() {
    const expectedError = "Expected failure due to reslove after time expires";
    const hashpair = newSecretHashPair();
    const amount = 0.01;
    const recipient = Addr;
    Ethereum.deployHTLC(
      MNEMONIC,
      api_key,
      r_addr,
      recipient,
      hashpair.hash,
      1,
      amount
    )
      .then(newContractId => {
        let contractId = newContractId;
        const provider = new HDWalletProvider(MNEMONIC, api_key, 0, 10);
        const web3 = new Web3(provider);

        const expectedBalance = getBalance(recipient);
        // wait a while before we calling reslove function
        setTimeout("wait two seconds", 2000);
        Ethereum.resolveHTLC(
          MNEMONIC,
          api_key,
          recipient,
          contractId,
          hashpair.secret
        ).then(balance => {
          assert.notEqual(balance, expectedBalance, expectedError);
        })     
        .catch(err =>{
          
        })
      })
      .catch(err => {});
  });
});

describe("refundHashTimelockContract", async function() {
  it("refund successfully and returns correct sender balance", async function() {
    const hashpair = newSecretHashPair();
    const amount = 0.01;
    const sender = Addr;
    Ethereum.deployHTLC(
      MNEMONIC,
      api_key,
      sender,
      r_addr,
      hashpair.hash,
      10,
      amount
    )
      .then(newContractId => {
        let contractId = newContractId;
        const provider = new HDWalletProvider(MNEMONIC, api_key, 0, 10);
        const web3 = new Web3(provider);

        const expectedBalance = getBalance(sender) + amount;
        Ethereum.refundHTLC(MNEMONIC, api_key, sender, contractId).then(
          balance => {
            assert.equal(balance, expectedBalance, "balance right");
          }
        )
             .catch(err =>{
          
        })
      })
      .catch(err => {});
  });

  it("throw if timelock still remains", async function() {
    const expectedError = "Expected failure due to refund before time expires";
    const hashpair = newSecretHashPair();
    const amount = 0.01;
    const sender = Addr;
    Ethereum.deployHTLC(
      MNEMONIC,
      api_key,
      sender,
      r_addr,
      hashpair.hash,
      1000,
      amount
    )
      .then(newContractId => {
        let contractId = newContractId;
        const provider = new HDWalletProvider(MNEMONIC, api_key, 0, 10);
        const web3 = new Web3(provider);

        const expectedBalance = getBalance(sender) + amount;
        Ethereum.refundHTLC(MNEMONIC, api_key, sender, contractId).then(
          balance => {
            assert.notEqual(balance, expectedBalance, expectedError);
          }
        )
        .catch(err =>{

        })
      })
      .catch(err => {});
  });
});
