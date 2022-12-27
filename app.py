import flask
import requests

import numpy as np

from scipy.stats import norm
from math import ceil, log10, floor
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from flask import request, jsonify
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

def heatmap(type: str, spot: float, strike: float, risk_free_rate: float, exp_date: datetime, imp_vol: float) -> list:
    #Fill out arrays for the x and y ranges
    now = datetime(*datetime.now().timetuple()[:3])
    days_to_exp = ceil((exp_date - now).total_seconds() / 86400)
    if days_to_exp >= 365:
        x_labels = [now + timedelta(days=30*x) for x in range(1, floor(days_to_exp / 30))]
    elif days_to_exp >= 60:
        x_labels = [now + timedelta(days=7*x) for x in range(1, floor(days_to_exp / 7))]
    elif days_to_exp > 0:
        x_labels = [now + timedelta(days=x) for x in range(1, days_to_exp)]
    else:
        raise Exception('Expiry date must be greater than current date')

    x_range_imp_vol = imp_vol / np.sqrt(365 / days_to_exp)
    y_precision = 10 ** ceil(log10(spot * 0.001))
    y_labels = [x for x in range(round(spot * (1 - x_range_imp_vol) / y_precision) * y_precision, round(spot * (1 + x_range_imp_vol) / y_precision) * y_precision + 1, y_precision)]

    #Calculate the black scholes value for every date and underlying price combination
    data = [{'key': date.strftime('%m/%d/%Y'), 'data': [{'key': price, 'data': black_scholes(type, price, strike, risk_free_rate, (exp_date - date).total_seconds() / (86400 * 365), imp_vol)} for price in y_labels]} for date in x_labels]

    return data

def black_scholes(type: str, spot: float, strike: float, risk_free_rate: float, time_to_exp: float, imp_vol: float) -> float:
    #Calculate d1 and d2
    d1 = (np.log(spot / strike) + (risk_free_rate + imp_vol ** 2 / 2) * time_to_exp) / (imp_vol * np.sqrt(time_to_exp))
    d2 = d1 - imp_vol * np.sqrt(time_to_exp)

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
        imp_vol = float(r['imp_vol']) / 100
        exp_date = datetime.strptime(r['exp_date'], '%Y-%m-%d') + timedelta(minutes=990)
        include_heatmap = r['include_heatmap'] == 'true'
        now = datetime.now()
        time_to_exp = (exp_date - now).total_seconds() / (86400 * 365)
        spot = scrape_spot_price(ticker)    #Get spot price

        return jsonify(value=black_scholes(type, spot, strike, risk_free_rate, time_to_exp, imp_vol), heatmap_data=heatmap(type, spot, strike, risk_free_rate, exp_date, imp_vol) if include_heatmap else []), 200

    except Exception as e:
        print(e)
        return 'Error encountered. Please ensure all the inputs are valid.', 400

@app.route('/')
@cross_origin()
def serve():
    return send_from_directory(app.static_folder, 'index.html')