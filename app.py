import flask
import json
import requests

import numpy as np

from scipy.stats import norm
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from flask import request
from flask.helpers import send_from_directory
from flask_cors import CORS, cross_origin

app = flask.Flask(__name__, static_folder='client/build', static_url_path='')
cors = CORS(app)
app.config['CORS_HEADER'] = 'Content-Type'

def scrape_spot_price(ticker) -> float:
    #Web scrape current price from Yahoo Finance
    r = requests.get('https://finance.yahoo.com/quote/{}'.format(ticker))
    soup = BeautifulSoup(r.text, 'lxml')
    price = float(soup.find('fin-streamer', {'class' : 'Fw(b) Fz(36px) Mb(-4px) D(ib)'}).get('value'))
    return price

def black_scholes(type: str, spot: float, strike: float, risk_free_rate: float, time_to_exp: float, vol: float) -> float:
    #Calculate d1 and d2
    d1 = (np.log(spot / strike) + (risk_free_rate + vol ** 2 / 2) * time_to_exp) / (vol * np.sqrt(time_to_exp))
    d2 = d1 - vol * np.sqrt(time_to_exp)

    #Apply the call or put formula to calculate value
    if type == 'C':
        value = spot * norm.cdf(d1, 0, 1) - strike * np.exp(-risk_free_rate * time_to_exp) * norm.cdf(d2, 0, 1)
    elif type == 'P':
        value = strike * np.exp(-risk_free_rate * time_to_exp) * norm.cdf(-d2, 0, 1) - spot * norm.cdf(-d1, 0, 1)

    return round(value, 2)

@app.route('/price_option', methods=['GET'])
@cross_origin()
def price_option() -> dict:
    try:
        #Convert user friendly param format into the format used by the Black-Scholes model
        r = request.args
        ticker = r['ticker']
        type = r['type']
        strike = float(r['strike'])
        risk_free_rate = float(r['risk_free_rate']) / 100
        vol = float(r['vol']) / 100
        exp_date = datetime.strptime(r['exp_date'], '%Y-%m-%d') + timedelta(minutes=990)
        now = datetime.now()
        time_to_exp = (exp_date - now).total_seconds() / (86400 * 365)
        spot = scrape_spot_price(ticker)    #Get spot price

        return {'status': 'success', 'result': black_scholes(type, spot, strike, risk_free_rate, time_to_exp, vol)}

    except Exception as e:
        print(e)
        return {'status': 'failure', 'result': 'Error encountered. Please ensure all the inputs are valid.'}

@app.route('/')
@cross_origin()
def serve():
    return send_from_directory(app.static_folder, 'index.html')
