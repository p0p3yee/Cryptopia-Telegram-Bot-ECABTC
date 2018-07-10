# Cryptopia Telegram Bot (ECA/BTC) Ver.

A Telegram Bot that can interact with Cryptopia ECA/BTC Market.

## Requirement

1. Telegram Bot Token
2. NodeJS
3. Cryptopia Private API Key & Secret

## Installation

1. Download the Project
2. Run `npm install` in the directory (**Make sure you installed NodeJS**)
3. Setup your Config in `config[template].json` (**API Key, Api Secret, Bot Token, TimeZone** etc.)
4. Rename `config[template].json` to `config.json`
5. Rename `ownOpenOrders[template].json` to `ownOpenOrders.json`
5. Run `node app.js` in the directory
6. Type `/start` in the telegram chat with your bot.
7. Done.

## Help

Q: How to create telegram bot ? 

A: [Create Telegram Bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot)

Q: How to install NodeJs ?

A: [Download Here](https://nodejs.org/en/download/current/)

Q: How do i get Bot Token ?

A: You can get Bot Token after creating a bot. [See here if you don't know how to create Telegram Bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot)

Q: How do i get Cryptopia API Key and API Secret ?

A: In Cryptopia > Setting > Security > Account Security > Api Setting > Check `Enable API` (If you want to allow Withdraw, Click `Enable Withdrawal` too) > Click `New Key` > Click `Save Changes` > Copy **Api Key** And **Api Secret** To config.json

## Commands 

1. `/Balance [Currency]` : Get Specific Currency's Balance in Cryptopia.
2. `/submitOrder [Buy/Sell] [Price in BTC] [ECA Amount]` : Place Buy/Sell ECA Order.
3. `/cancelOrder [OrderID]` : Cancel Buy/Sell ECA Order.
4. `/listOrders` : List all ECA Open Orders.
5. `/Deposit [Currency]` : Get Deposit Address of Specific Currency in Cryptopia.
6. `/getMarket [Currency_BaseCurrency]` : Get Market of the Specific Market, For example: `/getMarket ECA_BTC`, get ECA_BTC Market.
7. `/getMarketOrders [Currency_BaseCurrency]` Get Market Orders of the Specific Market, For example: `/getMarketOrders ECA_BTC`, get ECA_BTC Market Orders.


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
