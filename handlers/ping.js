module.exports = (bot) => {
    bot.command("ping", (ctx) => {
        ctx.replyMessage("Pong!");
    })
}