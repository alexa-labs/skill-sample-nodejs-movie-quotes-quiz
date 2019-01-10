/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const Main = require('mainscreen.json');
const WhichMovie = require('whichmovie.json');
const Quote = require('quote.json');


/******** HANDLERS ********/

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(welcomeMessage)
        .reprompt(welcomeMessage)
        .addDirective({
          type : 'Alexa.Presentation.APL.RenderDocument',
          document : Main,
          datasources : {
            "movieQuoteQuizData": {
              "type": "object",
              "properties": {
                "title": "How Well Do You Know: Movie Quote Quiz!"
              }
            }
          }
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(welcomeMessage)
        .reprompt(welcomeMessage)
        .getResponse();
    }
  },
};

const YesIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'NextMovieIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StartOverIntent');
  },
  handle(handlerInput) {
    const speechText = `Let's test your knowledge. Pick a movie!`;
    if (handlerInput.requestEnvelope.request.intent.name === 'NextMovieIntent') {
      speechText = `Okie dokie, now what movie would you like to try?`;
    }
    console.log(handlerInput.requestEnvelope.request.intent);
    
    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .addDirective({
          type : 'Alexa.Presentation.APL.RenderDocument',
          document : WhichMovie,
          datasources : {}
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    }
  },
};

const MovieIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'MovieNameIntent'
      || handlerInput.requestEnvelope.request.intent.name === 'NextQuoteIntent');
  },
  handle(handlerInput) {
    let speechText;
    if (handlerInput.requestEnvelope.request.intent.name === 'MovieNameIntent') {
      currentMovie = handlerInput.requestEnvelope.request.intent.slots.movieName.resolutions.resolutionsPerAuthority[0].values[0].value.name;
      speechText = `Okie dokie, let's test you on ${currentMovie}. Complete this quote: `;
    } else if (handlerInput.requestEnvelope.request.intent.name === 'NextQuoteIntent') {
      speechText = `Onward! Try completing this quote: `;

      if (currentMovie === null) {
        speechText = `Something went wrong.`;
        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(speechText)
          .withSimpleCard(`Oops!`, `Try saying, "Alexa, help"`)
          .getResponse();
      }
    }

    let quote = breakDownSentence(pickSentence(currentMovie));
    console.log(quote);
    speechText += quote.replace('_____', `<emphasis level="strong">blank</emphasis>`);

    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .addDirective({
          type : 'Alexa.Presentation.APL.RenderDocument',
          document : Quote,
          datasources : {
              "movieQuoteQuizData": {
                  "type": "object",
                  "properties": {
                      "title": quote,
                      "backgroundImageRound": "https://i.imgur.com/prffOgH.png",
                      "backgroundImageLandscape": "https://i.imgur.com/sjREu6G.png"
                  }
              }
          }
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    }
  }
};

const AnswerIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AnswerIntent';
  },
  handle(handlerInput) {
    let spokenWord = handlerInput.requestEnvelope.request.intent.slots.word.value;
    let speechText = '';
    let quote = '';
    let directives = ''

    if (currentChosenWord === null) {
      speechText = `Say "help" if you aren't sure what to do!`;

      if (supportsAPL(handlerInput)) {
        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(speechText)
          .addDirective({
              type : 'Alexa.Presentation.APL.RenderDocument',
              document : Main,
              datasources : {
                "movieQuoteQuizData": {
                  "type": "object",
                  "properties": {
                    "title": speechText
                  }
                }
              }
          })
          .getResponse();
      }
    } else if (currentChosenWord === spokenWord) {
      speechText = getSpeechCon(true);
      quote = `${capitalizeFirstLetter(currentChosenWord)} is correct! Say "new quote" or another movie title!`;

      if (supportsAPL(handlerInput)) {
        return handlerInput.responseBuilder
          .speak(speechText + quote)
          .reprompt(speechText + quote)
          .addDirective({
              type : 'Alexa.Presentation.APL.RenderDocument',
              document : Quote,
              datasources : {
                  "movieQuoteQuizData": {
                      "type": "object",
                      "properties": {
                          "title": quote,
                          "backgroundImageRound": "https://i.imgur.com/GOsI1RN.png",
                          "backgroundImageLandscape": "https://i.imgur.com/yHBbX4l.png"
                      }
                  }
              }
          })
          .getResponse();
      }
    } else {
      speechText = getSpeechCon(false);
      quote = `The correct answer was ${currentChosenWord}. Say "new quote" or another movie title!`;
      
      if (supportsAPL(handlerInput)) {
        return handlerInput.responseBuilder
          .speak(speechText + quote)
          .reprompt(speechText + quote)
          .addDirective({
              type : 'Alexa.Presentation.APL.RenderDocument',
              document : Quote,
              datasources : {
                  "movieQuoteQuizData": {
                      "type": "object",
                      "properties": {
                          "title": quote,
                          "backgroundImageRound": "https://i.imgur.com/qkiABIN.png",
                          "backgroundImageLandscape": "https://i.imgur.com/sfXjUK1.png"
                      }
                  }
              }
          })
          .getResponse();  
      }
    }

    return handlerInput.responseBuilder
        .speak(speechText + quote)
        .reprompt(speechText + quote)
        .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(helpMessage)
        .reprompt(helpMessage)
        .addDirective({
          type : 'Alexa.Presentation.APL.RenderDocument',
          document : Main,
          datasources : {
            "movieQuoteQuizData": {
              "type": "object",
              "properties": {
                "title": helpMessage
              }
            }
          }
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(helpMessage)
        .reprompt(helpMessage)
        .getResponse();
    }
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(speechText)
        .addDirective({
          type : 'Alexa.Presentation.APL.RenderDocument',
          document : Main,
          datasources : {
            "movieQuoteQuizData": {
              "type": "object",
              "properties": {
                "title": "Thanks for playing!"
              }
            }
          }
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse();
    }
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    currentChosenWord = null;
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log("WHOLE ERROR" + JSON.stringify(error));

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

/******** VARIABLES ********/

let currentChosenWord = null;
let currentMovie = null;
const welcomeMessage = `Welcome to How Well Do You Know, the hottest movie quote quiz game in the world. Are you ready to play?`;
const helpMessage = `Name the movie you would like to be tested on, and then say the missing word in the quote!`;
const speechConsCorrect = ['Booya', 'All righty', 'Bam', 'Bazinga', 'Bingo', 'Boom', 'Bravo', 'Cha Ching', 'Cheers', 'Dynomite', 'Hip hip hooray', 'Hurrah', 'Hurray', 'Huzzah', 'Oh dear.  Just kidding.  Hurray', 'Kaboom', 'Kaching', 'Oh snap', 'Phew','Righto', 'Way to go', 'Well done', 'Whee', 'Woo hoo', 'Yay', 'Wowza', 'Yowsa'];
const speechConsWrong = ['Argh', 'Aw man', 'Blarg', 'Blast', 'Boo', 'Bummer', 'Darn', "D'oh", 'Dun dun dun', 'Eek', 'Honk', 'Le sigh', 'Mamma mia', 'Oh boy', 'Oh dear', 'Oof', 'Ouch', 'Ruh roh', 'Shucks', 'Uh oh', 'Wah wah', 'Whoops a daisy', 'Yikes'];
const data = [
  {movieName: 'wonder wheel', sentences: [
    `What a sheltered life I've led. I have book knowledge but you've really tasted life.`,
    `Nothing you could tell me could put the slightest shadow on this evening.`,
    `The kid makes fires. And not such little ones.`,
    `Yeah, but you've been around the block. You think you'll always be looking over your shoulder?`,
    `Everybody dies, you can't walk around thinking about it.`,
    `You people would never try to hide her, would you?`,
    `Let me get to the story in which I am a character, so, be warned, as a poet, I use symbols, and as a budding dramatist, I relish melodrama and larger-than-life characters.`,
    `A writer of truly great plays, so I can one day surprise everyone and turn out a profound masterpiece.`,
    `I'm Mickey Rubin. Poetic by nature. I harbor dreams of being a writer.`,
    `The beach, the boardwalk. Once a luminous jewel, but growing relentlessly seedier as the tides roll in and out.`,
    `Is it the eternal power of the universe? The conversion of mass into energy? The Furies at work? Whatever his motive, it is not appreciated.`
  ]},
  {movieName: 'gringo',  sentences: [
    `What kind of a man does not believe in God?`,
    `Why do I always get screwed for doing my job?`,
    `I know I'm not supposed to touch the mini-bar but I'm going to do it. `,
    `You know, I don't even care anymore, I'm doing it. I'm having the merlot!`,
    `One was a man who had a crisis of faith and the other was a man who sold his soul for personal gain. So, you have to decide which one you want to be.`
  ]},
  {movieName: 'the wall',  sentences: [
    `You Americans. You think you know it all.`,
    `Tear up the planks! Here, here! It is the beating of his hideous heart.`,
    `From a place you will not see comes a sound you will not hear.`,
    `We got no movement, not a sign of a shadow.`,
    `Shakespeare? Is that the only poet you know?`,
    `You minor in sniping or something?`,
    `American. Tell Tale Heart.`,
    `You think it's simple. That I am your enemy. But we are not so different, you and I.`,
    `You are the one who has come to another man's country. `,
    `Camouflaged yourself in his land, in his soil. From where I'm sitting, you look very much like the terrorist.`,
    `Whoever it was they're gone. War's over, he got the memo.`,
    `Just a flash of light. Boom.`
  ]},
  {movieName: 'last flag flying',  sentences: [
    `Hey, at least we're not drug addicts.`,
    `I'm not going to bury a marine. I'm just going to bury my son.`,
    `Every generation has their war. Men make the wars and wars make the men. It never ends!`,
    `We are going to a funeral. Just looks like it's going to take a little longer to get there.`,
    `With all due respect, sir, you're cutting off your nose to spite your face.`,
    `I got more time in the chow line than you got in the corps.`,
    `Man, I would've loved to run into you in the field in my younger days.`,
    `I'd rather be fighting them over there than in our own backyard.`,
    `Sal, if you had any more manners, you would be a dog.`,
    `You put this somewhere and you let it remind you what was in your son's heart`,
    `Urine. I love it. It's like the official scent of the city.`,
    `Colonels don't scare me. Never have, never will.`
  ]},
  {movieName: 'paterson',  sentences: [
    `Sometimes an empty page presents more possibilities`,
    `You're up late, honey. Your silent magic watch didn't wake you up.`,
    `Poetry in translations is like taking a shower with a raincoat on.`,
    `Without love what reason is there for anything?`,
    `I was dreaming that we were in ancient Persia. And... you were riding on an elephant. A big, silver elephant.`,
    `Yeah, I guess if it's for you, it's a love poem. It's kind of inspired by our Ohio Blue Tip Matches.`,
    `My guitar should arrive today. My harlequin guitar direct from Esteban.`,
    `Do you think there are any other anarchists still around in Paterson?`,
    `I always say don't try to change things or you'll make them even worse.`,
    `Speaking of secret pie, I wanted to tell you something about your secret notebook.`
  ]}
];

/******** HELPER FUNCTIONS ********/

function getRandom(min, max) {
  return Math.floor((Math.random() * ((max - min) + 1)) + min);
}

function getSpeechCon(type) {
  if (type) return `<say-as interpret-as='interjection'>${speechConsCorrect[getRandom(0, speechConsCorrect.length - 1)]}! </say-as><break strength='strong'/>`;
  return `<say-as interpret-as='interjection'>${speechConsWrong[getRandom(0, speechConsWrong.length - 1)]} </say-as><break strength='strong'/>`;
}

function capitalizeFirstLetter(string) {
  let x = string;
  return x.charAt(0).toUpperCase() + x.slice(1);
}

// get a new sentence with a replaced word and the word to be guessed
function breakDownSentence(sent) {
  let arr = sent.split(' ');
  let boringWords = [
    `know`,
    `there`,
    `then`,
    `I'll`,
    `it's`,
    `here`,
    `wait`,
    `some`,
    `like`,
    `mean`,
    `you`,
    `with`,
    `seem`,
    `about`,
    `they're`,
    `that`,
    `I've`,
    `have`
  ]
  let legalWords = arr.filter(word => {
    return word.length > 3 && !boringWords.includes(word);
  });
  let chosenWord = legalWords[getRandom(0, legalWords.length - 1)];
  arr[arr.indexOf(chosenWord)] = '_____'; // 5 underscores
  currentChosenWord = chosenWord.replace(/[^0-9a-z]/gi, '').toLowerCase();

  return arr.join(' ');
}

function pickSentence(movie) {
  let movieQuotes = data.filter((obj) => {
    return obj.movieName === movie;
  })[0].sentences;
  return movieQuotes[getRandom(0, movieQuotes.length - 1)];
}

function supportsAPL(handlerInput) {
    const supportedInterfaces = handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
    const aplInterface = supportedInterfaces['Alexa.Presentation.APL'];
    return aplInterface != null && aplInterface != undefined;
}

/******** LAMBDA SETUP ********/

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    MovieIntentHandler,
    YesIntentHandler,
    AnswerIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
