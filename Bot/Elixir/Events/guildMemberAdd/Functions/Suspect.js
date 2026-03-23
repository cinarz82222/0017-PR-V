const { inlineCode } = require('discord.js');

module.exports = async function Suspect(client, member, luhux, channel) {
    if (Date.now() - member.user.createdTimestamp > 1000 * 60 * 60 * 24 * 7) return false;

    await member.setRoles(luhux.settings.suspectedRole);

    channel.send({
        content: `${member} (${inlineCode(`${member.user.username} - ${member.user.id}`)}) adlı kullanıcının hesabı 7 günden az bir sürede açıldığı için şüpheliye atıldı.`
    });

    return true;
}