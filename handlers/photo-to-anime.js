const { Markup, Scenes, Input } = require("telegraf");
const { createAxiosInstance } = require("../lib");

const SCENE_NAME = "PHOTO_TO_ANIME";

module.exports = (bot) => {
    const cancelButton = Markup.inlineKeyboard([Markup.button.callback("❌ Batalkan Aksi", "cancel")]);
    const wizardScene = new Scenes.WizardScene(
        SCENE_NAME,
        async (ctx) => {
            ctx.replyMessage("Coming soon :)")
        },
        async (ctx) => {
            try {
                //
            } catch (e) {
                ctx.replyMessage(e.toString());
                ctx.scene.leave();
            }
        }
    );

    wizardScene.action("cancel", async(ctx) => {
        await ctx.reply("Aksi dibatalkan. Ketik /help untuk melihat daftar perintah.");
        await ctx.deleteMessage();
        return ctx.scene.leave();
    });

    bot.use((new Scenes.Stage([wizardScene])).middleware());
    bot.command("anime", ctx => ctx.scene.enter(SCENE_NAME));
}