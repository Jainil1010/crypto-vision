// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CryptoTradingContract {
    // State variables
    address public owner;
    uint256 public transactionCount;
    
    // Cryptocurrency data structure
    struct CryptoCurrency {
        string symbol;
        uint256 price; // Price in wei (1 ETH = 10^18 wei)
        bool isActive;
    }
    
    // Transaction data structure
    struct Transaction {
        uint256 id;
        address user;
        string cryptoSymbol;
        uint256 amount; // Amount in wei
        uint256 price; // Price per unit in wei
        string transactionType; // "buy" or "sell"
        uint256 timestamp;
        bool completed;
    }
    
    // Mappings
    mapping(string => CryptoCurrency) public cryptocurrencies;
    mapping(address => mapping(string => uint256)) public userBalances;
    mapping(uint256 => Transaction) public transactions;
    mapping(address => uint256[]) public userTransactions;
    
    // Arrays to keep track of supported cryptocurrencies
    string[] public supportedCryptos;
    
    // Events
    event CryptoAdded(string symbol, uint256 price);
    event CryptoPriceUpdated(string symbol, uint256 newPrice);
    event CryptoBought(
        uint256 indexed transactionId,
        address indexed user,
        string cryptoSymbol,
        uint256 amount,
        uint256 price,
        uint256 timestamp
    );
    event CryptoSold(
        uint256 indexed transactionId,
        address indexed user,
        string cryptoSymbol,
        uint256 amount,
        uint256 price,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier cryptoExists(string memory _symbol) {
        require(cryptocurrencies[_symbol].isActive, "Cryptocurrency not supported");
        _;
    }
    
    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "Amount must be greater than 0");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
        transactionCount = 0;
        
        // Initialize some default cryptocurrencies
        addCryptocurrency("BTC", 30000 * 10**18); // 30,000 ETH per BTC
        addCryptocurrency("ETH", 1 * 10**18);     // 1 ETH per ETH
        addCryptocurrency("ADA", 5 * 10**15);     // 0.005 ETH per ADA
        addCryptocurrency("DOT", 10 * 10**15);    // 0.01 ETH per DOT
    }
    
    // Add new cryptocurrency (only owner)
    function addCryptocurrency(string memory _symbol, uint256 _price) public onlyOwner {
        require(!cryptocurrencies[_symbol].isActive, "Cryptocurrency already exists");
        require(_price > 0, "Price must be greater than 0");
        
        cryptocurrencies[_symbol] = CryptoCurrency({
            symbol: _symbol,
            price: _price,
            isActive: true
        });
        
        supportedCryptos.push(_symbol);
        emit CryptoAdded(_symbol, _price);
    }
    
    // Update cryptocurrency price (only owner)
    function updateCryptoPrice(string memory _symbol, uint256 _newPrice) 
        public 
        onlyOwner 
        cryptoExists(_symbol) 
    {
        require(_newPrice > 0, "Price must be greater than 0");
        cryptocurrencies[_symbol].price = _newPrice;
        emit CryptoPriceUpdated(_symbol, _newPrice);
    }
    
    // Buy cryptocurrency
    function buyCryptocurrency(string memory _symbol, uint256 _amount) 
        public 
        payable 
        cryptoExists(_symbol) 
        validAmount(_amount) 
    {
        uint256 totalCost = (_amount * cryptocurrencies[_symbol].price) / 10**18;
        require(msg.value >= totalCost, "Insufficient ETH sent");
        
        // Record transaction
        transactionCount++;
        Transaction memory newTransaction = Transaction({
            id: transactionCount,
            user: msg.sender,
            cryptoSymbol: _symbol,
            amount: _amount,
            price: cryptocurrencies[_symbol].price,
            transactionType: "buy",
            timestamp: block.timestamp,
            completed: true
        });
        
        transactions[transactionCount] = newTransaction;
        userTransactions[msg.sender].push(transactionCount);
        
        // Update user balance
        userBalances[msg.sender][_symbol] += _amount;
        
        // Refund excess ETH
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit CryptoBought(
            transactionCount,
            msg.sender,
            _symbol,
            _amount,
            cryptocurrencies[_symbol].price,
            block.timestamp
        );
    }
    
    // Sell cryptocurrency
    function sellCryptocurrency(string memory _symbol, uint256 _amount) 
        public 
        cryptoExists(_symbol) 
        validAmount(_amount) 
    {
        require(
            userBalances[msg.sender][_symbol] >= _amount, 
            "Insufficient cryptocurrency balance"
        );
        
        uint256 saleValue = (_amount * cryptocurrencies[_symbol].price) / 10**18;
        require(address(this).balance >= saleValue, "Contract has insufficient ETH");
        
        // Record transaction
        transactionCount++;
        Transaction memory newTransaction = Transaction({
            id: transactionCount,
            user: msg.sender,
            cryptoSymbol: _symbol,
            amount: _amount,
            price: cryptocurrencies[_symbol].price,
            transactionType: "sell",
            timestamp: block.timestamp,
            completed: true
        });
        
        transactions[transactionCount] = newTransaction;
        userTransactions[msg.sender].push(transactionCount);
        
        // Update user balance
        userBalances[msg.sender][_symbol] -= _amount;
        
        // Transfer ETH to user
        payable(msg.sender).transfer(saleValue);
        
        emit CryptoSold(
            transactionCount,
            msg.sender,
            _symbol,
            _amount,
            cryptocurrencies[_symbol].price,
            block.timestamp
        );
    }
    
    // Get user balance for specific cryptocurrency
    function getUserBalance(address _user, string memory _symbol) 
        public 
        view 
        returns (uint256) 
    {
        return userBalances[_user][_symbol];
    }
    
    // Get user transaction history
    function getUserTransactions(address _user) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return userTransactions[_user];
    }
    
    // Get transaction details
    function getTransaction(uint256 _transactionId) 
        public 
        view 
        returns (
            uint256 id,
            address user,
            string memory cryptoSymbol,
            uint256 amount,
            uint256 price,
            string memory transactionType,
            uint256 timestamp,
            bool completed
        ) 
    {
        Transaction memory txn = transactions[_transactionId];
        return (
            txn.id,
            txn.user,
            txn.cryptoSymbol,
            txn.amount,
            txn.price,
            txn.transactionType,
            txn.timestamp,
            txn.completed
        );
    }
    
    // Get cryptocurrency price
    function getCryptoPrice(string memory _symbol) 
        public 
        view 
        cryptoExists(_symbol) 
        returns (uint256) 
    {
        return cryptocurrencies[_symbol].price;
    }
    
    // Get all supported cryptocurrencies
    function getSupportedCryptos() public view returns (string[] memory) {
        return supportedCryptos;
    }
    
    // Get contract balance
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    // Owner can deposit ETH to contract
    function depositETH() public payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
    }
    
    // Owner can withdraw ETH from contract
    function withdrawETH(uint256 _amount) public onlyOwner {
        require(_amount <= address(this).balance, "Insufficient contract balance");
        payable(owner).transfer(_amount);
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
}