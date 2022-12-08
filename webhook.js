const { Telegraf } = require("telegraf");
const config = require("./config");

require("dotenv").config();

(async () => {
    const bot = new Telegraf(process.env.TOKEN);

    switch (process.argv.slice(2, 3)[0]) {
        case "set":
            await bot.telegram.setWebhook(process.env.WEBHOOK_URL);
            console.log("Webhook was set to: " + process.env.WEBHOOK_URL)
            break;
        case "delete":
            await bot.telegram.deleteWebhook();
            console.log("Webhook was deleted.");
            break;
    }
})()