const { JoinModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Staff(client, oldState, newState, luhux) {

    const member = oldState.guild.members.cache.get(oldState.id);

    if (oldState.channel && !newState.channel) {
        const data = await JoinModel.findOne({ id: oldState.id });
        if (!data) return;

        const time = Date.now() - data.voice;
        if (time <= 0) return;

        const category = oldState.guild.channels.cache.get(oldState.channelId)?.parent;
        if (!category) return;

        const afkChannels = oldState.channel.name.toLowerCase().includes('sleep') || oldState.channel.name.toLowerCase().includes('afk');

        const minutes = Math.max(Math.floor(time / (1000 * 60)), 1);
        if (afkChannels) return client.staff.checkRank(client, member, luhux, { type: 'afkPoints', amount: time, point: minutes * 2 });
        if (category.id === luhux.settings.publicParent) return client.staff.checkRank(client, member, luhux, { type: 'publicPoints', amount: time, point: minutes * 2 });
        if (category.id === luhux.settings.streamerParent) return client.staff.checkRank(client, member, luhux, { type: 'streamerPoints', amount: time, point: minutes * 2 });
    }

    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const data = await JoinModel.findOne({ id: oldState.id });
        if (!data) return;

        const time = Date.now() - data.voice;
        if (time <= 0) return;

        const category = oldState.guild.channels.cache.get(oldState.channelId)?.parent;
        if (!category) return;

        const afkChannels = oldState.channel.name.toLowerCase().includes('sleep') || oldState.channel.name.toLowerCase().includes('afk');

        const minutes = Math.max(Math.floor(time / (1000 * 60)), 1);
        if (afkChannels) return client.staff.checkRank(client, member, luhux, { type: 'afkPoints', amount: time, point: minutes * 2 });
        if (category.id === luhux.settings.publicParent && member.guild.afkChannelId !== oldState.channelId) return client.staff.checkRank(client, member, luhux, { type: 'publicPoints', amount: time, point: minutes * 2 });
        if (category.id === luhux.settings.streamerParent && member.guild.afkChannelId !== oldState.channelId) return client.staff.checkRank(client, member, luhux, { type: 'streamerPoints', amount: time, point: minutes * 2 });
    }
}