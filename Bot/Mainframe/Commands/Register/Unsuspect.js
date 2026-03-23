const { PermissionsBitField: { Flags }, inlineCode } = require('discord.js');
const ms = require('ms');

module.exports = {
    Name: 'şüpheliçıkart',
    Aliases: ['şüpheli-çıkart', 'unsuspect', 'şüpheli'],
    Description: 'Belirttiğiniz üyeyi şüpheli durumundan çıkartırsınız.',
    Usage: 'şüpheliçıkart <@User/ID>',
    Category: 'Register',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, luhux, embed) => {
        if (!(luhux.settings.suspectedRole || '').length) {
            client.embed(message, 'Sunucuda kayıtsız rolü ayarlanmamış.');
            return;
        };

        const limit = client.functions.checkLimit(message.author.id, 'Unsusppect', 5, ms('5m'));
        if (limit.hasLimit) {
            client.utils.send(message, `Bu komutu kullanabilmek için ${limit.time} beklemelisin.`);
            return;
        };

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        if (!member) {
            client.embed(message, `Kullanıcı bulunamadı!`);
            return;
        }

        if (!member.roles.cache.has(luhux.settings.suspectedRole)) {
            client.embed(message, `${await client.getEmoji('mark')} Belirttiğiniz üye zaten şüpheli değil.`);
            return;
        }

        if (client.functions.checkUser(message, member)) return;

        member.setRoles(luhux.settings.unregisterRoles);
        member.setNickname(`${member.tag()} ${luhux.settings.name}`);

        message.react(await client.getEmoji('check'));
        message.reply({
            embeds: [
                embed.setDescription(
                    `${await client.getEmoji('check')} ${member} (${inlineCode(member.id)}) kullanıcısının şüpheli durumu kaldırıldı!`,
                ),
            ],
        })
    },
};