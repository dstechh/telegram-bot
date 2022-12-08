const { Markup, Scenes } = require('telegraf');
const { isValidUrl } = require("../utils");
const { createAxiosInstance } = require("../lib");
const FormData = require("form-data");
const cheerio = require("cheerio");
const collect = require("collect.js");

const SCENE_NAME = "TW_VIDEO";

module.exports = (bot) => {
    const cancelButton = Markup.inlineKeyboard([Markup.button.callback("❌ Batalkan Aksi", "cancel")]);
    const wizardScene = new Scenes.WizardScene(
        SCENE_NAME,
        async (ctx) => {
            await ctx.replyMessage("🔗 Kirim link vidio Tweet?");
            return ctx.wizard.next();
        },
        async (ctx) => {
            let url = ctx.update.message.text.trim();
            if (!isValidUrl(url)) {
                return ctx.replyMessage("🚫 Link salah atau tidak valid", cancelButton);
            }

            if (!url.match(/^(https|http):\/\/twitter\.com\/([a-zA-Z0-9\._-]+)\/status\/([0-9]+)/i)) {
                return ctx.replyMessage("🚫 Link postingan Tweet salah atau tidak valid", cancelButton);
            }

            try {
                const client = createAxiosInstance({userAgent: {random: true}});

                let response = await client.get("https://twittervideodownloader.com/");

                let $ = cheerio.load(response.data);

                const csrf = $("input[name=\"csrfmiddlewaretoken\"]").attr("value");

                const data = new FormData();
                data.append("csrfmiddlewaretoken", csrf);
                data.append("tweet", url);

                response = await client({
                    method: "post",
                    url: "https://twittervideodownloader.com/download",
                    data: data,
                    headers: {
                        referer: response.request.res.responseUrl
                    }
                });

                if (response.data.includes("Its seems that the tweet link you entered does not contain video")) {
                    return ctx.replyMessage("🚫 Link tweet yang anda berikan tidak mengandung vidio", cancelButton)
                }

                $ = cheerio.load(response.data);

                const thumb = $("img[src^=https://pbs.twimg.com]").attr("src");
                const result = [];

                for (let el of $("div.row")) {
                    el = $(el),
                    videoEl = el.find(".small-6.columns");
                    if (videoEl.length !== 2) {
                        continue;
                    }
                    let url = videoEl.find("a").attr("href");
                    let [quality, type] = $(videoEl[1]).text().split(":");

                    url = `https://twsaver.com/d.php?src=${url}`;

                    if (type.trim() == "mp4") {
                        result.push({icon: "🎥", type: "mp4", quality: quality.trim(), url: url});
                    } else {
                        result.push({icon: "🎥", type: "mp3", quality: quality.trim(), url: url});
                    }
                }

                if (result.length === 0) {
                    return ctx.replyMessage("🚫 Vidio tidak ditemukan. pastikan link tweet benar dan bersifat publik.", cancelButton)
                }

                const keyboard = collect(result).sortByDesc(item => item.quality).map((item) => [
                    Markup.button.url(`${item.icon} ${item.quality} - ${item.type.toUpperCase()}`, item.url)
                ]).toArray();

                ctx.replyMessageWithPhoto(thumb, Markup.inlineKeyboard(keyboard));
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
    bot.command("twvideo", ctx => ctx.scene.enter(SCENE_NAME));
}