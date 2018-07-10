# Cryptopia Telegram Bot (ECA/BTC) Ver.

A Telegram Bot that can interact with Cryptopia ECA/BTC Market.

## Requirement

1. Telegram Bot Token
2. NodeJS
3. Cryptopia Private API Key & Secret

## Installation

1. Download the Project
2. Run `npm install` in the directory
3. Setup your Config in `config[template].json` (**API Key, Api Secret, Bot Token, TimeZone**)
4. Rename `config[template].json` to `config.json`
5. Rename `ownOpenOrders[template].json` to `ownOpenOrders.json`
5. Run `node app.js` in the directory
6. Type `/start` in the telegram chat with your bot.
7. Done.

## Help

Q: How to create telegram bot ? 
A: [Create Telegram Bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot)

## Commands 

1. Get ECA Balance in Cryptopia: `/Balance`
2. Place Buy/Sell ECA Order: `/submitTrade [Buy/Sell] [Price in BTC] [ECA Amount]`
3. Cancel Buy/Sell ECA Order: `/cancelOrder [OrderID]`
4. List all ECA Open Orders: `/listOpenOrders`

## Built With

* [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
* [cryptopia-api](https://github.com/periapsistech/cryptopia-api)

## Author

Find me if you have any question about the bot.

**itD0g** - [Telegram](https://t.me/itD0g)

## Donation

1. **BTC** : `18tfrh9fA4XZz9b4mNP2t9AaYDa1XGR1FM`
2. **ETH** : `0x54DD3A68C8d0A7930A09f90F7a1ea15c2D2abC5E`
3. **ECA** : `EKAad7P8hLQ5x4g758keYUAKVfjryGrhKU`

## Disclaimer

**In no event shall this bot or its dev(me) be responsible for any loss.**
