const request = new(require("rss-parser"))();

const database = require('../../db/db');
const {
    errorhandler
} = require('../../../utils/functions/errorhandler/errorhandler');
const {
    MessageEmbed
} = require("discord.js");
const ytdl = require('ytdl-core');

module.exports.handleUploads = async ({
    bot
}) => {

    console.log("🔎 Youtube upload handler started");

    setInterval(async () => {
        const uploads = await database.query(`SELECT * FROM guild_uploads`).then(async results => {
            return results;
        }).catch(err => {
            errorhandler({
                err,
                fatal: true
            });
            return false;
        })

        if (!uploads || uploads.length === 0) return false;

        for (let i in uploads) {
            if (uploads[i].channel_id) {
                request.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${uploads[i].channel_id}`)
                    .then(async (feed) => {
                        try {
                            var uploadedVideos = JSON.parse(uploads[i].uploads);

                            const videoAlreadyExists = uploadedVideos.includes(feed.items[0].link);
                            if (videoAlreadyExists) return;

                        }catch(err) {
                            uploadedVideos = [];
                        }

                        uploadedVideos.push(feed.items[0].link)

                        const saved = await database.query(`UPDATE guild_uploads SET uploads = ? WHERE guild_id = ? AND channel_id = ?`, [JSON.stringify(uploadedVideos), uploads[i].guild_id, uploads[i].channel_id])
                            .catch(err => {
                                errorhandler({
                                    err,
                                    fatal: true
                                });
                                return false;
                            })
                        if (!saved) return;

                        const guild = await bot.guilds.cache.get(uploads[i].guild_id)
                        if (!guild) return;
                        const channel = await guild.channels.cache.get(uploads[i].info_channel_id);
                        if (!channel) return;


                        const pingrole = guild.roles.cache.get(uploads[i].pingrole);
                        if(pingrole) {
                            var isEveryone = pingrole.name === '@everyone';
                        }

                        channel.send({
                            content: ((pingrole) ? (isEveryone) ? '@everyone ' : `<@&${uploads[i].pingrole}> ` : '') + feed.items[0].title + ` ${feed.items[0].link}`,
                        }).catch(err => {});

                        console.log(`📥 New upload sent! GUILD: ${uploads[i].guild_id} CHANNEL ID: ${uploads[i].info_channel_id}`);
                    }).catch(err => {
                        errorhandler({
                            err,
                            fatal: true
                        });
                        return false;
                    })
            }
        }
    }, 600000); //? 10 minutes
}