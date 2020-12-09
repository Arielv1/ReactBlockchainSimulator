
import { Button, Card, Form } from 'react-bootstrap'
import React, { useState } from 'react';
import { Transaction } from '../BlockChain';
const EC = require('elliptic').ec
const ec = new EC('secp256k1')


class Client extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        to: '',
        amount:'',
        stamp: ec.keyFromPrivate(this.props.private),
        wallet: ec.keyFromPrivate(this.props.private).getPublic('hex'),
        balance: '1000'
      };
      
      this.setField = this.setField.bind(this)
    
    }

    transferTransaction = () => {
     
      console.log(this.state)
      var tx = new Transaction(this.state.wallet, this.state.to, this.state.amount)
      tx.signTransaction(this.state.stamp)
      this.props.transfer(JSON.stringify(tx))
    }

    setField = (event) => {
      this.setState({[event.target.name] : event.target.value})
    }


    checkBalance = () => {
     
      const val = this.props.balance(this.state.wallet)
      this.setState({balance: val})
    }

    performMining = () => {
      this.props.mining(this.state.wallet)
    }
    
    render () {    
      return (
          <Card style={{ width: '18rem' }}>
            <Card.Body>
              <Card.Title>Client: {this.props.me}</Card.Title>
              <h6>Public Key: {this.state.wallet}</h6>
            <Form>
              <Form.Group>
                <Form.Label>Who To Transfer</Form.Label>
                <Form.Control type="text" name="to" placeholder="Target Public Key" value = {this.state.to} onChange={this.setField}/>
              </Form.Group>

              <Form.Group>
                <Form.Label>Transfer Amount</Form.Label>
                <Form.Control type="text" name ="amount" placeholder="100" value = {this.state.amount} onChange={this.setField}/>
              </Form.Group>
            </Form>
            <Button   onClick={this.transferTransaction}>Transfer</Button>
            <hr></hr>
            <Button   onClick={this.checkBalance}>Get Balance</Button>       {this.state.balance}
            <hr></hr>
            <Button   onClick={this.performMining}>Mine</Button>
            </Card.Body>
          </Card>
      );
    }
}

export default Client;