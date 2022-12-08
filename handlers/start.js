const moment = require("moment");

module.exports = (bot) => {
    bot.start((ctx) => {
        const from = ctx.update.message.from;
        const name = [from.first_name, from.last_name || ""].join(" ");
        const hours = moment().hours();
        let text;

        if (hours >= 4 && hours <= 10) {
            text = "Selamat Pagi";
        } else if (hours >= 10 && hours < 15) {
            text = "Selamat Siang";
        } else if (hours >= 15 && hours < 18) {
            text = "Selamat Sore";
        } else {
            text = "Selamat Malam";
        }

        const message = [
            `Hai kak *${name}* 👋. ${text} 😁.\n`,
            `Kenalin saya [${ctx.botInfo.first_name}](tg://user?id=${ctx.botInfo.id}) adalah Bot Telegram sederhana yang dapat memudahkan kebutuhan sosial media anda, Bot ini dapat mengunduh vidio dari YouTube, Facebook, Instagram. dan masih ada fitur lainnya juga.\n`,
            `Ketik /help untuk melihat menu atau perintah yang tersedia di Bot ini.`
        ].join("\n");

        ctx.replyMessageWithMarkdown(message);
    })
}