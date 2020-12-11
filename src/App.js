import './App.css';
import Client from './Components/Client'
import React, { Component, useState } from 'react';
import {CardGroup } from 'react-bootstrap'
import { Button, Card, Form, CardDeck } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';
const { Blockchain, Transaction } = require("./BlockChain");
const fs = require('fs')
var text = ''
class App extends React.Component {
 
  constructor(props){
    super(props)
    this.state = {
      blockchainView : '',
      difficulty: 1,
      blockSize: 4,
      blockchain: null
    }
    this.setDifficulty = this.setDifficulty.bind(this)
    this.addTransaction = this.addTransaction.bind(this)
    this.initBlockchain = this.initBlockchain.bind(this)
    this.getBalance = this.getBalance.bind(this) 
    this.setBlockSize = this.setBlockSize.bind(this)
  }

  setDifficulty = (event) => {
    this.setState({[event.target.name] : event.target.value})
  }


  setBlockSize = (event) => {
    this.setState({[event.target.name] : event.target.value})
  }

  initBlockchain = () => {
    this.state.blockchain = new Blockchain()
    this.state.blockchain.difficulty = parseInt(this.state.difficulty, 10)
    this.state.blockchain.blockSize = this.state.blockSize
    console.log(this.state.blockchain)
  }

  mine = (minerAddress) => {
    if (!this.state.blockchain) {
      alert('Blockchain Full Node Not Yet Defined')
      return 
    }
    console.log(this.state.blockchain)
    this.state.blockchain.miningPendingTransaction(minerAddress)
    alert('Block mined successfully')
    this.printBlockchain()
  }

  printBlockchain = () => {
    const allBlocks = []

    if (!this.state.blockchain || (this.state.blockchain.chain.length === 1 && this.state.blockchain.pendingTransaction.length === 0)){
       allBlocks.push(<Card>
        <body>
          Block #1 Has 0 Transactions
          </body>
        </Card>)
    }
    else {
      for (let i = 0; i<this.state.blockchain.chain.length; i++) {
        if(i > 0) {
          allBlocks.push(<h6>{'-->'}</h6>)
        }
        this.state.blockchain.chain[i].genMerkleTree()
        const merkleRoot = this.state.blockchain.chain[i].root
        allBlocks.push(<Card>
          <body>
            Block #{i+1} Has {this.state.blockchain.chain[i].transactions.length} Transactions
            </body>
            Merkle Root {JSON.stringify(merkleRoot.toString())}
          </Card>)
      }
    }

    
    this.setState({blockchainView: allBlocks})
  }

  addTransaction (tx) {
    if (!this.state.blockchain) {
      alert('Blockchain Full Node Not Yet Defined')
      return 
    }
    var jsonTx = JSON.parse(tx)
    var ctx = new Transaction(jsonTx.fromAddress, jsonTx.toAddress, parseInt(jsonTx.amount,10))
    ctx.signature = jsonTx.signature
    ctx.timestamp = jsonTx.timestamp
    console.log(ctx);
    this.state.blockchain.addTransaction(ctx)
    this.printBlockchain()
  }

  getBalance(address) {
    if (!this.state.blockchain) {
      alert('Blockchain Full Node Not Yet Defined')
      return 
    }
    return this.state.blockchain.getBalanceOfAddress(address)
  }

  render() {
    return (
      <div>
        <br></br>
        <div style={{ marginLeft: '1rem', marginRight :'2rem'}}>
          <h6>Set number of leading zeroes for mining:
          <input style={{ marginLeft: '1rem', marginRight :'2rem'}} 
                  type="text"
                  name="difficulty" 
                  placeholder="1" 
                  value = {this.state.difficulty} 
                  onChange={this.setDifficulty}>
                  </input></h6>
          <h6>Set number of transactions per block:
          <input style={{ marginLeft: '1rem', marginRight :'2rem'}} 
                  type="text"
                  name="blockSize" 
                  placeholder="4" 
                  value = {this.state.blockSize} 
                  onChange={this.setBlockSize}>
                  </input></h6>
          <Button onClick={() => this.initBlockchain()}>Create Blockchain</Button>
          <br></br>
          Note: Changing difficulty or block size resets the blockchain entity, all previous transactions will be discarded
        </div>
        <hr></hr>
        
        <CardGroup>
          <Client me="Alice" transfer={this.addTransaction} balance={this.getBalance} mining={this.mine} private="be4fd198c8b81d22cd90eb06ca708527ea5e84f75ea852545f60467f128665ad"/>
          <Client me="Bob" transfer={this.addTransaction} balance={this.getBalance} mining={this.mine} private="35d5d301c684e580dbe3a50a3cbf193580a5500ab679a854af58aad02d2108cf"/>
          <Client me="Claire" transfer={this.addTransaction} balance={this.getBalance} mining={this.mine} private="c62ec918cd0c643eabcb127e20a31ad9b87a3b87fed444fdbf485a84a2886699"/>
        </CardGroup>
        <div style={{ marginLeft: '1rem', marginRight :'2rem'}}>
          <hr></hr>
          <Button onClick={() => this.printBlockchain()}>View Blockchain</Button>
          <hr></hr>
          <CardDeck >{this.state.blockchainView}</CardDeck>
        </div>

       
      </div>
  );
  }
  
}

export default App;