const { Markup, Scenes } = require('telegraf');
const { isValidUrl } = require("../utils");
const { createAxiosInstance } = require("../lib");
const FormData = require("form-data");
const ytdl = require("ytdl-core");
const cheerio = require("cheerio");

const SCENE_NAME = "YT_VIDEO";

module.exports = (bot) => {
    const cancelButton = Markup.inlineKeyboard([Markup.button.callback("❌ Batalkan Aksi", "cancel")]);
    const wizardScene = new Scenes.WizardScene(
        SCENE_NAME,
        async (ctx) => {
            await ctx.replyMessage("🔗 Kirim link vidio YouTube?");
            return ctx.wizard.next();
        },
        async (ctx) => {
            const url = ctx.update.message.text.trim();
            if (!isValidUrl(url)) {
                return ctx.replyMessage("🚫 Link salah atau tidak valid", cancelButton);
            }

            try {
                ytdl.getURLVideoID(url);
            } catch (e) {
                return ctx.replyMessage("🚫 Link salah. Bukan link YouTube", cancelButton);
            }

            try {
                const data = new FormData();

                data.append("url", url);
                data.append("a_auto", "0");
                data.append("ajax", "1");
    
                const response = await createAxiosInstance()({
                    url: "https://www.y2mate.com/mates/en435/analyze/ajax",
                    method: "post",
                    data: data
                });

                const html = response.data.result

                const $ = cheerio.load(html);
                const kId = html.match(/var k__id = "(.*?)"/i)[1];
                const kVId = html.match(/var k_data_vid = "(.*?)"/i)[1];
                const thumb = $(".video-thumbnail").find("img").attr("src");
                const title = $(".caption").text().trim();
                const result = [];

                ["#mp4", "#mp3"].forEach(id => {
                    $(`${id} tbody > tr`).each((i, el) => {
                        el = $(el).find("td"),
                        elBtnDownload = $(el[2]).find("a"),
                        quality = elBtnDownload.data("fquality").toString().trim(),
                        type = elBtnDownload.data("ftype").toString().trim();

                        result.push({
                            quality: quality,
                            type: type,
                            size: $(el[1]).text().trim(),
                            icon: (type == "mp3" ? "🎶" : "🎥"),
                            formatedQuality: quality + (type == "mp3" ? "kbps" : (quality.match(/[0-9]$/) ? 'p' : '')),
                            formatedType: type.toUpperCase()
                        })
                    })
                });

                ctx.wizard.state.video = {
                    k_id: kId,
                    k_vid: kVId,
                    formats: result
                }

                const keyboard = result.map((item, index) => [
                    Markup.button.callback(
                        `${item.icon} ${item.formatedType} (${item.formatedQuality} - ${item.size})`,
                        `${kVId}|${index}`
                    )
                ]);

                ctx.replyMessageWithPhoto(thumb, {
                    caption: title,
                    reply_markup: {
                        inline_keyboard: keyboard
                    }
                })
            } catch (e) {
                ctx.replyMessage(e.toString());
                ctx.scene.leave();
            }
        }
    );

    wizardScene.action(/^(.*?)\|([0-9]+)$/, (ctx) => {
        const video = ctx.wizard.state.video?.formats[ctx.match[2]];
        if (!video || ctx.wizard.state.video?.k_vid !== ctx.match[1]) {
            return;
        }

        const data = new FormData();
        data.append("type", "youtube");
        data.append("_id", ctx.wizard.state.video.k_id);
        data.append("v_id", ctx.wizard.state.video.k_vid);
        data.append("ftype", video.type);
        data.append("fquality", video.quality);
        data.append("ajax", "1");

        createAxiosInstance()({
            url: "https://www.y2mate.com/mates/convert",
            method: "post",
            data: data
        }).then(response => {
            const downloadLink = response.data.result?.match(/href="(.*?)"/i);
            if (!downloadLink) {
                throw "🚫 Tautan unduhan tidak dapat ditemukan. Coba lagi";
            }
            const button = Markup.button.url(`${video.icon} Download ${video.formatedQuality} - ${video.size}`, downloadLink[1])
            ctx.replyMessage("Klik tombol dibawah ini untuk mengunduh 👇", Markup.inlineKeyboard([button]));
        }).catch(e => {
            ctx.replyMessage(e.toString());
        })
    });

    wizardScene.action("cancel", async(ctx) => {
        await ctx.reply("Aksi dibatalkan. Ketik /help untuk melihat daftar perintah.");
        await ctx.deleteMessage();
        return ctx.scene.leave();
    });

    bot.use((new Scenes.Stage([wizardScene])).middleware());
    bot.command("ytvideo", ctx => ctx.scene.enter(SCENE_NAME));
}