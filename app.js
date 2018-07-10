process.env["NTBA_FIX_319"] = 1;
const tg = require("node-telegram-bot-api")
const Cryptopia = require("cryptopia-api")();
const jsonFile = require("jsonfile");
const openOrdersPath = ("./ownOpenOrders.json");
const configPath = ("./config.json");

const msgOpts = { parse_mode: "HTML" };
let config = {};
let openOrders = {};

//Initialize
config = jsonFile.readFileSync(configPath);
openOrders = jsonFile.readFileSync(openOrdersPath);
const telegram = new tg(config.botToken, { polling: true });
Cryptopia.setOptions({
    API_KEY: config.apiKey,
    API_SECRET: config.apiSecret
});
updateOpenOrders();
updateTradeHistory();
//====

//Telegram Commands Handle
telegram.onText(/^\/start$/, msg => {
    if (config.ownerID.length <= 0) {
        config.ownerID = msg.from.id
        jsonFile.writeFileSync(configPath, config, { spaces: 2 });
        telegram.sendMessage(msg.chat.id, `You are now the owner of the Bot.\nOnly you are allowed to use all the commands.`, { reply_to_message_id: msg.message_id });
    } else {
        telegram.sendMessage(msg.chat.id, `This is a private bot and already have owner.`, { reply_to_message_id: msg.message_id });
    }
});

telegram.onText(/^\/listOrders$/, msg => {
    if (msg.from.id === config.ownerID) {
        let txt = "===<b>Open Orders</b>===\n";
        for (var i in openOrders) txt += `OrderID: <code>${i}</code>\n${orderToText(openOrders[i])}\n\n`;
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
            if (Data.FilledOrders.length != 0) {
                let txt = Data.OrderId == null ? "Completely" : "Partly";
                telegram.sendMessage(config.ownerID, `<b>Order ${txt} Filled !</b>`, {...msgOpts, reply_to_message_id: msg.message_id });
            }
        } catch (e) {
            telegram.sendMessage(config.ownerID, e, {...msgOpts, reply_to_message_id: msg.message_id });
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
            telegram.sendMessage(config.ownerID, e, {...msgOpts, reply_to_message_id: msg.message_id });
        }
    }
})

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
            telegram.sendMessage(config.ownerID, e, {...msgOpts, reply_to_message_id: msg.message_id });
        }
    }
})

telegram.onText(/^\/help$/, msg => msg.from.id === config.ownerID && telegram.sendMessage(config.ownerID, `${config.commands.join(", ")}`));

telegram.on("polling_error", error => console.error(error));
//===


//Main Component
async function updateOpenOrders() {
    try {
        const { Success, Data } = await Cryptopia.getOpenOrders({ Market: config.Market });
        if (!Success) throw new Error("Cryptopia Response Not Success.");

        for (var i in Data) {
            let { OrderId, Market, Type, Rate, Amount, Total, Remaining, TimeStamp } = Data[i];
            if (Object.keys(openOrders).includes(OrderId.toString())) continue;
            openOrders[OrderId] = { Market, Type, Rate, Amount, Total, Remaining, TimeStamp };
            telegram.sendMessage(config.ownerID, `[<b>New Order Received</b>]\nOrderID: <code>${OrderId}</code>\n${orderToText(openOrders[OrderId])}`, msgOpts);
        }

        jsonFile.writeFileSync(openOrdersPath, openOrders, { spaces: 2 });
        setTimeout(updateOpenOrders, config.updateOrdersTimeInMin * 60 * 1000);
    } catch (e) {
        throw e;
    }
}

async function updateTradeHistory() {
    try {
        const { Success, Data } = await Cryptopia.getTradeHistory({ Market: config.Market });
        if (!Success) throw new Error("Cryptopia Response Not Success.");
        let updated = false;
        for (var i in Data) {
            let { TradeId, Type, Rate, Amount, Total } = Data[i];
            if (Object.keys(openOrders).includes(TradeId.toString())) {
                updated = true;
                let fullyFilled = Amount == openOrders[TradeId].Amount
                let txt = fullyFilled ? "Completely" : "Partly";

                if (!fullyFilled) openOrders[TradeId].Remaining -= Amount;
                else delete openOrders[TradeId];

                telegram.sendMessage(config.ownerID, `[<b>${txt} Filled</b>]\nYour <b>${(Rate).toFixed(8)}</b> Order ${txt} Filled.\n${Type === "Buy" ? "Bought" : "Sold"}: <b>${Amount} ${config.Currency}</b> with <b>${Total} BTC</b>.${!fullyFilled ? `\n<b>${openOrders[TradeId].Remaining} ${config.Currency}</b> to be Filled.` : ""}`, msgOpts);
            }
        }
        if(updated) jsonFile.writeFileSync(openOrdersPath, openOrders, {spaces: 2})
        setTimeout(updateTradeHistory, config.updateTradeHistroyTimeInMin * 60 * 1000);
    } catch (e) {
        throw e;
    }
}
//===


//Utilities
function orderToText(order) {
    return `Type: <b>${order.Type}</b>\nPrice: <b>${(order.Rate).toFixed(8)} BTC</b>\nAmount: <b>${order.Amount} ${config.Currency}</b>.\nTotal: <b>${order.Total} BTC</b>\nRemaining: <b>${order.Remaining} ${config.Currency}</b>\nCreate At: <b>${toLocaleTimeStr(order.TimeStamp)}</b>`
}

function toLocaleTimeStr(timeFromCryptopia) {
    //return new Date(timeFromCryptopia).toLocaleString({ timeZone: config.TimeZone, hour12: true });
    return new Date((new Date(timeFromCryptopia)).getTime() + (1000 * 60 * new Date().getTimezoneOffset())).toLocaleString({ timeZone: config.TimeZone, hour12: true });
}
//===