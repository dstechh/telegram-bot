const { Markup, Scenes } = require('telegraf');
const { isValidUrl, cleanFbUrl } = require("../utils");
const { createAxiosInstance } = require("../lib");
const FormData = require("form-data");
const cheerio = require("cheerio");

const SCENE_NAME = "FB_VIDEO";

function replaceSubdomain(url, subdomain) {
    return url.replace(/^(https|http):\/\/(www|web|m|mobile|mbasic|touch)\./, `https://${subdomain}.`);
}

function cleanUrl(url) {
    const patterns = [
        /^(https|http):\/\/fb\.watch\/([a-zA-Z0-9_-]+)/i,
        /^(https|http):\/\/fb\.gg\/v\/([a-zA-Z0-9_-]+)/i,
        /^(https|http):\/\/(www|web||m|mobile|mbasic|touch).facebook.com\/groups\/([0-9]+)\/permalink\/([0-9]+)/i,
        /^(https|http):\/\/(www|web|m|mobile|mbasic|touch).facebook.com\/([a-zA-Z0-9\.]+)\/(posts|videos)\/([a-zA-Z0-9]+)/i
    ];

    for (let pattern of patterns) {
        if (url.match(pattern)) {
            let matches = null;
            if ((matches = url.match(patterns[1]))) {
                return `https://fb.watch/${matches[2]}/`;
            } else {
                return replaceSubdomain(url, "www");
            }
        }
    }

    return null;
}

function getVideoFromFb(url) {
    return new Promise(resolve => {
        (async() => {
            try {
                const client = createAxiosInstance({userAgent: {random: false, mobile: true}});
                let response = await client.get(replaceSubdomain(url, "m"));
                let $ = cheerio.load(response.data);
    
                let videoTitle = $("meta[name=\"twitter:title\"]").attr("content"),
                    result = [],
                    videoThumb,
                    videoLink,
                    audioLink;
    
                let videoEl = $("[data-sigil=\"inlineVideo\"]")?.attr("data-store");
                videoThumb = $("meta[name=\"twitter:image\"]")?.attr("content");

                if (videoEl) {
                    const items = JSON.parse(videoEl);
                    videoLink = items.src;
                    audioLink = items.dashManifest.match(/<BaseURL>(.*?)<\/BaseURL>/gi)?.map(item => cleanFbUrl(item.match(/<BaseURL>(.*?)<\/BaseURL>/i)[1]))?.pop();
                } else {
                    response = await client.get(replaceSubdomain(url, "mbasic"));
                    $ = cheerio.load(response.data);
                    videoEl = $("a[href^=/video_redirect/]");
                    videoLink = videoEl.attr("href")?.replace(/^\/video_redirect\/\?src=/, "");
                    videoThumb = videoEl.find("img")?.attr("src");
                }
        
                if (videoLink) {
                    result.push({icon: "🎥", type: "mp4", quality: "SD", url: decodeURIComponent(videoLink) + "&dl=1"})
                }

                if (audioLink) {
                    result.push({icon: "🎶", type: "audio", quality: "", url: decodeURIComponent(audioLink) + "&dl=1"});
                }
                
                resolve({formats: result, title: videoTitle, thumb: videoThumb});
            } catch (e) {
                return resolve(null);
            }
        })()
    })
}

function getVideoFromGetVid(url) {
    return new Promise(resolve => {
        (async() => {
            try {
                const client = createAxiosInstance({userAgent: {random: true}});

                let response = await client.get("https://www.getfvid.com/");

                const data = new FormData();
                data.append("url", url);

                response = await client({
                    url: "https://www.getfvid.com/downloader",
                    method: "post",
                    data: data,
                    headers: {
                        referer: response.request.res.responseUrl
                    }
                });

                const $ = cheerio.load(response.data);
                const title = $("input[id=\"title_video\"]")?.attr("value");
                const btnDownload = $(".btns-download a");
                const result = [];

                if (btnDownload.length == 0) {
                    return resolve(null);
                }

                btnDownload.each((index, el) => {
                    el = $(el),
                    downloadLink = el.attr("href") + "&dl=1";
                    switch (el.text().trim()) {
                        case "Download in HD Quality":
                            result.push({icon: "🎥", type: "mp4", quality: "HD", url: downloadLink});
                            break;
                        case "Download in Normal Quality":
                            result.push({icon: "🎥", type: "mp4", quality: "SD", url: downloadLink});
                            break;
                        default:
                            result.push({icon: "🎶", type: "audio", quality: "", url: downloadLink});
                            break;
                    }
                });
                resolve({title: title, formats: result});
            } catch (e) {
                resolve(null);
            };
        })()
    })
}

module.exports = (bot) => {
    const cancelButton = Markup.inlineKeyboard([Markup.button.callback("❌ Batalkan Aksi", "cancel")]);
    const wizardScene = new Scenes.WizardScene(
        SCENE_NAME,
        async (ctx) => {
            await ctx.replyMessage("🔗 Kirim link vidio Facebook atau postingan?");
            return ctx.wizard.next();
        },
        async (ctx) => {
            let url = ctx.update.message.text.trim();
            if (!isValidUrl(url)) {
                return ctx.replyMessage("🚫 Link salah atau tidak valid", cancelButton);
            }

            url = cleanUrl(url);

            if (url === null) {
                return ctx.replyMessage("🚫 Link postingan facebook salah atau tidak valid", cancelButton);
            }

            const result = await Promise.all([getVideoFromFb(url), getVideoFromGetVid(url)]);
            const formats = (result[1]?.formats || result[0]?.formats || []);
            const caption = (result[1]?.title || result[0]?.title || "Vidio tidak memiliki judul!");

            if (formats.length == 0) {
                return ctx.replyMessage("🚫 Vidio tidak ditemukan. pastikan link postingan benar dan postingan harus bersifat publik.", cancelButton)
            }

            const keyboard =formats.map((item) => [
                Markup.button.url(`${item.icon} ${item.type.toUpperCase()} ${item.quality}`, item.url)
            ]);
    
            ctx.scene.leave();

            if (result[0]?.thumb) {
                ctx.replyMessageWithPhoto(result[0].thumb, {caption: caption, reply_markup: {inline_keyboard: keyboard}})
            } else {
                ctx.replyMessage(caption, Markup.inlineKeyboard(keyboard));
            }
        }
    );

    wizardScene.action("cancel", async(ctx) => {
        await ctx.reply("Aksi dibatalkan. Ketik /help untuk melihat daftar perintah.");
        await ctx.deleteMessage();
        return ctx.scene.leave();
    });

    bot.use((new Scenes.Stage([wizardScene])).middleware());
    bot.command("fbvideo", ctx => ctx.scene.enter(SCENE_NAME));
}