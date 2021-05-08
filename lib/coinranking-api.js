const fetch = require('node-fetch');

const baseUrl = 'https://api.coinranking.com/v2/';
const accessToken = 'coinrankingfc2446edb653f4be343835a0d697a1679b8cddfdd44538c2';

let cache = {};

module.exports = {
  getCoinInfo: function (coinNameOrShortcut) {

  },
  getFromCache: async function (dataKey) {
    let value = cache[dataKey];
    if (value === undefined) {
      console.log('read new ');
      let coinsData = await this.loadCoinsInfo();
      cache[dataKey] = coinsData;
      return coinsData
    } else {
      console.log('get key from cache ');
      return value
    }
  },
  getCoinsList: function () {
    return this.getFromCache('coinsList')
  },
  loadCoinsInfo: function () {
    return new Promise((resolve, reject) => {
      fetch(baseUrl + '/coins').then(res => res.json()).then(json => {
        resolve(json.data.coins)
      })
    })
  }
};



