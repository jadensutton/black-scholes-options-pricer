import React, { useRef, useState, useEffect } from 'react'

import { Form, Button, Card, Alert, Navbar, Container, ListGroup, ListGroupItem } from 'react-bootstrap'
import axios from 'axios'

function App() {
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState('NaN')

    const ticker = useRef()
    const type = useRef()
    const strike = useRef()
    const riskFreeRate = useRef()
    const expDate = useRef()
    const vol = useRef()

    async function handleSubmit(e) {
        e.preventDefault()

        setError('')
        setLoading(true)
        

        await axios.get('https://black-scholes-options-pricer.herokuapp.com/price_option', {
                params: {
                    ticker: ticker.current.value,
                    type: type.current.value,
                    strike: strike.current.value,
                    risk_free_rate: riskFreeRate.current.value,
                    exp_date: expDate.current.value,                  
                    vol: vol.current.value
                }
            }).then(response => {
                if (response['data']['status'] == 'success') {
                    setData(response['data']['result'])
                } else {
                    setError(response['data']['result'])
                }
            }).catch(error => {
                setError('Unknown error encountered.')
        })

        setLoading(false)
    }

    return (
        <div>
            <Navbar bg='light' expand='lg'>
                <Container>
                    <Navbar.Brand >Black-Scholes Options Pricer</Navbar.Brand>
                    <Navbar.Toggle aria-controls='basic-navbar-nav' />
                </Container>
            </Navbar>
            <div className='d-flex align-items-center justify-content-center'
            style={{minHeight: '130vh'}}
            >
                <div className='w-100 d-flex align-items-center justify-content-center'>        
                    <div style={{minWidth: '600px'}}>
                        <Card>
                            <Card.Body>
                                <h2 className='text-center mb-4'>Option Variables</h2>
                                {error && <Alert variant='danger'>{error}</Alert>}
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group id='option-variables'>
                                        <Form.Label>Underlying Ticker</Form.Label>
                                        <Form.Control type='text' ref={ticker} required />   

                                        <Form.Label>Option Type</Form.Label>
                                        <Form.Select ref={type} required>
                                            <option value='C'>Call</option>
                                            <option value='P'>Put</option>                                            
                                        </Form.Select>  
                                        
                                        <Form.Label>Option Strike</Form.Label>
                                        <Form.Control type='text' ref={strike} required />  

                                        <Form.Label>Risk Free Rate (%)</Form.Label>
                                        <Form.Control type='text' ref={riskFreeRate} required />  

                                        <Form.Label>Option Expiration Date</Form.Label>
                                        <Form.Control type='date' ref={expDate} required />

                                        <Form.Label>Implied Volatility (%)</Form.Label>
                                        <Form.Control type='text' ref={vol} required /> 
                                    </Form.Group>

                                    <Button disabled={loading} className='w-100 mt-4' type='submit'>
                                        Price Option
                                    </Button>

                                    {data != 'NaN' ? <h5 className='text-center mb-4 mt-4'>Option Value: ${data}</h5> : null}                                 
                                </Form>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </div>   
        </div>
    );
}

export default App;