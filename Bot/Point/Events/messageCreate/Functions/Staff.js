module.exports = async function Staff(client, message, luhux) {
    if (!client.staff.check(message.member, luhux)) return;
    if (message.channel.id !== luhux.settings.chatChannel) return;
    await client.staff.checkRank(client, message.member, luhux, { type: 'messagePoints', amount: 1, point: 1 });
}