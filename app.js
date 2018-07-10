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

telegram.onText(/^\/listOpenOrders$/, msg => {
    if (msg.from.id === config.ownerID) {
        let txt = "===<b>Open Orders</b>===\n";
        for (var i in openOrders) txt += `OrderID: <b>${i}</b>\n${orderToText(openOrders[i])}\n\n`;
        telegram.sendMessage(config.ownerID, txt, msgOpts);
    }
});

telegram.onText(/^\/submitTrade$/, msg => msg.from.id === config.ownerID && telegram.sendMessage(config.ownerID, `Usage: <code>/submitTrade [buy/sell] [price] [amount]</code>`, msgOpts));
telegram.onText(/\/submitTrade (.+)/, async(msg, match) => {
    if (msg.from.id === config.ownerID) {
        let args = match[1].trim().split(" ");
        if (args.length < 3) {
            telegram.sendMessage(config.ownerID, `Not enough Arguments.\nType /submitTrade to see the Usage.`, msgOpts);
            return;
        } else if (!isNaN(args[0]) || isNaN(args[1]) || isNaN(args[2]) || (args[0].toLowerCase() !== "buy" && args[0].toLowerCase() !== "sell")) {
            telegram.sendMessage(config.ownerID, `Incorrect Arguments.\nType /submitTrade to see the Usage.`, msgOpts);
            return;
        }
        let tradeType = args[0].toLowerCase() === "buy" ? "Buy" : "Sell";
        console.log(`${args[0]} ${args[1]} ${args[2]}`);
        try {
            let res = await Cryptopia.submitTrade({ Market: config.Market, Type: tradeType, Rate: parseFloat(args[1]), Amount: parseFloat(args[2]) });
            console.log(res);
        } catch (e) {
            telegram.sendMessage(config.ownerID, e, {...msgOpts, reply_to_message_id: msg.message_id });
        }
    }
});

telegram.onText(/^\/cancelTrade$/, msg => msg.from.id === config.ownerID && telegram.sendMessage(config.ownerID, `Usage: <code>/cancelTrade [orderid]</code>`, msgOpts));
telegram.onText(/\/cancelTrade (.+)/, async(msg, match) => {
    if (msg.from.id === config.ownerID) {
        let args = match[1].trim().split(" ");
        if (args.length < 1) {
            telegram.sendMessage(config.ownerID, `Not enough Arguments.\nType /cancelTrade to see the Usage.`, msgOpts);
            return;
        } else if (isNaN(args[0])) {
            telegram.sendMessage(config.ownerID, `Incorrect Arguments.\nType /cancelTrade to see the Usage.`, msgOpts);
            return;
        }
        console.log(`${args[0]}`);
        try {
            let res = await Cryptopia.cancelTrade({ Type: "Trade", OrderId: parseInt(args[0]) })
            console.log(res);
        } catch (e) {
            telegram.sendMessage(config.ownerID, e, {...msgOpts, reply_to_message_id: msg.message_id });
        }
    }
})

telegram.onText(/^\/Balance$/, async msg => {
    if (msg.from.id === config.ownerID) {
        try {
            let { Success, Data } = await Cryptopia.getBalance({ Currency: config.Currency });
            if (!Success) throw new Error("Cryptopia Response Not Success.");
            telegram.sendMessage(config.ownerID, `Total: <b>${Data[0].Total} ${config.Currency}</b>\nAvailable: <b>${Data[0].Available} ${config.Currency}</b>\nUnconfirmed: <b>${Data[0].Unconfirmed} ${config.Currency}</b>\nHeld For Trades: <b>${Data[0].HeldForTrades} ${config.Currency}</b>\nPending Withdraw: <b>${Data[0].PendingWithdraw} ${config.Currency}</b>\n`, msgOpts);
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

        let dataIDs = []

        for (var i in Data) {
            let { OrderId, Market, Type, Rate, Amount, Total, Remaining, TimeStamp } = Data[i];
            dataIDs.push(OrderId.toString());
            if (Object.keys(openOrders).includes(OrderId.toString())) continue;
            openOrders[OrderId] = { Market, Type, Rate, Amount, Total, Remaining, TimeStamp };
            telegram.sendMessage(config.ownerID, `[<b>New Order Received</b>]\nOrderID: <b>${OrderId}</b>\n${orderToText(openOrders[OrderId])}`, msgOpts);
        }

        for (var i in openOrders) {
            if (!dataIDs.includes(i)) delete openOrders[i];
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
    return `Type: <b>${order.Type}</b>\nRate: <b>${(order.Rate).toFixed(8)}</b>\nAmount: <b>${order.Amount} ${config.Currency}</b>.\nTotal: <b>${order.Total} BTC</b>\nRemaining: <b>${order.Remaining} ${config.Currency}</b>\nCreate At: <b>${toLocaleTimeStr(order.TimeStamp)}</b>`
}

function toLocaleTimeStr(timeFromCryptopia) {
    return new Date((new Date(timeFromCryptopia)).getTime() + (1000 * 60 * new Date().getTimezoneOffset())).toLocaleString({ timeZone: config.TimeZone, hour12: true });
}
//===