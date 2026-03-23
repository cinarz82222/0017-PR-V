
const { Events, PermissionFlagsBits, bold } = require("discord.js");
const  Loca = require('../../../../../Global/Settings/Schemas/Loca');
module.exports = {
    Name: Events.VoiceStateUpdate,
    System: true,

    execute: async (client, oldState, newState) => {
        if (oldState.member && oldState.member.user.bot || newState.member && newState.member.user.bot) return;
        const secretRoom = await Loca.findOne({ id: newState.channelId });
        if (!secretRoom) return;
        if (!oldState.channel && newState.channel) {
            const channel = await client.channels.fetch(secretRoom.id);
            const member = channel.guild.members.cache.get(newState.id);
            const overwrite = channel.permissionOverwrites.cache.find(o => o.id === newState.member.id || o.id === newState.member.roles.highest.id);
            const isAllow = overwrite && overwrite.allow.has(PermissionFlagsBits.Connect);
            const isLock = channel.permissionOverwrites.cache.some(o => o.id === channel.guild.roles.everyone.id && o.deny.has(PermissionFlagsBits.Connect));
            const isAdmin = newState.member.permissions.has(PermissionFlagsBits.Administrator);

            if (isAdmin && !isAllow && isLock) {
                if (member?.voice.channel) {
                    member.send({ content: `${bold(channel.name)} adlı özel oda için yetkiniz bulunmamaktadır.` }).catch(console.error);
                    channel.send({ content: `${member} kullanıcısı kanala katıldı fakat kanalda izni olmadığı için bağlantısı kesildi...` }).then((e) => setTimeout(() => { e.delete(); }, 20000)).catch(console.error);
                    member.voice.disconnect().catch(console.error);
                }
                return;
            }

            if (!isAllow && isLock) {
                if (member?.voice.channel) {
                    member.send({ content: `${bold(channel.name)} adlı özel oda için izniniz bulunmamaktadır.` }).catch(console.error);
                    member.voice.disconnect().catch(console.error);
                }
            }
        }
    }
};
