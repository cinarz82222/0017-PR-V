let complimentCounter = 0

module.exports = async function complimentHandler(client, message, luhux) {

    if (message.author.bot || !message.guildId || luhux?.settings?.chatChannel !== message.channelId) return;

    if (luhux?.systems?.compliment === false) return;

    complimentCounter++
    if (complimentCounter !== 100) return;
    complimentCounter = 0

    message.reply({ content: client.data.compliments[Math.floor(Math.random() * client.data.compliments.length)] })
}