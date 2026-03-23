const { PunitiveModel } = require('../../../../../Global/Settings/Schemas');
const { bold, inlineCode } = require('discord.js');

module.exports = async function Penals(client, member, luhux, channel) {
    const penals = await PunitiveModel.find({ user: member.id, active: true });
    if (!penals.length || !penals) return false;

    const memberPenals = [];
    const memberRoles = [];

    for (const penal of penals) {
        if (penal.type === 'ForceBan') {
            member.guild.members.ban(member.id, { reason: `Aktif Ceza - ForceBan` }).catch(() => undefined);
            memberPenals.push('ForceBan');
        };

        if (penal.type === 'Underworld') {
            memberRoles.push(luhux.settings.underworldRole);
            memberPenals.push('Underworld');
        };

        if (penal.type === 'Quarantine') {
            memberRoles.push(luhux.settings.quarantineRole);
            memberPenals.push('Quarantine');
        };

        if (penal.type === 'Ads') {
            memberRoles.push(luhux.settings.adsRole);
            memberPenals.push('Quarantine');
        };

        if (penal.type === 'ChatMute') {
            memberRoles.push(luhux.settings.chatMuteRole);
            memberPenals.push('ChatMute');
        };

        if (penal.type === 'VoiceMute') {
            memberRoles.push(luhux.settings.voiceMuteRole);
            memberPenals.push('VoiceMute');
        };
    }

    if (memberPenals.length) {
        channel.send({
            content: `${member} (${inlineCode(`${member.user.username} - ${member.user.id}`)}) adlı üye ${bold(memberPenals.listArray())} cezaları aktif olduğu için cezalı olarak belirlendi.`
        });
    }

    if (memberRoles.length) {
        member.addRoles(memberRoles);
    }

    return true;
}