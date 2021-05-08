const BootBot = require('bootbot');
const config = require('config');
const api = require('./lib/coinranking-api.js');
const constants = require('./config/constants');

var port = process.env.PORT || config.get('PORT');

const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});

/*
  Nastavení úvodního oslovení, zobrazuje se při první interakci.
 */
bot.setGreetingText('Vítejte.');

/*
  Reakce na pozdrav
 */
bot.hear(constants.GREETINGS, (payload, chat) => {
  chat.say({
    text: 'What can I do for you?',
    buttons: [
      {type: 'postback', title: 'Who are you?', payload: 'ABOUT'},
      {type: 'postback', title: 'Help me with...?', payload: 'TOPICS'},
      {type: 'postback', title: 'Surprise me!', payload: 'RANDOM_FACT'}
    ]
  });
  chat.say('Greetings!');
});


// Reakce na tlačítko 'Who are you?'
bot.on('postback:ABOUT', (payload, chat) => {

});

// Reakce na tlačítko 'Surprise me!'
bot.on('postback:RANDOM_FACT', (payload, chat) => {
  chat.conversation((conversation) => {
    sayFact(chat, conversation)
  });
});

// Reakce na tlačítko 'Help me with...?'
bot.on('postback:TOPICS', (payload, chat) => {

  api.getCoinsIndex().then((data) => {
    chat.say(`I can tell you something about ${data.coins.length} different coins! I know their actual price, description, and I can even show you their logo!`);
    chat.say({
      text: 'What can I do for you?',
      buttons: [
        {type: 'postback', title: 'Coin price', payload: 'PRICE'},
        {type: 'postback', title: 'Coin description', payload: 'DESCRIPTION'},
        {type: 'postback', title: 'Coin logo', payload: 'LOGO'}
      ]
    });
  })

});

// Reakce na tlačítko 'Coin description!'
bot.on('postback:DESCRIPTION', (payload, chat) => {
  getCoinNameOrSymbol(chat, coinDescription)
});

function coinDescription(chat, coinNameOrCode) {
  api.getCoinsIndex().then((data) => {
      let downcasedCoin = coinNameOrCode.toLowerCase()
      let coinData = data.coins.find(coin => coin.code.toLowerCase() === downcasedCoin || coin.name.toLowerCase() === downcasedCoin);
      if (coinData) {
        api.getCoinDescription(coinData.uuid).then((coinDescription) => {
          console.log(coinDescription)
          chat.say(coinDescription)
        })
      }
    }
  )
}


// Reakce na tlačítko 'Coin price!'
bot.on('postback:PRICE', (payload, chat) => {
  chat.conversation((conversation) => {
    getCoinNameOrSymbol(chat, conversation, coinPrice)
  });
});

function coinPrice(chat, conversation, coinNameOrCode) {
  api.getCoinsIndex().then((data) => {
      let coinData = findCoinData(data, coinNameOrCode);
      if (coinData) {
        api.getCoinPrice(coinData.uuid).then((coinPrice) => {
          chat.say(`Actual price of ${coinData.name} is ${coinPrice}`)
        })
      } else {
        handleCoinNotFound(chat, conversation, getCoinNameOrSymbol, coinPrice)
      }
    }
  )
}

/*
  Ziska od uzivatele nazev nebo symbol coinu a preda ho callback funkci ke zpracovani
 */
function getCoinNameOrSymbol(chat, conversation, callback) {
  conversation.ask(`What is the name or symbol of the coin?`, (payload, conversation) => {
    callback(chat, conversation, payload.message.text);
  });
}

/*
 Vypíše náhodný fakt a po chvilce zavolá funkci pro dotaz na pokračování
 */
function sayFact(chat, conversation) {
  chat.say(constants.RANDOM_FACTS[Math.floor(Math.random() * constants.RANDOM_FACTS.length)])
  setTimeout(() => {
    askIfUserWantsAnotherFact(chat, conversation)
  }, 2000)
}

/*
 Dotaz, zda uzivatel chce slyset dalsi nahodny fakt.
 */
function askIfUserWantsAnotherFact(chat, conversation) {
  conversation.ask({
    text: "Would you like to hear next one?",
    quickReplies: ["Yes", "No"],
    options: {typing: true}
  }, (payload, conversation) => {
    if (payload.message.text === "Yes") {
      sayFact(chat, conversation)
    } else {
      conversation.say("Ok", {typing: true});
      conversation.end();
    }
  });
}

function handleCoinNotFound(chat, conversation, retryCallback, callback2) {
  conversation.ask({
    text: "I don't know this coin. Try another?",
    quickReplies: ["Yes", "No"],
    options: {typing: true}
  }, (payload, conversation) => {
    if (payload.message.text === "Yes") {
      retryCallback(chat, conversation, callback2)
    } else {
      conversation.say("Ok, bye for now.", {typing: true});
      conversation.end();
    }
  })
}

function findCoinData(data, coinNameOrCode) {
  let downcasedCoin = coinNameOrCode.toLowerCase();
  return data.coins.find(coin => coin.code.toLowerCase() === downcasedCoin || coin.name.toLowerCase() === downcasedCoin);
}


bot.hear('ask me something', (payload, chat) => {

  const askName = (convo) => {
    convo.ask(`What's your name?`, (payload, convo) => {
      const text = payload.message.text;
      convo.set('name', text);
      convo.say(`Oh, your name is ${text}`).then(() => askFavoriteFood(convo));
    });
  };

  const askFavoriteFood = (convo) => {
    convo.ask(`What's your favorite food?`, (payload, convo) => {
      const text = payload.message.text;
      convo.set('food', text);
      convo.say(`Got it, your favorite food is ${text}`).then(() => sendSummary(convo));

    });
  };

  const sendSummary = (convo) => {
    convo.say(`Ok, here's what you told me about you:
	      - Name: ${convo.get('name')}
	      - Favorite Food: ${convo.get('food')}`);
    convo.end();
  };

  chat.conversation((convo) => {
    askName(convo);
  });
});


bot.hear(/movie (.*)/i, (payload, chat, data) => {
  chat.conversation((conversation) => {
    console.log(data);
    const movieName = data.match[1];
    console.log(`movieName: ${movieName}`);
  });
});


// bot.hear(['hello', 'hi'], (payload, chat) => {
//   console.log('The user said "hello" or "hi"!');
//   api.getCoinsList().then((data) => {
//     console.log("coind data:" + data);
//     chat.say('If you would like to know about movies, just type "movie" and movie na¨wme')
//   });
//
// });
//
//


// jakákoliv zpráva
// bot.on('message', (payload, chat) => {
//   // console.log(constants.GREETINGS);
//   const text = payload.message.text;
//   console.log(`The user said: ${text}`);
//   api.getCoinsIndex().then((data) => {
//     console.log("coind data:");
//     console.log(data);
//   });
//
//
// });

bot.start(port);
