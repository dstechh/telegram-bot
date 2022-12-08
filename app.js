const { Telegraf, session } = require("telegraf");
const path = require("path");
const fs = require("fs");
const http = require("http");
const moment = require("moment");
const config = require("./config");


(async (bot, handlers) => {
    require("moment-duration-format")(moment);

    bot.use(session());
    bot.use((ctx, next) => {
        const messageId = (ctx.update?.message?.message_id || ctx.update?.callback_query?.message.message_id);
        const customReply = {
            replyMessage: "reply",
            replyMessageWithMarkdown: "replyWithMarkdown",
            replyMessageWithPhoto: "replyWithPhoto"
        }

        Object.keys(customReply).forEach(key => {
            ctx[key] = (message, options = {}) => ctx[customReply[key]](message, {...options, reply_to_message_id: messageId});
        });

        return next();
    });

    bot.use((ctx, next) => {
        const chatType = (ctx.update?.message?.chat.type || ctx.update?.callback_query?.message.chat.type);
        
        if (["supergroup"].includes(chatType) && !config.allowMessageFromGroup) {
            return ctx.replyMessage("🚫 Bot tidak dapat digunakan dalam grup chat. mohon hubungi admin jika ada pertanyaan!");
        }

        return next();
    })

    for await (let file of handlers) {
        require(path.resolve(`handlers/${file}`))(bot);
    }

    if (config.isDevelopment) {
        return bot.launch();
    }

    http.createServer(async(req, res) => bot.webhookCallback(req.url)(req, res, () => {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        var message = 'It works!\n',
            version = 'NodeJS ' + process.versions.node + '\n',
            response = [message, version].join('\n');

        res.end(response);
    })).listen()
})(
    new Telegraf(config.token), fs.readdirSync(path.resolve("handlers"))
);