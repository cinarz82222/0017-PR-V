const { EmbedBuilder, inlineCode, codeBlock, bold } = require('discord.js');
const { UserModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function BannedTag(client, oldUser, newUser, member, luhux) {
    const oldHasTag = luhux.settings.bannedTags.some((tag) => oldUser.displayName.toLowerCase().includes(tag.toLowerCase()));
    const newHasTag = luhux.settings.bannedTags.some((tag) => newUser.displayName.toLowerCase().includes(tag.toLowerCase()));

    const logChannel = await client.getChannel('yasaklıtag-log', member)
    const tag = luhux.settings.bannedTags.find((tag) => newUser.displayName.toLowerCase().includes(tag.toLowerCase()));

    if (!oldHasTag && newHasTag) {
        member.setRoles(luhux.settings.bannedTagRole);
        const isTag = member.displayName.includes(luhux.settings.tag) ? luhux.settings.tag : luhux.settings.secondTag;
        member.setNickname(member.displayName.replace(isTag, '[YASAKLI-TAG]').replace(luhux.settings.secondTag, '[YASAKLI-TAG]')).catch(() => null);

        if (logChannel) logChannel.send({
            flags: [4096],
            embeds: [new EmbedBuilder({
                color: client.getColor('red'),
                title: 'Yasaklı Taglı Üye Tespit Edildi',
                description: `${member} adlı üye yasaklı taglı (${inlineCode(tag || 'luhux')}) olduğu için banlandı.`,
                fields: [
                    {
                        name: '\u200b',
                        value: codeBlock('yaml', [
                            `# Bilgilendirme`,
                            `→ Kullanıcı: ${member.user.username} (${member.user.id})`,
                            `→ Yasaklı Tag: ${tag}`,
                            `→ Tarih: ${client.functions.date(Date.now())}`,
                        ].join('\n')),
                    }
                ]
            })],
        });

        return true;
    };

    if (oldHasTag && !newHasTag) {

        const document = await UserModel.findOne({ id: member.id });
        if (document && document.name && document.nameLogs) {
            member.setNickname(`${member.tag()} ${document.name}`);
            member.setRoles(document?.gender === 'Man' ? luhux.settings.manRoles : luhux.settings.womanRoles);
        } else {
            member.setNickname(`${member.tag()} ${luhux.settings.name}`);
            member.setRoles(luhux.settings.unregisterRoles);
        }

        if (logChannel) logChannel.send({
            flags: [4096],
            embeds: [new EmbedBuilder({
                color: client.getColor('green'),
                title: 'Yasaklı Tagı Olmayan Üye Tespit Edildi',
                description: `${member} adlı üye yasaklı taglı olduğu için banı kaldırıldı.`,
                fields: [
                    {
                        name: '\u200b',
                        value: codeBlock('yaml', [
                            `# Bilgilendirme`,
                            `→ Kullanıcı: ${member.user.username} (${member.user.id})`,
                            `→ Yasaklı Tag: ${tag}`,
                            `→ Tarih: ${client.functions.date(Date.now())}`,
                        ].join('\n')),
                    }
                ]
            })],
        });

        return true;
    };

    return false;
}