const CryptoTradingContract = artifacts.require("CryptoTradingContract");

contract("CryptoTradingContract", accounts => {
  let cryptoTradingContract;
  const owner = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];

  beforeEach(async () => {
    cryptoTradingContract = await CryptoTradingContract.new({ from: owner });
  });

  describe("Contract Deployment", () => {
    it("should deploy successfully", async () => {
      const address = await cryptoTradingContract.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it("should set the correct owner", async () => {
      const contractOwner = await cryptoTradingContract.owner();
      assert.equal(contractOwner, owner);
    });

    it("should initialize with default cryptocurrencies", async () => {
      const supportedCryptos = await cryptoTradingContract.getSupportedCryptos();
      assert.equal(supportedCryptos.length, 4);
      assert.equal(supportedCryptos[0], "BTC");
      assert.equal(supportedCryptos[1], "ETH");
      assert.equal(supportedCryptos[2], "ADA");
      assert.equal(supportedCryptos[3], "DOT");
    });
  });

  describe("Cryptocurrency Management", () => {
    it("should allow owner to add new cryptocurrency", async () => {
      const symbol = "LINK";
      const price = web3.utils.toWei("0.02", "ether");

      await cryptoTradingContract.addCryptocurrency(symbol, price, { from: owner });

      const cryptoPrice = await cryptoTradingContract.getCryptoPrice(symbol);
      assert.equal(cryptoPrice, price);

      const supportedCryptos = await cryptoTradingContract.getSupportedCryptos();
      assert.equal(supportedCryptos[supportedCryptos.length - 1], symbol);
    });

    it("should not allow non-owner to add cryptocurrency", async () => {
      const symbol = "LINK";
      const price = web3.utils.toWei("0.02", "ether");

      try {
        await cryptoTradingContract.addCryptocurrency(symbol, price, { from: user1 });
        assert.fail("Expected revert not received");
      } catch (error) {
        const revertFound = error.message.search("revert") >= 0;
        assert(revertFound, `Expected "revert", got ${error} instead`);
      }
    });

    it("should allow owner to update cryptocurrency price", async () => {
      const symbol = "BTC";
      const newPrice = web3.utils.toWei("35000", "ether");

      await cryptoTradingContract.updateCryptoPrice(symbol, newPrice, { from: owner });

      const updatedPrice = await cryptoTradingContract.getCryptoPrice(symbol);
      assert.equal(updatedPrice, newPrice);
    });
  });

  describe("Buy Cryptocurrency", () => {
    it("should allow user to buy cryptocurrency", async () => {
      const symbol = "ETH";
      const amount = web3.utils.toWei("1", "ether");
      const price = await cryptoTradingContract.getCryptoPrice(symbol);
      const totalCost = (BigInt(amount) * BigInt(price)) / BigInt(web3.utils.toWei("1", "ether"));

      const initialBalance = await cryptoTradingContract.getUserBalance(user1, symbol);

      await cryptoTradingContract.buyCryptocurrency(symbol, amount, {
        from: user1,
        value: totalCost.toString()
      });

      const finalBalance = await cryptoTradingContract.getUserBalance(user1, symbol);
      const expectedBalance = BigInt(initialBalance) + BigInt(amount);

      assert.equal(finalBalance.toString(), expectedBalance.toString());
    });

    it("should fail if insufficient ETH sent", async () => {
      const symbol = "BTC";
      const amount = web3.utils.toWei("1", "ether");
      const insufficientValue = web3.utils.toWei("1", "ether"); // Much less than BTC price

      try {
        await cryptoTradingContract.buyCryptocurrency(symbol, amount, {
          from: user1,
          value: insufficientValue
        });
        assert.fail("Expected revert not received");
      } catch (error) {
        const revertFound = error.message.search("revert") >= 0;
        assert(revertFound, `Expected "revert", got ${error} instead`);
      }
    });

    it("should increment transaction count", async () => {
      const initialCount = await cryptoTradingContract.transactionCount();
      
      const symbol = "ETH";
      const amount = web3.utils.toWei("1", "ether");
      const price = await cryptoTradingContract.getCryptoPrice(symbol);
      const totalCost = (BigInt(amount) * BigInt(price)) / BigInt(web3.utils.toWei("1", "ether"));

      await cryptoTradingContract.buyCryptocurrency(symbol, amount, {
        from: user1,
        value: totalCost.toString()
      });

      const finalCount = await cryptoTradingContract.transactionCount();
      assert.equal(BigInt(finalCount), BigInt(initialCount) + BigInt(1));
    });
  });

  describe("Sell Cryptocurrency", () => {
    beforeEach(async () => {
      // First buy some cryptocurrency
      const symbol = "ETH";
      const amount = web3.utils.toWei("2", "ether");
      const price = await cryptoTradingContract.getCryptoPrice(symbol);
      const totalCost = (BigInt(amount) * BigInt(price)) / BigInt(web3.utils.toWei("1", "ether"));

      await cryptoTradingContract.buyCryptocurrency(symbol, amount, {
        from: user1,
        value: totalCost.toString()
      });

      // Deposit ETH to contract for selling
      await cryptoTradingContract.depositETH({
        from: owner,
        value: web3.utils.toWei("10", "ether")
      });
    });

    it("should allow user to sell cryptocurrency", async () => {
      const symbol = "ETH";
      const amount = web3.utils.toWei("1", "ether");

      const initialBalance = await cryptoTradingContract.getUserBalance(user1, symbol);
      const initialETHBalance = await web3.eth.getBalance(user1);

      await cryptoTradingContract.sellCryptocurrency(symbol, amount, { from: user1 });

      const finalBalance = await cryptoTradingContract.getUserBalance(user1, symbol);
      const finalETHBalance = await web3.eth.getBalance(user1);

      const expectedBalance = BigInt(initialBalance) - BigInt(amount);
      assert.equal(finalBalance.toString(), expectedBalance.toString());
      assert(BigInt(finalETHBalance) > BigInt(initialETHBalance));
    });

    it("should fail if user has insufficient cryptocurrency balance", async () => {
      const symbol = "BTC";
      const amount = web3.utils.toWei("1", "ether");

      try {
        await cryptoTradingContract.sellCryptocurrency(symbol, amount, { from: user1 });
        assert.fail("Expected revert not received");
      } catch (error) {
        const revertFound = error.message.search("revert") >= 0;
        assert(revertFound, `Expected "revert", got ${error} instead`);
      }
    });
  });

  describe("Transaction History", () => {
    it("should track user transactions", async () => {
      const symbol = "ETH";
      const amount = web3.utils.toWei("1", "ether");
      const price = await cryptoTradingContract.getCryptoPrice(symbol);
      const totalCost = (BigInt(amount) * BigInt(price)) / BigInt(web3.utils.toWei("1", "ether"));

      await cryptoTradingContract.buyCryptocurrency(symbol, amount, {
        from: user1,
        value: totalCost.toString()
      });

      const userTransactions = await cryptoTradingContract.getUserTransactions(user1);
      assert.equal(userTransactions.length, 1);

      const transactionId = userTransactions[0];
      const transaction = await cryptoTradingContract.getTransaction(transactionId);

      assert.equal(transaction.user, user1);
      assert.equal(transaction.cryptoSymbol, symbol);
      assert.equal(transaction.amount, amount);
      assert.equal(transaction.transactionType, "buy");
      assert.equal(transaction.completed, true);
    });
  });

  describe("Contract Management", () => {
    it("should allow owner to deposit ETH", async () => {
      const depositAmount = web3.utils.toWei("5", "ether");
      const initialBalance = await web3.eth.getBalance(cryptoTradingContract.address);

      await cryptoTradingContract.depositETH({
        from: owner,
        value: depositAmount
      });

      const finalBalance = await web3.eth.getBalance(cryptoTradingContract.address);
      const expectedBalance = BigInt(initialBalance) + BigInt(depositAmount);

      assert.equal(finalBalance.toString(), expectedBalance.toString());
    });

    it("should allow owner to withdraw ETH", async () => {
      const depositAmount = web3.utils.toWei("5", "ether");
      const withdrawAmount = web3.utils.toWei("2", "ether");

      await cryptoTradingContract.depositETH({
        from: owner,
        value: depositAmount
      });

      const initialOwnerBalance = await web3.eth.getBalance(owner);
      const initialContractBalance = await web3.eth.getBalance(cryptoTradingContract.address);

      await cryptoTradingContract.withdrawETH(withdrawAmount, { from: owner });

      const finalOwnerBalance = await web3.eth.getBalance(owner);
      const finalContractBalance = await web3.eth.getBalance(cryptoTradingContract.address);

      assert(BigInt(finalOwnerBalance) > BigInt(initialOwnerBalance));
      assert.equal(
        finalContractBalance.toString(),
        (BigInt(initialContractBalance) - BigInt(withdrawAmount)).toString()
      );
    });

    it("should not allow non-owner to withdraw ETH", async () => {
      const withdrawAmount = web3.utils.toWei("1", "ether");

      try {
        await cryptoTradingContract.withdrawETH(withdrawAmount, { from: user1 });
        assert.fail("Expected revert not received");
      } catch (error) {
        const revertFound = error.message.search("revert") >= 0;
        assert(revertFound, `Expected "revert", got ${error} instead`);
      }
    });
  });
});