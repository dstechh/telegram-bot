const config = require("../config");

function handler(ctx) {
    const from = ctx.update.message.from;
    const name = [from.first_name, from.last_name || ""].join(" ");
    const message = `

Assalamualaikum kak [${name}](tg://user?id=${from.id}). dibawah ini adalah fitur yang tersedia dibot ini, kamu dapat menggunakan fitur yang ada dengan bebas 😊


* ⬇️ PENGUNDUH*
/ytvideo - download vidio dari YouTube
/fbvideo - download vidio dari Facebook
/ttvideo - download vidio dari TikTok tanpa watermark
/twvideo - download vidio dari Twitter

* 🖼️ GAMBAR ATAU FOTO*
/cartoon - mengubah foto ke versi cartoon
/anime - mengubah foto ke versi anime

* 📂 LAINNYA*
/shortlink - memendekan link


*< INFORMASI PENGGUNA >*
 👉 Nama: [${name}](tg://user?id=${from.id})
 👉 ID: [${from.id}](tg://user?id=${from.id})
 👉 Username: [@${from.username || '-'}](tg://user?id=${from.id})
 👉 Kode Bahasa: ${from.language_code}

 Butuh bantuan? hubungi [Owner BOT](tg://user?id=${config.owenerId}) hehe :)
    `;

    ctx.replyMessageWithMarkdown(message);
}

module.exports = (bot) => {
    bot.command("help", handler);
    bot.command("menu", handler);
}