
const { PunitiveModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Penal(client, oldMember, newMember, luhux) {
    if (
        oldMember.roles.cache.map((r) => r.id) === newMember.roles.cache.map((r) => r.id) ||
        ![
            luhux.settings.underworldRole,
            luhux.settings.quarantineRole,
            luhux.settings.adsRole,
            luhux.settings.chatMuteRole,
            luhux.settings.voiceMuteRole
        ].some((r) => oldMember.roles.cache.has(r) && !newMember.roles.cache.has(r))
    ) return;

    const penals = await PunitiveModel.find({ id: newMember.id, active: true });
    if (!penals.length) return;

    const memberRoles = [];

    for (const penal of penals) {
        if (penal.type === 'Underworld') {
            memberRoles.push(luhux.settings.underworldRole);
        };

        if (penal.type === 'Quarantine') {
            memberRoles.push(luhux.settings.quarantineRole);
        };

        if (penal.type === 'Ads') {
            memberRoles.push(luhux.settings.adsRole);
        };

        if (penal.type === 'ChatMute') {
            memberRoles.push(luhux.settings.chatMuteRole);
        };

        if (penal.type === 'VoiceMute') {
            memberRoles.push(luhux.settings.voiceMuteRole);
        };
    }

    if (memberRoles.length) {
        newMember.addRoles(memberRoles);
    }
}