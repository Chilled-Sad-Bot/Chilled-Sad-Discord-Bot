const { SlashCommandBuilder } = require('discord.js');
const SingASong = require('../../../utils/functions/data/SingASong');
const { hasPermission } = require('../../../utils/functions/hasPermissions');
const { singasongConfig } = require('../_config/fun/singasong');

module.exports.run = async ({ main_interaction, bot }) => {
    const singasong = new SingASong(main_interaction, bot);

    switch (main_interaction.options.getSubcommand()) {
        case 'start':
            const check = singasong.initCheck();

            if (typeof check === 'string') {
                return main_interaction.reply({ content: check, ephemeral: true });
            }

            singasong.start().catch((err) => {
                return main_interaction.reply({ content: err, ephemeral: true });
            });
            break;
        case 'view_my_points':
            const points = await singasong.getPointsFromUser(main_interaction.user.id);
            if (!points)
                return main_interaction.reply({ content: 'You have no points!', ephemeral: true });
            main_interaction.reply({ content: `You have ${points} points!`, ephemeral: true });
            break;
        case 'view':
            main_interaction.reply({
                content: 'This command is currently disabled!',
                ephemeral: true,
            });
            break;
        case 'ban':
            const hasPermissions = await hasPermission({
                guild_id: main_interaction.guild.id,
                adminOnly: false,
                modOnly: true,
                user: main_interaction.user,
                bot,
            });
            if (!hasPermissions) {
                return main_interaction.reply({
                    content: 'You do not have permission to use this command!',
                    ephemeral: true,
                });
            }
            await singasong
                .banUser(main_interaction.options.getUser('user').id, main_interaction.guild.id)
                .then(() => {
                    main_interaction.reply({
                        content: 'User has been banned from using the command in this guild!',
                        ephemeral: true,
                    });
                })
                .catch((err) => {
                    main_interaction.reply({ content: err, ephemeral: true });
                });
            break;
    }
};

module.exports.data = singasongConfig;
