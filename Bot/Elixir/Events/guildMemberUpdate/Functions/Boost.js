const { UserModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Boost(client, oldMember, newMember, luhux) {

    if (
        !(oldMember.premiumSince && !newMember.premiumSince) ||
        newMember.roles.cache.has(luhux.settings.vipRole) ||
        [
            luhux.settings.underworldRole,
            luhux.settings.quarantineRole,
            ...luhux.settings.unregisterRoles
        ].some(r => newMember.roles.cache.has(r))
    ) return;

    if (luhux.systems.taggedMode) {
        if (newMember.voice.channel) newMember.voice.disconnect().catch(() => { });
        if (newMember.manageable) await newMember.setRoles(luhux.settings.unregisterRoles);
    } else {
        const document = await UserModel.findOne({ id: newMember.id });
        if (document && document.name && document.nameLogs) {
            await newMember.setNickname(`${newMember.tag()} ${document.name}`);
        }
    }
}