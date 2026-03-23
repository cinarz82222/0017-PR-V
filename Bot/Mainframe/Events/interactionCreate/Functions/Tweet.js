
const {
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextInputBuilder,
    ModalBuilder,
    TextInputStyle,
    EmbedBuilder
} = require('discord.js');
const TweetModel = require('../../../../../Global/Settings/Schemas/Tweet');
module.exports = async function Tweet(client, interaction, route, luhux) {
    const member = interaction.guild?.members.cache.get(interaction.user.id)
    if (!member) return;
   
    if (route === 'openTweetModal') {
        const modal = new ModalBuilder()
            .setCustomId('tweetModal')
            .setTitle('Tweetinizi Yazın');

        const tweetInput = new TextInputBuilder()
            .setCustomId('tweetContent')
            .setLabel('Tweet içeriği')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Tweetinizin içeriğini girin...')
            .setRequired(true);

        const imageInput = new TextInputBuilder()
            .setCustomId('tweetImage')
            .setLabel('Tweet resim linki (isteğe bağlı)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder('https://...');

        const row1 = new ActionRowBuilder().addComponents(tweetInput);
        const row2 = new ActionRowBuilder().addComponents(imageInput);

        modal.addComponents(row1, row2);
        await interaction.showModal(modal);
    };
}