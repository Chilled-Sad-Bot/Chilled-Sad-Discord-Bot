const config = require('../../../src/assets/json/_config/config.json');
const {TextInputBuilder, SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');
const { userAFK } = require('../../../utils/functions/data/afk');

module.exports.run = async ({main_interaction, bot}) => {
    const isRemove = main_interaction.options.getBoolean('remove');
    const isUserAfk = userAFK.find(u => u.user_id === main_interaction.user.id);

    if(isRemove) {
        if(!isUserAfk) return main_interaction.update({
            content: `❌ You are not afk.`,
            ephemeral: true
        });

        userAFK = userAFK.filter(u => u.user_id !== main_interaction.user.id);
        return main_interaction.update({
            content: `✅ You are no longer afk.`,
            ephemeral: true
        });
    }else {

        if(isUserAfk) return main_interaction.reply({
            content: `❌ You are already afk. \`Reason: ${isUserAfk.reason}\` To remove your afk state add the remove option.`,
            ephemeral: true
        }).catch(err => {})

        const modal = new ModalBuilder()
            .setTitle('Reason for your afk state.')
            .setCustomId('afk_modal')

        const textInput = new TextInputBuilder()
            .setLabel('Reason...')
            .setCustomId('afk_reason')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)

        const first = new ActionRowBuilder().addComponents([textInput])
        modal.addComponents([first]);

        main_interaction.showModal(modal);

    }
}
module.exports.data = new SlashCommandBuilder()
	.setName('afk')
	.setDescription('Set you to afk.')
    .addBooleanOption(option =>
        option
        .setName('remove')
        .setDescription('Remove the afk status.')
        .setRequired(false)
    )