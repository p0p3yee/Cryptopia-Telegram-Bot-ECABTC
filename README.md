# Cryptopia Telegram Bot (ECA/BTC) Ver.

A Telegram Bot that can interact with Cryptopia ECA/BTC Market.

## Why do i need this bot ?

1. Mainly For **Mobile User**.
2. Cryptopia Mobile Web Version not good enough.
3. Cryptopia **Login Process is ANNOYING**.
4. **Less Mobile Internet Data Usage**.
5. **Much Faster** & **Convenience** way to use Cryptopia.
6. No Additional Application Required (**If you already installed Telegram**)

7. Will Cover to **ALL** Market in Cryptopia **Soon**

## Function of the Bot

1. Get Balance of Specific Currency in Cryptopia
2. Submit Buy / Sell Trade Order
3. Cancel Trade Order
4. List Trade Orders
5. Get Deposit Address of Specific Currency in Cryptopia
6. Get Market of Specific Market in Cryptopia (BidPrice, AskPrice, Low, High, etc.)
7. Get Market Orders of Specific Currency Market in Cryptopia (Current Market Buy / Sell Orders)
8. New Order Received Alert
9. Order Filled Alert
10. Let you know your order's position in the Market **Approximately**.

11. **MORE NEW FEATURES IS COMING**(Auto Trade ?), Feel free to suggest any Features.

## Requirement

1. Telegram Bot Token
2. NodeJS
3. Cryptopia Private API Key & Secret

## Installation

1. Download the Project
2. Run `npm install` in the directory (**Make sure you installed NodeJS**)
3. Setup your Config in `config[template].json` (**API Key, Api Secret, Bot Token, TimeZone** etc.)
(You should **keep ownerID as default**. It will register your telegram ID once you type `/start` to the bot.)
4. Rename `config[template].json` to `config.json` 
5. Rename `ownOpenOrders[template].json` to `ownOpenOrders.json` & Rename `sumbitOrderHistory[template].json` to `sumbitOrderHistory.json`
6. Run `node app.js` in the directory
7. Type `/start` in the telegram chat with your bot.
8. Done.

## Help

Q: > How to create telegram bot ? 

A: [Create Telegram Bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot)

Q: > How to install NodeJs ?

A: [Download Here](https://nodejs.org/en/download/current/)

Q: > How do i get Bot Token ?

A: You can get Bot Token after creating a bot. [See here if you don't know how to create Telegram Bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot)

Q: > How do i get Cryptopia API Key and API Secret ?

A: In Cryptopia > Setting > Security > Account Security > Api Setting > Check `Enable API` (If you want to allow Withdraw, Click `Enable Withdrawal` too) > Click `New Key` > Click `Save Changes` > Copy **Api Key** And **Api Secret** To config.json

Q: > What are `npm install` and `node app.js` mean ?

A: These are the commands that you can execute after installed NodeJs and they are execute on **cmd** or **Terminal**

Q: > How do i execute `npm install` and `node app.js` ? 

A: Open **Terminal** if you are using Linux/Mac, Open **cmd** if you are using Windows, and then type: `cd [directory]`. The `[directory]` is the folder that you just downlaoded. For example: your folder is in `~/Downloads/Cryptopia-Telegram-Bot-ECABTC-master`, then you type `cd ~/Downloads/Cryptopia-Telegram-Bot-ECABTC-master`. Another Example: if your folder is in `C:/Users/abc/Downloads/Cryptopia-Telegram-Bot-ECABTC-master`, then you type `cd C:/Users/abc/Downloads/Cryptopia-Telegram-Bot-ECABTC-master`. After changed directory, you can now type `npm install` or `node app.js`.

Q: > Why do i get an Error after execute `node app.js` ?

A: if this look like your error message: 
`(node:1477) UnhandledPromiseRejectionWarning: privateRequest(), Error on privateRequest: StatusCodeError: 401 - ""`. That means your **apiKey** or **apiSecret** is incorrect. Remember to **Save Changes** in Cryptopia.

Q: > Thats not my Error Message !

A: Contact me on [Telegram](https://t.me/itD0g) **OR** Create a **New Issue** in this Repo.

## Commands 

0. `/help` : List All Commands
1. `/Balance [Currency]` : Get Specific Currency's Balance in Cryptopia.
2. `/submitOrder [Buy/Sell] [Price in BTC] [ECA Amount]` : Place Buy/Sell ECA Order.
3. `/cancelOrder [OrderID]` : Cancel Buy/Sell ECA Order.
4. `/listOrders` : List all ECA Open Orders.
5. `/Deposit [Currency]` : Get Deposit Address of Specific Currency in Cryptopia.
6. `/getMarket [Currency_BaseCurrency]` : Get Market of the Specific Market, For example: `/getMarket ECA_BTC`, get ECA_BTC Market.
7. `/getMarketOrders [Currency_BaseCurrency]` Get Market Orders of the Specific Market, For example: `/getMarketOrders ECA_BTC`, get ECA_BTC Market Orders.
8. `/enableFilledAlert` : Turn on Order Filled Alert
9. `/disableFilledAlert` : Turn off Order Filled Alert
10. `/enableReceiveAlert` : Turn on New Order Received Alert
11. `/disableReceiveAlert` : Turn off New Order Received Alert

## How to Update the bot ?

1. Follow **Installation** Step 1 - 2
2. Follow **Installation** Step 4 - 5
3. Copy your setting in the **old** `config.json` to **new** `config.json` (**Only apiKey, apiSecret, botToken and ownerID(if the ownerID is a number instead of null)**)
4. Follow **Installation** Step 6 (**Do step 7 too, if the ownerID is null**)
5. Done.

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