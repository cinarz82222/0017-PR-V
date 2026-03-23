const { PermissionFlagsBits } = require('discord.js')

module.exports = async function nameControl(client, log, guild, luhux) {
    if (log.executor.bot) return;

    const staffMember = await guild.members.fetch(log.executor.id);
    if (staffMember.permissions.has(PermissionFlagsBits.Administrator) || luhux.founders.some(r => staffMember.roles.cache.has(r))) return;
    
    const member = await guild.members.fetch(log.target.id);
    if (!member) return;

    log.changes.forEach(change => {
        if (change.key === 'nick') {
           member.setNickname(change.old).catch(() => { });
        }
    });
}