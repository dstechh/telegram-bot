const { Markup, Scenes } = require('telegraf');
const { isValidUrl } = require("../utils");
const { createAxiosInstance } = require("../lib");
const FormData = require("form-data");
const cheerio = require("cheerio");
const collect = require("collect.js");

const SCENE_NAME = "TT_VIDEO";

function cleanTiktokUrl(url) {
    const patterns = [
        /^(https|http):\/\/vt\.tiktok\.com\/([a-zA-Z0-9_-]+)/i,
        /^(https|http):\/\/www\.tiktok\.com\/(.*?)\/video\/([0-9]+)/i,
    ];

    for (let pattern of patterns) {
        if (url.match(pattern)) {
            return url.replace(/^http:/, "https:");
        }
    }

    return null;
}

module.exports = (bot) => {
    const cancelButton = Markup.inlineKeyboard([Markup.button.callback("❌ Batalkan Aksi", "cancel")]);
    const wizardScene = new Scenes.WizardScene(
        SCENE_NAME,
        async (ctx) => {
            await ctx.replyMessage("🔗 Kirim link vidio TikTok?");
            return ctx.wizard.next();
        },
        async (ctx) => {
            let url = ctx.update.message.text.trim();
            if (!isValidUrl(url)) {
                return ctx.replyMessage("🚫 Link salah atau tidak valid", cancelButton);
            }

            url = cleanTiktokUrl(url);

            if (url === null) {
                return ctx.replyMessage("🚫 Link postingan TikTok salah atau tidak valid", cancelButton);
            }

            try {
                const client = createAxiosInstance({userAgent: {random: true}});

                let response = await client.get("https://tikmate.online/");
   
                let $ = cheerio.load(response.data);
                const form = $("form[id=\"get_video\"]");
                const token = form.find("input[name=\"token\"]").attr("value");
  
                const data = new FormData();

                data.append("token", token);
                data.append("url", url);

                response = await client({
                    url: "https://tikmate.online/abc.php",
                    method: "post",
                    data: data,
                    headers: {
                        referer: response.request.res.responseUrl
                    }
                });

                if (!response.data.includes("String.fromCharCode")) {
                    return ctx.replyMessage("🚫 Vidio tidak ditemukan. pastikan link postingan benar.", cancelButton)
                }

                $ = cheerio.load(response.data);

                const script = $("script").html().replace("eval", "");
                const js = eval(script);

                const html = js.match(/innerHTML = "(.*?)"; parent\.document/)?.[1].replace(/\\"/g, "\"");
                $ = cheerio.load(html);

                const thumb = $(".videotikmate-left img").attr("src").replace(/100x100/, "200x200");
                const title = $(".videotikmate-left img").attr("alt");
                const author = $("div.hover-underline").attr("title");
                const result = [];

                for (let el of $("a")) {
                    el = $(el),
                    link = el.attr("href");
                    if (!link.includes("?token=")) {
                        continue;
                    }
                    if (el.text().trim() === "Download MP3") {
                        result.push({icon: "🎶", type: "mp3", url: link});
                    } else {
                        result.push({icon: "🎥", type: "mp4", url: link});
                    }
                }

                const keyboard = collect(result).unique(item => item.url).map((item) => [
                    Markup.button.url(`${item.icon} ${item.type.toUpperCase()}`, item.url)
                ]).toArray();

                const caption = `*${author}*\n\n${title}`;

                ctx.replyMessageWithPhoto(thumb, {
                    caption: caption,
                    parse_mode: "markdown",
                    reply_markup: {
                        inline_keyboard: keyboard
                    }
                }).catch(e => ctx.replyMessageWithMarkdown(caption, Markup.inlineKeyboard(keyboard)))
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
    bot.command("ttvideo", ctx => ctx.scene.enter(SCENE_NAME));
}