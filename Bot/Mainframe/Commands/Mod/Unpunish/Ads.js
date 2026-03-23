const { PermissionsBitField: { Flags }, EmbedBuilder, inlineCode, bold } = require('discord.js');
const { PunitiveModel } = require('../../../../../Global/Settings/Schemas/')

module.exports = {
    Name: 'unads',
    Aliases: ['unreklam'],
    Description: 'Reklam yapan kullanıcının cezasını kaldırırsınız.',
    Usage: 'unads <@User/ID>',
    Category: 'Moderation',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, luhux, embed) => {

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            client.embed(message, 'Kullanıcı bulunamadı!')
            return;
        }

        if (!member.roles.cache.has(luhux.settings.adsRole)) {
            client.embed(message, 'Kullanıcının cezası yok.');
            return;
        }

        const reason = args.slice(1).join(' ')
        if (!reason) {
            client.embed(message, 'Geçerli bir sebep belirtmelisiniz.')
            return;
        }

        const document = await PunitiveModel.findOne({ user: member.id, active: true, type: 'Ads' })
        if (!document || !document.roles?.length) {
            if (!luhux.settings.unregisterRoles?.some((r) => message.guild?.roles.cache.has(r))) {
                client.embed(message, 'Kayıtsız rolleri ayarlanmamış.');
                return;
            }

            member.setRoles(luhux.settings.unregisterRoles);
        } else {
            member.setRoles(document.roles);
        }

        await PunitiveModel.updateMany(
            {
                active: true,
                user: member.id,
                type: 'Ads',
            },
            { $set: { active: false, remover: message.author.id, removedTime: Date.now(), removeReason: reason } },
        );

        message.channel.send({
            embeds: [
                embed.setDescription(`${member} kullanıcısının cezası başarıyla kaldırıldı.`),
            ],
        });
    },
};