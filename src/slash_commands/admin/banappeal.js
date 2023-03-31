const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Banappeal = require('../../../utils/functions/data/Banappeal');
const { hasPermission } = require('../../../utils/functions/hasPermissions');
const { banAppealConfig } = require('../_config/admin/banappeal');

module.exports.run = async ({ main_interaction, bot }) => {
    await main_interaction.deferReply({ ephemeral: true });

    const hasPermissions = await hasPermission({
        guild_id: main_interaction.guild.id,
        adminOnly: true,
        modOnly: false,
        user: main_interaction.user,
        bot,
    });

    if (!hasPermissions) {
        main_interaction
            .editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('You do not have permission to use this command.')
                        .setColor('#FF0000'),
                ],
                ephemeral: true,
            })
            .catch(() => {});
        return;
    }

    const banappeal = new Banappeal(bot);

    const guild_id = main_interaction.guild.id;
    const command = main_interaction.options.getSubcommand();

    if (command === 'remove') {
        return banappeal
            .updateBanappealSettings(guild_id, null)
            .then(() => {
                main_interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription('The ban appeal has been removed from your server.')
                            .setColor('#00FF00'),
                    ],
                    ephemeral: true,
                });
            })
            .catch(() => {
                main_interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                'An error occured while removing the ban appeal from your server.'
                            )
                            .setColor('#FF0000'),
                    ],
                    ephemeral: true,
                });
            });
    }

    const title = main_interaction.options.getString('title');
    const description = main_interaction.options.getString('description');
    const questions = main_interaction.options.getString('questions');
    const channel = main_interaction.options.getChannel('channel');
    const cooldown = main_interaction.options.getNumber('cooldown');

    const questions_array = questions.split(',');

    const settings = {
        title,
        description,
        questions: questions_array,
        channel_id: channel.id,
        cooldown: cooldown,
    };

    banappeal
        .updateBanappealSettings(guild_id, settings)
        .then(() => {
            const exampleEmbed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor('#f44336');

            for (let i in questions_array) {
                exampleEmbed.addFields({
                    name: `Question ${parseInt(i) + 1}`,
                    value: questions_array[i],
                });
            }

            main_interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            'The ban appeal has been setup for your server. An example of how it will look will be sent to the channel you specified.'
                        )
                        .setColor('#00FF00'),
                ],
                ephemeral: true,
            });

            channel
                .send({
                    embeds: [exampleEmbed],
                })
                .catch(() => {
                    main_interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    'An error occured while sending the example to the channel you specified. Please make sure I have the correct permissions or the bot is not able to send any Appeals.'
                                )
                                .setColor('#FF0000'),
                        ],
                        ephemeral: true,
                    });
                });
        })
        .catch(() => {
            main_interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            'An error occured while setting up the ban appeal for your server.'
                        )
                        .setColor('#FF0000'),
                ],
                ephemeral: true,
            });
        });
};

module.exports.data = banAppealConfig