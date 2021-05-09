const fetch = require('node-fetch');

const baseUrl = 'https://api.coinranking.com/v2';
const accessToken = 'coinrankingfc2446edb653f4be343835a0d697a1679b8cddfdd44538c2';

let coinsIndex = {};

module.exports = {
  getCoinInfo: function (coinNameOrShortcut) {

  },
  /* Sample response entry:=

     [
      "Qwsogvtv82FCd",
      "bitcoin-btc",
      "Bitcoin",
      "BTC",
      "https://coinranking.com/coin/Qwsogvtv82FCd+bitcoin-btc"
    ]

     See: https://developers.coinranking.com/api/documentation/indexes#get-coins-index
   */
  getCoinFromResponseEntry(responseEntry) {
    return {
      code: responseEntry[3],
      name: responseEntry[2],
      uuid: responseEntry[0]
    }
  },
  /*
    Read array of Coin data from response, create object for each and return all. Also include time stamp.
   */
  getCoinsDataIndex: function (coinsData) {
    let data = {
      coins: []
    };
    coinsData.forEach((responseEntry) => {
      data['coins'].push(
        this.getCoinFromResponseEntry(responseEntry)
      )
    });

    let validUntil = new Date();
    validUntil.setTime(validUntil.getTime() + 10 * 60 * 1000);
    data['validUntil'] = validUntil;
    return data
  },

  /*
    Get coin index from variable. If there is none or if the data are older than 10 minutes, read new index from API
   */
  getCoinsIndex: async function () {
    if (coinsIndex.coins === undefined || coinsIndex.validUntil < new Date()) {
      console.log('Data not found or expired, refresh!');
      let coinsData = await this.loadCoinsIndex();
      coinsIndex = this.getCoinsDataIndex(coinsData);
    }
    return coinsIndex
  },
  loadCoinsIndex: function () {
    return new Promise((resolve, reject) => {
      let options = {
        headers: {
          'x-access-token': accessToken
        }
      };
      fetch(baseUrl + '/indexes/coins', options).then(res => res.json()).then(json => {
        resolve(json.coins)
      })
    })
  },

  /*
    Read coin data object and return its actual price
   */
  getCoinPrice: async function (coinUuid) {
    let coinData = await this.getCoinData(coinUuid);
    return coinData.price
  },
  /*
    Read coin data object and return its description
   */
  getCoinDescription: async function (coinUuid) {
    let coinData = await this.getCoinData(coinUuid);
    return coinData.description
  },
  /*
    Read data for given coin uuid from API
   */
  getCoinData: function (coinUuid) {
    let options = {
      headers: {
        'x-access-token': accessToken
      }
    };
    return new Promise((resolve, reject) => {
      fetch(baseUrl + '/coin/' + coinUuid, options).then(res => res.json()).then(json => {
        resolve(json.data.coin)
      })
    })
  }
};



