const { Markup, Scenes, Input } = require("telegraf");
const { createAxiosInstance } = require("../lib");

const SCENE_NAME = "PHOTO_TO_CARTOON";
const cartoonVersionName = [
    "version 1 (🔺 stylization, 🔻 robustness)",
    "version 2 (🔺 robustness,🔻 stylization)"
];

module.exports = (bot) => {
    const wizardScene = new Scenes.WizardScene(
        SCENE_NAME,
        async (ctx) => {
            const keyboard = Markup.keyboard(cartoonVersionName).resize().oneTime();
            await ctx.replyMessage("❓ Pilih versi cartoon?", keyboard);
        },
        async (ctx) => {
            ctx.wizard.state.version = ctx.update.message.text.trim();
            ctx.wizard.next();
        },
        async (ctx) => {
            try {
                if (!ctx.wizard.state.version) {
                    return ctx.scene.leave();
                }

                let photo = ctx.update.message.photo;

                if (!Array.isArray(photo)) {
                    return ctx.replyMessage("❌ Yang anda kirimkan bukan berupa foto");
                }

                ctx.replyMessage("🔥 Foto sedang diproses...");
        
                photo = await ctx.telegram.getFileLink(photo.pop().file_id);
        
                const client = createAxiosInstance({baseURL: "https://akhaliq-animeganv2.hf.space/", userAgent: {random: true}});
                
                let response = await client(photo.href, {responseType: "arraybuffer"});

                await client.get("/");
        
                const sessionHash = Math.random().toString(36).substring(2);
                const encodedImage = Buffer.from(response.data, "binary").toString("base64");
        
                response = await client({
                    method: "post",
                    url: "/api/queue/push/",
                    data: JSON.stringify({
                        fn_index: 0,
                        action: "predict",
                        session_hash: sessionHash,
                        data: [`data:image/png;base64,${encodedImage}`, ctx.wizard.state.version]
                    }),
                    headers: {
                        "content-type": "application/json"
                    }
                });
        
                response = await client({
                    method: "post",
                    url: "/api/queue/status/",
                    data: response.data,
                    headers: {
                        "content-type": "application/json"
                    },
                });

                if (!response.data?.data) {
                    if (typeof response.data == "object") await ctx.replyMessage(JSON.stringify(response.data));
                    return ctx.replyMessage("❌ Gagal mengubah foto ke versi cartoon. coba lagi");
                }
        
                const encodedPhoto = response.data.data.data[0].replace(/^data:image\/png;base64,/, "");
                const resultPhoto = Buffer.from(encodedPhoto, "base64");
                
                ctx.replyMessageWithPhoto(Input.fromBuffer(resultPhoto));
            } catch (e) {
                ctx.replyMessage(e.toString());
            } finally {
                ctx.scene.leave();
            }
        }
    );

    wizardScene.use(async (ctx, next) => {
        const name = ctx.update.message?.text?.toLowerCase();
        if (cartoonVersionName.includes(name)) {
            await ctx.replyMessage("🖼️ Sekarang kirim foto yang ingin diubah ke versi cartoon?", {reply_markup: {remove_keyboard: true}});
            ctx.wizard.next();
        }
        return next();
    })

    bot.use((new Scenes.Stage([wizardScene])).middleware());
    bot.command("cartoon", ctx => ctx.scene.enter(SCENE_NAME));
}