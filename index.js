const BootBot = require('bootbot');
const config = require('config');
const api = require('./lib/coinranking-api.js');
const constants = require('./config/constants');

const port = process.env.PORT || config.get('PORT');

const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});

/*
  React to greeting by user
 */
bot.hear(constants.GREETINGS, (payload, chat) => {
  introduction(chat)
});

/*
  React to icebreaker response
 */
bot.on('postback:ICEBREAKER', (payload, chat) => {
  introduction(chat)
});

// 'Surprise me!' button click handler
bot.on('postback:RANDOM_FACT', (payload, chat) => {
  chat.conversation((conversation) => {
    sayFact(chat, conversation)
  });
});

function introduction(chat) {
  chat.say('Greetings!');
  setTimeout(() => {
    showMenu(chat)
  }, 250)
}

bot.hear(['menu'], (payload, chat) => {
  showMenu(chat)
});


// 'Who are you?' button click handler
bot.on('postback:ABOUT', (payload, chat) => {
  chat.say('I am CryptoBot - I have access to Coinranking API, so I know a lot of crypto coins. I can tell them their actual price or some basic info abou them. I also know some random facts, be sure to check them out!');
  setTimeout(() => {
    chat.conversation((conversation) => {
      endConversation(chat, conversation)
    });
  }, 250)
});

// 'Surprise me!' button click handler
bot.on('postback:RANDOM_FACT', (payload, chat) => {
  chat.conversation((conversation) => {
    sayFact(chat, conversation)
  });
});

// 'Tell me about...' button click handler
bot.on('postback:TOPICS', (payload, chat) => {

  api.getCoinsIndex().then((data) => {
    chat.say(`I can tell you something about ${data.coins.length} different coins! I know their actual price, description, and I can even show you their logo!`);
    setTimeout(() => {
      chat.say({
        text: 'What would you like to know?',
        buttons: [
          {type: 'postback', title: 'Price of a coin', payload: 'PRICE'},
          {type: 'postback', title: 'Description of a coin', payload: 'DESCRIPTION'}
        ]
      });
    }, 250)
  })

});

// 'Description of a coin' button click handler
bot.on('postback:DESCRIPTION', (payload, chat) => {
  chat.conversation((conversation) => {
    getCoinNameOrSymbol(chat, conversation, coinDescription)
  });
});


// 'Price of a coin' button click handler
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
          chat.say(`Actual price of ${coinData.name} is ${coinPrice} USD`);
          setTimeout(() => {
            endConversation(chat, conversation)
          }, 500);
        })
      } else {
        handleCoinNotFound(chat, conversation, getCoinNameOrSymbol, coinPrice)
      }
    }
  )
}

/*
  Get coin name or symbol from user and handle it to callback function for processing
 */
function getCoinNameOrSymbol(chat, conversation, callback) {
  conversation.ask(`What is the name or symbol of the coin?`, (payload, conversation) => {
    callback(chat, conversation, payload.message.text);
  });
}

/*
 Reply with random fact and later call function to ask if another one is wanted
 */
function sayFact(chat, conversation) {
  chat.say(constants.RANDOM_FACTS[Math.floor(Math.random() * constants.RANDOM_FACTS.length)]);
  setTimeout(() => {
    askIfUserWantsAnotherFact(chat, conversation)
  }, 2000)
}

/*
 Ask user if he would like to hear another fact
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
      endConversation(chat, conversation)
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
      endConversation(chat, conversation)
    }
  })
}

function findCoinData(data, coinNameOrCode) {
  let downcasedCoin = coinNameOrCode.toLowerCase();
  return data.coins.find(coin => coin.code.toLowerCase() === downcasedCoin || coin.name.toLowerCase() === downcasedCoin);
}

function coinDescription(chat, conversation, coinNameOrCode) {
  api.getCoinsIndex().then((data) => {
      let downcasedCoinNameOrCode = coinNameOrCode.toLowerCase();
      let coinData = data.coins.find(coin => coin.code.toLowerCase() === downcasedCoinNameOrCode || coin.name.toLowerCase() === downcasedCoinNameOrCode);
      if (coinData) {
        api.getCoinDescription(coinData.uuid).then((coinDescription) => {
          // Original description has HTML tags, we don't want them in chat - just remove them.
          let description = coinDescription.replace(/(<([^>]+)>)/gi, "");
          // Description is often quite big and breaches chat limitation to 2000 chars in message. So the solution is to send
          // each paragraph (delimited by newline) separately. It is not error proof, as there can be paragraph bigger than the limit, lets
          // hope there actually isn't any.
          description.split("\n").forEach(function (paragraph, index) {
            // Avoid mixed order of messages by sending them with 250ms delay
            setTimeout(() => {
              chat.say(paragraph)
            }, 250 + index * 250)
          })
        })
      } else {
        handleCoinNotFound(chat, conversation, getCoinNameOrSymbol, coinDescription)
      }
    }
  )
}

/*
  Gracefully end conversation
 */
function endConversation(chat, conversation) {
  chat.say("If you need anything else, just say 'menu', I will try to help you.");
  conversation.end();
}

/*
  Show main actions menu
 */
function showMenu(chat) {
  chat.say({
    text: 'What can I do for you?',
    buttons: [
      {type: 'postback', title: 'Who are you?', payload: 'ABOUT'},
      {type: 'postback', title: 'Tell me about...', payload: 'TOPICS'},
      {type: 'postback', title: 'Surprise me!', payload: 'RANDOM_FACT'}
    ]
  });
}

// Set greeting text - shown at first user interaction with the bot.
bot.setGreetingText('Welcome!');
// Start the bot!
bot.start(port);
