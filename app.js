process.env["NTBA_FIX_319"] = 1;
const tg = require("node-telegram-bot-api")
const Cryptopia = require("cryptopia-api")();
const jsonFile = require("jsonfile");
const openOrdersPath = ("./ownOpenOrders.json");
const orderHistoryPath = ("./sumbitOrderHistory.json");
const configPath = ("./config.json");

const msgOpts = { parse_mode: "HTML" };
let config = {},
    openOrders = {},
    orderHistory = {};

//Initialize
console.clear();
console.log("Initializing the bot...");
try {
    config = jsonFile.readFileSync(configPath);
    openOrders = jsonFile.readFileSync(openOrdersPath);
    orderHistory = jsonFile.readFileSync(orderHistoryPath);
} catch (e) {
    console.error("config.json / ownOpenOrders.json / submitOrderHistory.json Not Found.\nPlease make sure u removed [template] in those file name.")
    console.warn("Terminating the Bot...");
    process.exit();
}
if (config.botToken == "" || config.apiKey == "" || config.apiSecret == "") {
    console.error("Please setup the botToken & apiKey & apiSecret in config.json first.");
    console.warn("Terminating the Bot...");
    process.exit();
}
const telegram = new tg(config.botToken, { polling: true });
Cryptopia.setOptions({
    API_KEY: config.apiKey,
    API_SECRET: config.apiSecret
});
updateOpenOrders();
console.log("Bot Initialized.");
//====

//Telegram Commands Handle
telegram.onText(/^\/start$/, msg => {
    if (config.ownerID == null) {
        config.ownerID = msg.from.id
        jsonFile.writeFileSync(configPath, config, { spaces: 2 });
        telegram.sendMessage(msg.chat.id, `You are now the owner of the Bot.\nOnly you are allowed to use all the commands.`, { reply_to_message_id: msg.message_id });
    } else if (config.ownerID == msg.from.id) {
        telegram.sendMessage(config.ownerID, `You already is the owner of this Bot :)`);
    } else {
        telegram.sendMessage(msg.chat.id, `This is a private bot and already have owner.`, { reply_to_message_id: msg.message_id });
    }
});

telegram.onText(/^\/listOrders$/, msg => {
            if (msg.from.id === config.ownerID) {
                let txt = "===<b>Open Orders</b>===\n";
                for (var i in openOrders) txt += `OrderID: <code>${i}</code>\n${orderToText(openOrders[i])}\n${orderHistory[i] != null ? `Total when submit Order: <b>${orderHistory[i].toFixed(8)} BTC</b>\n` : ""}\n`;
        telegram.sendMessage(config.ownerID, txt, msgOpts);
    }
});

telegram.onText(/^\/submitOrder$/, msg => msg.from.id === config.ownerID && telegram.sendMessage(config.ownerID, `Usage: <code>/submitOrder [buy/sell] [price] [amount]</code>`, msgOpts));
telegram.onText(/\/submitOrder (.+)/, async(msg, match) => {
    if (msg.from.id === config.ownerID) {
        let args = match[1].trim().split(" ");
        if (args.length < 3) {
            telegram.sendMessage(config.ownerID, `Not enough Arguments.\nType /submitOrder to see the Usage.`, msgOpts);
            return;
        } else if (!isNaN(args[0]) || isNaN(args[1]) || isNaN(args[2]) || (args[0].toLowerCase() !== "buy" && args[0].toLowerCase() !== "sell")) {
            telegram.sendMessage(config.ownerID, `Incorrect Arguments.\nType /submitOrder to see the Usage.`, msgOpts);
            return;
        }
        let tradeType = args[0].toLowerCase() === "buy" ? "Buy" : "Sell";
        try {
            let { Success, Data } = await Cryptopia.submitTrade({ Market: config.Market, Type: tradeType, Rate: parseFloat(args[1]), Amount: parseFloat(args[2]) });
            if (!Success) throw new Error("Cryptopia Response Not Success.");
            telegram.sendMessage(config.ownerID, `[<b>Order Submitted</b>]\nOrderID: <code>${Data.OrderId}</code>\n${tradeType}ing <b>${args[2]} ${config.Currency}</b>\nAt Price: <b>${args[1]} BTC</b>`, msgOpts);
            if (Data.FilledOrders.length != 0 && config.orderFilledAlert) {
                let txt = Data.OrderId == null ? "Completely" : "Partly";
                telegram.sendMessage(config.ownerID, `<b>Order ${txt} Filled !</b>`, {...msgOpts, reply_to_message_id: msg.message_id });
            }

            if(Data.OrderId != null){
                const resp = await Cryptopia.getMarketOrders({ Market: "ECA_BTC" });
                if (!resp.Success) throw new Error("Cryptopia Response Not Success.");
                let {Buy, Sell} = resp.Data;
                let dataToFind = tradeType === "Buy" ? Buy : Sell;
                for(var i in dataToFind){
                    if(dataToFind[i].Price.toFixed(8) == args[1]){
                        orderHistory[Data.OrderId] = dataToFind[i].Total;
                        jsonFile.writeFileSync(orderHistoryPath, orderHistory, {spaces: 2});
                        break;
                    }
                };
            }
        } catch (e) {
            telegram.sendMessage(config.ownerID, `${e}`, {...msgOpts, reply_to_message_id: msg.message_id });
        }
    }
});

telegram.onText(/^\/cancelOrder$/, msg => msg.from.id === config.ownerID && telegram.sendMessage(config.ownerID, `Usage: <code>/cancelOrder [orderid]</code>`, msgOpts));
telegram.onText(/\/cancelOrder (.+)/, async(msg, match) => {
    if (msg.from.id === config.ownerID) {
        let args = match[1].trim().split(" ");
        if (args.length < 1) {
            telegram.sendMessage(config.ownerID, `Not enough Arguments.\nType /cancelOrder to see the Usage.`, msgOpts);
            return;
        } else if (isNaN(args[0])) {
            telegram.sendMessage(config.ownerID, `Incorrect Arguments.\nType /cancelOrder to see the Usage.`, msgOpts);
            return;
        }
        try {
            let { Success, Data } = await Cryptopia.cancelTrade({ Type: "Trade", OrderId: parseInt(args[0]) })
            if (!Success) throw new Error("Cryptopia Response Not Success.");
            telegram.sendMessage(config.ownerID, `[<b>Order Canceled</b>]\nOrderID: <code>${Data[0]}</code>.`, msgOpts)
        } catch (e) {
            telegram.sendMessage(config.ownerID, `${e}`, {...msgOpts, reply_to_message_id: msg.message_id });
        }
    }
})

telegram.onText(/^\/calc$/, msg => msg.from.id === config.ownerID && telegram.sendMessage(config.ownerID, `Usage: <code>/calc [ECAprice] [BTCAmount]</code>`, msgOpts));
telegram.onText(/\/calc (.+)/, (msg, match) => {
    if(msg.from.id === config.ownerID){
        let args = match[1].trim().split(" ");
        if(args.length < 2){
            telegram.sendMessage(config.ownerID, `Not enough Arguments.\nType /calc to see the Usage.`, msgOpts);
            return;
        }else if(isNaN(args[0]) || isNaN(args[1])){
            telegram.sendMessage(config.ownerID, `Incorrect Arguments.\nType /calc to see the Usage.`, msgOpts);
            return;
        }
        telegram.sendMessage(config.ownerID, `You can Buy <code>${(parseFloat(args[1]) / 1.002 / parseFloat(args[0])).toFixed(8)}</code> ECA\nwith <b>${args[1]} BTC</b>\nat Price: <b>${args[0]} ECA</b>`, msgOpts);
    }
});


telegram.onText(/^\/Balance$/, msg => msg.from.id === config.ownerID && telegram.sendMessage(config.ownerID, `Usage: <code>/Balance [currency]</code>`, msgOpts));
telegram.onText(/^\/Balance (.+)/, async(msg, match) => {
    if (msg.from.id === config.ownerID) {
        if (match[1].length < 3) throw new Error("Incorrect Arguments.\nType /Balance to see the Usage.")
        try {
            let currencyToCheck = match[1].toUpperCase();
            let { Success, Data } = await Cryptopia.getBalance({ Currency: currencyToCheck });
            if (!Success) throw new Error("Cryptopia Response Not Success.");
            telegram.sendMessage(config.ownerID, `Total: <b>${Data[0].Total} ${currencyToCheck}</b>\nAvailable: <b>${Data[0].Available} ${currencyToCheck}</b>\nUnconfirmed: <b>${Data[0].Unconfirmed} ${currencyToCheck}</b>\nHeld For Trades: <b>${Data[0].HeldForTrades} ${currencyToCheck}</b>\nPending Withdraw: <b>${Data[0].PendingWithdraw} ${currencyToCheck}</b>\n`, msgOpts);
        } catch (e) {
            telegram.sendMessage(config.ownerID, `${e}`, {...msgOpts, reply_to_message_id: msg.message_id });
        }
    }
})

telegram.onText(/^\/Deposit$/, msg => msg.from.id === config.ownerID && telegram.sendMessage(config.ownerID, `Usage: <code>/Deposit [currency]</code>`, msgOpts));
telegram.onText(/^\/Deposit (.+)/, async(msg, match) => {
    if (msg.from.id === config.ownerID) {
        if (match[1].length < 3) throw new Error("Incorrect Arguments.\nType /Deposit to see the Usage.")
        try {
            let currencyToCheck = match[1].toUpperCase();
            let { Success, Data } = await Cryptopia.getDepositAddress({ Currency: currencyToCheck });
            if (!Success) throw new Error("Cryptopia Response Not Success.");
            telegram.sendMessage(config.ownerID, `Deposit Address of <b>${currencyToCheck}</b>:\n\n<code>${Data.Address}</code>`, msgOpts);
        } catch (e) {
            telegram.sendMessage(config.ownerID, `${e}`, {...msgOpts, reply_to_message_id: msg.message_id });
        }
    }
})
telegram.onText(/^\/getMarket$/, msg => msg.from.id === config.ownerID && telegram.sendMessage(config.ownerID, `Usage: <code>/getMarket [Currency_BaseCurrency]</code>`, msgOpts));
telegram.onText(/^\/getMarket (.+)/, async(msg, match) => {
    if (msg.from.id === config.ownerID) {
        if (match[1].length < 3) throw new Error("Incorrect Arguments.\nType /getMarket to see the Usage.")
        try {
            const { Success, Data } = await Cryptopia.getMarket({ Market: match[1].toUpperCase() });
            if (!Success) throw new Error("Cryptopia Response Not Success.");
            if (Data == null) throw new Error("Incorrect Market.\nType /getMarket to see the Usage.")
            let txt = "";
            Object.keys(Data).forEach(key =>{
                if(key != "TradePairId") txt += `${key}: <b>${typeof Data[key] === "number" ? (Data[key]).toFixed(8) : Data[key]}</b>\n`;
            });
            telegram.sendMessage(config.ownerID, txt, {...msgOpts, reply_to_message_id: msg.message_id })
        } catch (e) {
            telegram.sendMessage(config.ownerID, `${e}`, {...msgOpts, reply_to_message_id: msg.message_id });
        }
    }
})

telegram.onText(/^\/getMarketOrders$/, msg => msg.from.id === config.ownerID && telegram.sendMessage(config.ownerID, `Usage: <code>/getMarketOrders [Currency_BaseCurrency]</code>`, msgOpts));
telegram.onText(/^\/getMarketOrders (.+)/, async(msg, match) => {
    if (msg.from.id === config.ownerID) {
        if (match[1].length < 3) throw new Error("Incorrect Arguments.\nType /getMarketOrders to see the Usage.")
        try {
            telegram.sendMessage(config.ownerID, "Getting Data From Cryptopia Now...");
            const { Success, Data } = await Cryptopia.getMarketOrders({ Market: match[1].toUpperCase() });
            if (!Success) throw new Error("Cryptopia Response Not Success.");
            if (Data == null) throw new Error("Incorrect Market.\nType /getMarketOrders to see the Usage.")
            let {Buy, Sell} = Data;
            let baseCurrency = match[1].toUpperCase().split("_")[1];
            let askCurrency = match[1].toUpperCase().split("_")[0];
            let txt = `<b>Buy Orders :\nPrice(${baseCurrency})\t|\tVolume(${askCurrency})\t|\tTotal(${baseCurrency})\n</b>`;
            
            for(var index in Buy){
                if(index >= config.MarketOrdersNum)break;
                txt += `${Buy[index].Price.toFixed(8)}\t|\t${parseInt(Buy[index].Volume).toString().length >= 8 ? parseInt(Buy[index].Volume) : Buy[index].Volume.toFixed(8 - parseInt(Buy[index].Volume).toString().length)}\t|\t${Buy[index].Total.toFixed(8)}\n`
            };
            txt += `<b>Sell Orders :\nPrice(${baseCurrency})\t|\tVolume(${askCurrency})\t|\tTotal(${baseCurrency})\n</b>`;
            for(var index in Sell){
                if(index >= config.MarketOrdersNum) break;
                txt += `${Sell[index].Price.toFixed(8)}\t|\t${parseInt(Sell[index].Volume).toString().length >= 8 ? parseInt(Sell[index].Volume) : Sell[index].Volume.toFixed(8 - parseInt(Sell[index].Volume).toString().length)}\t|\t${Sell[index].Total.toFixed(8)}\n`
            };
            telegram.sendMessage(config.ownerID, txt, {...msgOpts, reply_to_message_id: msg.message_id});
        } catch (e) {
            telegram.sendMessage(config.ownerID, `${e}`, {...msgOpts, reply_to_message_id: msg.message_id });
        }
    }
})

telegram.onText(/^\/help$/, msg => msg.from.id === config.ownerID && telegram.sendMessage(config.ownerID, `${config.commands.join(", ")}`));

telegram.onText(/^\/enableFilledAlert$/, msg => {
    if (msg.from.id === config.ownerID) {
        if (!config.orderFilledAlert) {
            config.orderFilledAlert = true;
            jsonFile.writeFileSync(configPath, config, { spaces: 2 });
            telegram.sendMessage(config.ownerID, `Order Filled Alert is now Enable.`, msgOpts);
        } else {
            telegram.sendMessage(config.ownerID, `Order Filled Alert Already Enabled.`, msgOpts);
        }
    }
})
telegram.onText(/^\/disableFilledAlert$/, msg => {
    if (msg.from.id === config.ownerID) {
        if (config.orderFilledAlert) {
            config.orderFilledAlert = false;
            jsonFile.writeFileSync(configPath, config, { spaces: 2 });
            telegram.sendMessage(config.ownerID, `Order Filled Alert is now Disable.`, msgOpts);
        } else {
            telegram.sendMessage(config.ownerID, `Order Filled Alert Already Disabled.`, msgOpts);
        }
    }
})
telegram.onText(/^\/enableReceiveAlert$/, msg => {
    if (msg.from.id === config.ownerID) {
        if (!config.orderReceivedAlert) {
            config.orderReceivedAlert = true;
            jsonFile.writeFileSync(configPath, config, { spaces: 2 });
            telegram.sendMessage(config.ownerID, `Order Received Alert is now Enable.`, msgOpts);
        } else {
            telegram.sendMessage(config.ownerID, `Order Received Alert Already Enabled.`, msgOpts);
        }
    }
})
telegram.onText(/^\/disableReceiveAlert$/, msg => {
    if (msg.from.id === config.ownerID) {
        if (config.orderReceivedAlert) {
            config.orderReceivedAlert = false;
            jsonFile.writeFileSync(configPath, config, { spaces: 2 });
            telegram.sendMessage(config.ownerID, `Order Received Alert is now Disable.`, msgOpts);
        } else {
            telegram.sendMessage(config.ownerID, `Order Received Alert Already Disabled.`, msgOpts);
        }
    }
})

telegram.on("polling_error", error => console.error(error));
//===


//Main Component
async function updateOpenOrders() {
    let IDs = [];
    let init = Object.keys(openOrders).length == 0
    try {
        const { Success, Data } = await Cryptopia.getOpenOrders({ Market: config.Market });
        if (!Success) throw new Error("Cryptopia Response Not Success.");
        for (var i in Data) {
            let { OrderId, Market, Type, Rate, Amount, Total, Remaining, TimeStamp } = Data[i];
            IDs.push(OrderId.toString());
            if (Object.keys(openOrders).includes(OrderId.toString())) {
                if (openOrders[OrderId].Remaining != Remaining) {
                    if (config.orderFilledAlert) telegram.sendMessage(config.ownerID, `[<b>Partly Filled</b>]\nYour <b>${(Rate).toFixed(8)}</b> Order Partly Filled.\n${Type === "Buy" ? "Bought" : "Sold"}: <b>${openOrders[OrderId].Amount - Remaining} ${config.Currency}</b>.\n<b>${Remaining} ${config.Currency}</b> to be Filled.`, msgOpts);
                    openOrders[OrderId].Remaining = Remaining;
                    openOrders[OrderId].Total = Total;
                    openOrders[OrderId].Amount = Amount;
                }
                continue;
            }
            openOrders[OrderId] = { Market, Type, Rate, Amount, Total, Remaining, TimeStamp };
            if (!init && config.orderReceivedAlert) telegram.sendMessage(config.ownerID, `[<b>New Order Received</b>]\nOrderID: <code>${OrderId}</code>\n${orderToText(openOrders[OrderId])}`, msgOpts);
        }
    } catch (e) {
        console.error("Error in update OpenOrders", e);
    }

    try {
        let notIncluded = [];

        if (!init) Object.keys(openOrders).forEach(key => !IDs.includes(key) && notIncluded.push(key));

        if (notIncluded.length > 0) {
            let { Success, Data } = await Cryptopia.getTradeHistory({ Market: config.Market });
            if (!Success) throw new Error("Cryptopia Response Not Success.");
            //let needToDelete = [];
            for (var j in Data) {
                let { Type, Rate, Amount, Total } = Data[j];
                notIncluded.forEach(val => {
                    if (openOrders[val].Type == Type && openOrders[val].Rate == Rate && openOrders[val].Amount == Amount && openOrders[val].Total == Total) {
                        if (config.orderFilledAlert) telegram.sendMessage(config.ownerID, `[<b>Completely Filled</b>]\nYour <b>${(Rate).toFixed(8)}</b> Order Completely Filled.\n${Type === "Buy" ? "Bought" : "Sold"}: <b>${Amount} ${config.Currency}</b> with <b>${Total} BTC</b>.`, msgOpts);
                        //needToDelete.push(val);
                    }
                });
            }
            notIncluded.forEach(val => {
                delete openOrders[val];
                if(orderHistory[val] != null) delete orderHistory[val];
            });
        }

        jsonFile.writeFileSync(openOrdersPath, openOrders, { spaces: 2 });
        if(notIncluded.length > 0) jsonFile.writeFileSync(orderHistoryPath, orderHistory, {spaces: 2});
        setTimeout(updateOpenOrders, config.updateOrdersTimeInMin * 60 * 1000);
    } catch (e) {
        console.error("Error in Get Trade History.", e);
    }
}
//===


//Utilities
function orderToText(order) {
    return `Type: <b>${order.Type}</b>\nPrice: <b>${(order.Rate).toFixed(8)} BTC</b>\nAmount: <b>${order.Amount} ${config.Currency}</b>.\nTotal: <b>${order.Total} BTC</b>\nRemaining: <b>${order.Remaining} ${config.Currency}</b>\nCreate At: <b>${toLocaleTimeStr(order.TimeStamp)}</b>`
}

function toLocaleTimeStr(timeFromCryptopia) {
    //return new Date(timeFromCryptopia).toLocaleString({ timeZone: config.TimeZone, hour12: true });
    return new Date((new Date(timeFromCryptopia)).getTime() - (1000 * 60 * new Date().getTimezoneOffset())).toLocaleString({ hour12: true });
}
//===