const { Telegraf } = require("telegraf");
const config = require("./config");

(async () => {
    const bot = new Telegraf(config.token);

    switch (process.argv.slice(2, 3)[0]) {
        case "set":
            await bot.telegram.setWebhook(config.webhookUrl);
            console.log("Webhook was set to: " + config.webhookUrl)
            break;
        case "delete":
            await bot.telegram.deleteWebhook();
            console.log("Webhook was deleted.");
            break;
    }
})()