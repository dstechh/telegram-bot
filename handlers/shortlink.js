const { Markup, Scenes } = require('telegraf');
const { isValidUrl } = require("../utils");
const { shortlink } = require("../lib");

const SCENE_NAME = "SHORT_LINK";

module.exports = (bot) => {
    const cancelButton = Markup.inlineKeyboard([Markup.button.callback("❌ Batalkan Aksi", "cancel")]);
    const wizardScene = new Scenes.WizardScene(
        SCENE_NAME,
        async (ctx) => {
            await ctx.replyMessage("🔗 Kirim link yang ingin dipendekan?");
            return ctx.wizard.next();
        },
        async (ctx) => {
            let url = ctx.update.message.text.trim();
            if (!isValidUrl(url)) {
                return ctx.replyMessage("🚫 Link salah atau tidak valid", cancelButton);
            }

            const result = await shortlink(url);

            ctx.replyMessage(result ? `✅ Shortlink: ${result}` : "❌ Tidak dapat memendekan link. coba lagi")
        }
    );

    wizardScene.action("cancel", async(ctx) => {
        await ctx.reply("Aksi dibatalkan. Ketik /help untuk melihat daftar perintah.");
        await ctx.deleteMessage();
        return ctx.scene.leave();
    });

    bot.use((new Scenes.Stage([wizardScene])).middleware());
    bot.command("shortlink", ctx => ctx.scene.enter(SCENE_NAME));
}