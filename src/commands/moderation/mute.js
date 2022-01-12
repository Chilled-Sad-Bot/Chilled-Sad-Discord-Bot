const config = require('../../../config.json');
const {
    Database
} = require('../../db/db');
const { getModTime } = require('../../../utils/functions/getModTime');
const { getFutureDate } = require('../../../utils/functions/getFutureDate');
const { createInfractionId } = require('../../../utils/functions/createInfractionId');
const { insertDataToOpenInfraction } = require('../../../utils/functions/insertDataToDatabase');
const { hasPermission } = require('../../../utils/functions/hasPermissions');
const { setNewModLogMessage } = require('../../../utils/modlog/modlog');
const { privateModResponse } = require('../../../utils/privatResponses/privateModResponses');
const { publicModResponses } = require('../../../utils/publicResponses/publicModResponses');
const { isMod } = require('../../../utils/functions/isMod');
const { getAllRoles } = require('../../../utils/functions/roles/getAllRoles');
const { removeAllRoles } = require('../../../utils/functions/roles/removeAllRoles');

const database = new Database();

module.exports.run = async (bot, message, args) => {
    if (config.deleteModCommandsAfterUsage == 'true') {
        message.delete();
    }

    if (!await hasPermission(message, 0, 0)) {
        message.delete();
        return message.channel.send(`<@${message.author.id}> ${config.errormessages.nopermission}`).then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
    }

    try {
        var Member = message.mentions.members.first() || await message.guild.members.fetch(args[0]);
        if (!Member) return message.channel.send(`<@${message.author.id}> You have to mention a user`);
        if (Member.user.bot) return message.reply(`You can't mute <@${Member.user.id}>. It's a Bot.`)
        if (Member.id === message.author.id) return message.reply(`You cant't mute yourself.`);
        if (Member.id === bot.user.id) return message.reply(`You cant't mute me.`);
    }catch(err) {
        message.delete();
        return message.channel.send(`<@${message.author.id}> You have to mention a user`);
    }
    
    if (await isMod(Member, message)) return message.channel.send(`<@${message.author.id}> You can't mute a Moderator!`)

    var MutedRole;

    try {
        MutedRole = await message.guild.roles.cache.find(role => role.name === "Muted").id;
    } catch (err) {
        await message.channel.send(`No Mutedrole detected! I'll create one for you.`);
        MutedRole = await message.guild.roles.create({
            name: 'Muted',
            color: 'BLUE',
            reason: 'Automatically created "Muted" Role.',
            permissions: []
        });
        await message.guild.channels.cache.map(async channel => {
            await channel.permissionOverwrites.create(MutedRole, {
                VIEW_CHANNEL: false,
                SEND_MESSAGES: false,
                ADD_REACTIONS: false,
                SPEAK: false,
                CONNECT: false
            });
        });
        await message.channel.send(`Role created!`);
    }

    if (Member.roles.cache.has(MutedRole)) return message.channel.send(`Member Is Already Muted!`)


    let x = 1;
    var time = args[x]

    while(time == '') {
        time = args[x];
        x++;
    }

    let dbtime = getModTime(time);
    if(!dbtime) return message.reply(`Invalid Time [m, h, d]`);

    let reason = args.slice(x).join(" ");
    reason = reason.replace(time, '');

    if (!reason) return message.channel.send('Please add a reason!');


    await database.query(`SELECT * FROM open_infractions WHERE user_id = ? AND mute = 1`, [Member.id]).then(result => {
        if (result.length > 0) {
            for (let i in result) {
                let currentdate = new Date().toLocaleString('de-DE', {timeZone: 'Europe/Berlin'})
                currentdate = currentdate.replace(',', '').replace(':', '').replace(' ', '').replace(':', '').replace('.', '').replace('.', '').replace('.', '');
                result[i].till_date = result[i].till_date.replace(',', '').replace(':', '').replace(' ', '').replace(':', '').replace('.', '').replace('.', '').replace('.', '');

                if ((currentdate - result[i].till_date) <= 0) {
                    return message.reply(`Member Is Already Muted!`);
                }
            }
        }
        
    }).catch(err => {
        console.log(err);
        return message.reply(`${config.errormessages.databasequeryerror}`);
    });

    if(config.debug == 'true') console.info('Mute Command passed!')

    var user_roles = await getAllRoles(Member);
    await removeAllRoles(Member);
    await Member.roles.add(MutedRole).catch(err => { return message.channel.send(`I don't have permissions to do this task!`)});

    if (Member.roles.cache.has(MutedRole)) {
        try {
            insertDataToOpenInfraction(Member.id, message.author.id, 1, 0, getFutureDate(dbtime, time), reason, createInfractionId(), message.guild.id, JSON.stringify(user_roles))
            setNewModLogMessage(bot, config.defaultModTypes.mute, message.author.id, Member.id, reason, time, message.guild.id);
            publicModResponses(message, config.defaultModTypes.mute, message.author.id, Member.id, reason, time);
            privateModResponse(Member, config.defaultModTypes.mute, reason, time);
        } catch (err) {
            console.log(err);
            return message.channel.send(config.errormessages.general)
        }
    }
}

module.exports.help = {
    name: "mute",
    description: "Mute a User",
    usage: "Mute <Mention User> <Reason>"
}