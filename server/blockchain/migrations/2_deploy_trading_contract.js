const CryptoTradingContract = artifacts.require("CryptoTradingContract");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(CryptoTradingContract, {
    from: accounts[0],
    gas: 6721975,
    gasPrice: 20000000000
  }).then(() => {
    console.log("CryptoTradingContract deployed successfully!");
    console.log("Contract Address:", CryptoTradingContract.address);
    console.log("Deployer Address:", accounts[0]);
  });
};