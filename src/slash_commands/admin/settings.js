const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
    sendWelcomeSetting,
    updateWelcomeSettings,
} = require('../../../utils/functions/data/welcomechannel');
const { GuildConfig } = require('../../../utils/functions/data/Config');
const config = require('../../../src/assets/json/_config/config.json');
const { viewAllSettings } = require('../../../utils/functions/settings/viewAllSettings');
const { updateReactionRoles } = require('../../../utils/functions/data/reactionroles');
module.exports.run = async ({ main_interaction, bot }) => {
    await main_interaction.deferReply({
        ephemeral: true,
    });

    const hasPermission = await main_interaction.member.permissions.has(
        PermissionFlagsBits.Administrator
    );
    if (!hasPermission) {
        return main_interaction
            .followUp({
                content: config.errormessages.nopermission,
                ephemeral: true,
            })
            .catch((err) => {});
    }

    switch (main_interaction.options.getSubcommand()) {
        case 'view':
            return main_interaction
                .reply({
                    content: 'This command is currenty disabled',
                    ephemeral: true,
                })
                .catch((err) => {});

            const currentsettings = await database
                .query(`SELECT * FROM ${main_interaction.guild.id}_config LIMIT 1`)
                .then(async (res) => {
                    return await res[0];
                })
                .catch((err) => {
                    errorhandler({
                        err,
                        fatal: true,
                    });
                    return main_interaction
                        .followUp({
                            content: `${config.errormessages.databasequeryerror}`,
                        })
                        .catch((err) => {});
                });

            await viewAllSettings({
                currentsettings,
                guild: main_interaction.guild,
                bot,
            })
                .then((res) => {
                    main_interaction
                        .followUp({
                            embeds: [res],
                            ephemeral: true,
                        })
                        .catch((err) => {});
                })
                .catch((err) => {
                    main_interaction
                        .followUp({
                            content: err,
                            ephemeral: true,
                        })
                        .catch((err) => {});
                });
            break;

        case 'welcomemessage':
            await updateWelcomeSettings({
                guild_id: main_interaction.guild.id,
                valueName: 'id',
                value: main_interaction.options.getChannel('channel').id,
            })
                .then(() => {
                    sendWelcomeSetting({
                        main_interaction,
                    });
                })
                .catch((err) => {
                    main_interaction
                        .followUp({
                            content: '❌ ' + err,
                            ephemeral: true,
                        })
                        .catch((err) => {});
                });
            break;

        case 'prefix':
            const prefix = main_interaction.options.getString('prefix');
            const prefixCheck = await GuildConfig.checkPrefix({
                value: prefix,
            });
            if (prefixCheck === false)
                return main_interaction
                    .followUp({
                        content: `Invalid Prefix`,
                        ephemeral: true,
                    })
                    .catch((err) => {});
            await saveSetting({
                value: prefix,
                valueName: config.settings.prefix.colname,
            });
            main_interaction
                .followUp({
                    content: `✅ Prefix updated to ${prefix}`,
                    ephemeral: true,
                })
                .catch((err) => {});
            break;

        case 'cooldown':
            const cooldown = main_interaction.options.getNumber('cooldown');
            if (cooldown < 1) {
                await saveSetting({
                    value: 0, //? convert to milliseconds
                    valueName: config.settings.cooldown.colname,
                });
                main_interaction
                    .followUp({
                        content: `✅ Command Cooldown successfully turned off \n \n**Info: A default Cooldown of 2 Seconds is still enabled to protect the bot from spam!**`,
                        ephemeral: true,
                    })
                    .catch((err) => {});
            } else {
                await saveSetting({
                    value: cooldown * 1000, //? convert to milliseconds
                    valueName: config.settings.cooldown.colname,
                });
                main_interaction
                    .followUp({
                        content: `✅ Command Cooldown successfully changed to ${cooldown} seconds \n \n**Info: Cooldown can be interupted when the bot is offline!**`,
                        ephemeral: true,
                    })
                    .catch((err) => {});
            }
            break;

        case 'dmcau':
            const dmcau = main_interaction.options.getBoolean('dmcau');
            await saveSetting({
                value: dmcau,
                valueName: config.settings.dmcau.colname,
            });
            main_interaction
                .followUp({
                    content: `✅ Moderation commands will be **${
                        dmcau ? 'deleted' : 'kept'
                    }** after usage.`,
                    ephemeral: true,
                })
                .catch((err) => {});
            break;

        case 'dcau':
            const dcau = main_interaction.options.getBoolean('dcau');
            await saveSetting({
                value: dcau,
                valueName: config.settings.dcau.colname,
            });
            main_interaction
                .followUp({
                    content: `✅ Commands will be **${dcau ? 'deleted' : 'kept'}** after usage.`,
                    ephemeral: true,
                })
                .catch((err) => {});
            break;
    }

    async function saveSetting({ value, valueName }) {
        await GuildConfig.update({
            guild_id: main_interaction.guild.id,
            value,
            valueName,
        });
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('All important settings which you can set, edit or remove.')
    .addSubcommand((command) => command.setName('view').setDescription('View all of your settings'))
    .addSubcommand((command) =>
        command
            .setName('welcomemessage')
            .setDescription('Set the welcome message and channel.')
            .addChannelOption((channel) =>
                channel
                    .setName('channel')
                    .setDescription('The channel you want to set as welcome channel.')
                    .setRequired(true)
            )
    )
    .addSubcommand((command) =>
        command
            .setName('prefix')
            .setDescription('Set the prefix for your Guild.')
            .addStringOption((prefix) =>
                prefix
                    .setName('prefix')
                    .setDescription('The prefix you want to set.')
                    .setRequired(true)
            )
    )
    .addSubcommand((command) =>
        command
            .setName('cooldown')
            .setDescription('Set the cooldown for your Guild.')
            .addNumberOption((cooldown) =>
                cooldown
                    .setName('cooldown')
                    .setDescription('The cooldown you want to set. (in seconds)')
                    .setRequired(true)
            )
    )
    .addSubcommand((command) =>
        command
            .setName('dmcau')
            .setDescription('Decide if moderation commands gets deleted after usage.')
            .addBooleanOption((dmcau) =>
                dmcau
                    .setName('dmcau')
                    .setDescription(
                        'True if you want to delete the command after usage. False if you want to keep it.'
                    )
                    .setRequired(true)
            )
    )
    .addSubcommand((command) =>
        command
            .setName('dcau')
            .setDescription('Decide if commands gets deleted after usage.')
            .addBooleanOption((dmcau) =>
                dmcau
                    .setName('dcau')
                    .setDescription(
                        'True if you want to delete the command after usage. False if you want to keep it.'
                    )
                    .setRequired(true)
            )
    );
