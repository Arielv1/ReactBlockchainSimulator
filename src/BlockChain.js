const SHA256=require('crypto-js/sha256')
const { MerkleTree } = require('merkletreejs')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')
const {PartitionedBloomFilter} = require('bloom-filters')

class Transaction{
    constructor(fromAddress, toAddress, amount){
        this.fromAddress = fromAddress
        this.toAddress = toAddress
        this.amount = amount
        this.timestamp = Date.now()
    }

   

    calculateHash() {
        return SHA256(this.fromAddress + this.toAddress + this.amount + this.timestamp).toString()
    }
    
    // sign calculateHash of the Transaction with private key
    signTransaction(signingKey){
        // if the publickey is not if not of the owners
        if(signingKey.getPublic('hex') !== this.fromAddress){
            throw new Error ('You cannot sign transactions for other wallets')
        }
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64')
        this.signature = sig.toDER('hex')
    }

    isValid() {
    
        if (this.fromAddress === null){
            return true;
        }

        if (!this.signature || this.signature.length === 0){
            throw new Error('No Signature In Transaction')
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex')
        
        return publicKey.verify(this.calculateHash(), this.signature)

    }
}

class Block {

    constructor (timestamp, transactions, previousHash=''){
        this.previousHash = previousHash
        this.timestamp = timestamp
        this.transactions = transactions
        this.hash = this.calculateHash()
        this.nonce = 0
        
    }

    calculateHash(){
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();

    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++
            this.hash = this.calculateHash()
        }
    }

    hasValidTransactions(){
       for(const tx of this.transactions){
           if (!tx.isValid){
               return false
           }
       }
       return true
    }


    genMerkleTree() {
        const leaves = this.transactions.map(tx => SHA256(tx.calculateHash()))
        const tree = new MerkleTree(leaves, SHA256)
        this.root =  tree.getRoot().toString('hex')
        return tree
    }

}

class Blockchain{
    constructor() {
        this.chain = [this.createGenesisBlock()]
        this.difficulty = 3
        this.pendingTransaction = []
        this.blockSize = 4
        this.miningReward = 100
        this.bloom = new PartitionedBloomFilter(
            64, 5
        )
    }

    createGenesisBlock() {
        return new Block("01/01/2019", "Genesis block", "0")
    }


    getLatestBlock() {
        return this.chain[this.chain.length - 1]
    }

    addTransactionHash(transaction) {
        this.bloom.add(SHA256(transaction.calculateHash()).toString())
    }

    miningPendingTransaction(miningRewardAddress) {
        const rewardTx = new Transaction('Bank', miningRewardAddress, this.miningReward)
        this.addTransactionHash(rewardTx)
        if (this.pendingTransaction.length >= this.blockSize) {
            this.pendingTransaction = [rewardTx]
            let block = new Block(Date.now(),  this.pendingTransaction, this.getLatestBlock().hash)
            this.chain.push(block)
        }
        else {
            this.pendingTransaction.push(rewardTx)
            this.chain[this.chain.length - 1].transactions = this.pendingTransaction
        }
    
        this.chain[this.chain.length - 1].mineBlock(this.difficulty)
        this.chain[this.chain.length - 1].genMerkleTree()
        console.log('Block successfully mined');
    }

    addTransaction(transaction) {
        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error ('No Valid From Or To Address')
        }

        if (!transaction.isValid()){
            throw new Error ('No Valid Signature On Transaction')

        }
        
        if (this.pendingTransaction.length >= this.blockSize) {
            this.pendingTransaction = [transaction]
            
            let block = new Block(Date.now(), this.pendingTransaction, this.getLatestBlock().hash)
            this.chain.push(block)
        }
        else {
            this.pendingTransaction.push(transaction)
            this.chain[this.chain.length - 1].transactions = this.pendingTransaction
        }
    
        this.addTransactionHash(transaction)
        this.chain[this.chain.length - 1].genMerkleTree()
    }

    getBalanceOfAddress(address) {
        let balance = 1000
        for (const block of this.chain){
            for (const tx of block.transactions){
                if (tx.fromAddress === address){
                    balance -=tx.amount
                }
                if (tx.toAddress === address){
                    balance += tx.amount
                }
            }
        }
        return balance
    }

    isChainValidated() {
        for (let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i]
            const previousBlock = this.chain[i - 1]

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false
            }
        }
        return true
    }

    doestTransactionExistByMerkleTree(leaf){

        if (this.chain.length === 1 && this.pendingTransaction.length === 0) {
            return false
        }

        const hashedLeaf = SHA256(leaf.calculateHash())

        for (let i=0; i<this.chain.length; i++) {
            const tree = this.chain[i].genMerkleTree()
            const proof = tree.getProof(hashedLeaf)
            const root = this.chain[i].root
            if (tree.verify(proof, hashedLeaf, root)){
                return i+1
            }
        }
        return false
    }

    doesTransactionExistByBloomFilter(transaction){
        const result = this.bloom.has(SHA256(transaction.calculateHash()).toString())
        return result
         
    }
}

module.exports.Transaction = Transaction
module.exports.Blockchain = Blockchain
module.exports.Block = Block