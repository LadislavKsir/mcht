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
  console.log('The user said "hello" or "hi"!');
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

// Reakce na tlačítko 'Help me with...?'
bot.on('postback:TOPICS', (payload, chat) => {

});

// Reakce na tlačítko 'Surprise me!'
bot.on('postback:RANDOM_FACT', (payload, chat) => {
  chat.say(constants.RANDOM_FACTS[Math.floor(Math.random() * constants.RANDOM_FACTS.length)])
});


// bot.hear(['hello', 'hi'], (payload, chat) => {
//   console.log('The user said "hello" or "hi"!');
//   api.getCoinsList().then((data) => {
//     console.log("coind data:" + data);
//     chat.say('If you would like to know about movies, just type "movie" and movie name')
//   });
//
// });
//
//


// jakákoliv zpráva
bot.on('message', (payload, chat) => {
  // console.log(constants.GREETINGS);
  const text = payload.message.text;
  console.log(`The user said: ${text}`);
// Send a button template

});

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

bot.start(port);
