import React, { useRef, useState } from 'react'

import { Form, Button, Card, Alert, Navbar, Container, ListGroup, ListGroupItem } from 'react-bootstrap'
import { Heatmap, HeatmapSeries } from 'reaviz'
import axios from 'axios'

function App() {
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [option_value, setOptionValue] = useState('')
    const [heatmap_data, setHeatmapData] = useState([])

    const ticker = useRef()
    const type = useRef()
    const strike = useRef()
    const riskFreeRate = useRef()
    const expDate = useRef()
    const impVol = useRef()
    const includeHeatmap = useRef()

    const getTestDate = () => {
        const testDate = new Date()
        testDate.setDate(testDate.getDate() + 90)
        var month = testDate.getMonth() + 1
        if (month <= 9) {
            month = '0' + month
        }
        var day = testDate.getDate()
        if (day <= 9) {
            day = '0' + day
        }

        return `${testDate.getFullYear()}-${month}-${day}`
    }

    function quickTest(e) {
        ticker.current.value = 'AAPL'
        type.current.value = 'C'
        strike.current.value = 150
        riskFreeRate.current.value = 0
        expDate.current.value = getTestDate()
        impVol.current.value = 25
        includeHeatmap.current.value = 'true'

        handleSubmit(e)
    }

    async function handleSubmit(e) {
        e.preventDefault()

        setError('')
        setLoading(true)
        
        await axios.get('/price_option', {
                params: {
                    ticker: ticker.current.value,
                    type: type.current.value,
                    strike: strike.current.value,
                    risk_free_rate: riskFreeRate.current.value,
                    exp_date: expDate.current.value,                  
                    imp_vol: impVol.current.value,
                    include_heatmap: includeHeatmap.current.value
                }
            }).then(response => {
                setOptionValue(response['data']['value'])
                setHeatmapData(response['data']['heatmap_data'])
            }).catch(error => {
                setError('Experienced error. Please ensure all inputs are valid')
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
            style={{minHeight: '130vh', marginTop: '50px'}}
            >
                <div className='w-100 d-flex align-items-center justify-content-center'>        
                    <div style={{minWidth: '600px', marginBottom: '50px'}}>
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
                                        <Form.Control type='text' ref={impVol} required /> 

                                        <Form.Label>Include Heat Map</Form.Label>
                                        <Form.Select ref={includeHeatmap} required>
                                            <option value='true'>Yes</option>
                                            <option value='false'>No</option>                                            
                                        </Form.Select> 
                                    </Form.Group>

                                    <Button disabled={loading} className='w-100 mt-4' type='submit'>
                                        Price Option
                                    </Button>                                 
                                </Form>

                                <div className='text-center'>
                                    or
                                </div>

                                <Button disabled={loading} className='w-100' onClick={quickTest}>
                                    Quick Test
                                </Button>

                                {option_value ? <h5 className='text-center mb-4 mt-4'>Option Value: ${option_value}</h5> : null}
                            </Card.Body>
                        </Card>
                        
                        {heatmap_data.length ? <h5 className='text-center mb-4 mt-4'>Option Value vs. Underlying Price/Time-to-Maturity</h5> : null}
                        <Heatmap
                            height={250}
                            width={'100%'}
                            data={heatmap_data}
                            series={<HeatmapSeries colorScheme={['#cce7ff', '#99cfff', '#66b8ff', '#33a0ff', '#0088ff', '#0074d9']} />}
                        />
                    </div>
                </div>
            </div>   
        </div>
    );
}

export default App;