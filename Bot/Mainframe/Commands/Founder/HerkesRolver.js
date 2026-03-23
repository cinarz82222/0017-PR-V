const { ActionRowBuilder, RoleSelectMenuBuilder, ComponentType } = require('discord.js');

module.exports = {
    Name: 'herkeserolver',
    Aliases: ['herkeserol', 'herkesrolver', 'toplurol', 'massrole'],
    Description: 'Sunucudaki herkese (veya sadece taglılara) rol verir. Kullanım: .herkeserolver [tagla]',
    Usage: 'herkeserolver [tagla]',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: { User: [], Role: [] },

    Command: { Prefix: true },

    messageRun: async (client, message, args, luhux) => {
        const tagla = args.some(a => ['tagla', 'taglı', 'tagli'].includes(a.toLowerCase()));

        const row = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('herkeserolver_select')
                .setPlaceholder('Verilecek rolü seç')
                .setMaxValues(1)
        );

        const msg = await message.channel.send({
            content: tagla
                ? `**Taglı modu aktif** — Sadece ${luhux.settings?.tag ? `"${luhux.settings.tag}"` : 'taglı'} kullanıcılara rol verilecek.\nRol seç:`
                : 'Sunucudaki **herkese** verilecek rolü seç:',
            components: [row]
        });

        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000, componentType: ComponentType.RoleSelect });

        collector.on('collect', async (i) => {
            const role = message.guild.roles.cache.get(i.values[0]);
            if (!role) return i.reply({ content: 'Rol bulunamadı.', ephemeral: true });

            if (role.position >= message.guild.members.me.roles.highest.position) {
                return i.reply({ content: `${await client.getEmoji('mark')} Bu rol benim rolümden yüksekte, veremem.`, ephemeral: true });
            }

            let members = message.guild.members.cache.filter(m => !m.user.bot && m.manageable);
            if (tagla && luhux.settings?.tag) {
                const tag = luhux.settings.tag;
                members = members.filter(m => m.user.displayName.includes(tag));
            }

            const total = members.size;
            if (total === 0) {
                return i.reply({ content: `${await client.getEmoji('mark')} Rol verilecek üye bulunamadı.${tagla ? ' (Taglı üye yok)' : ''}`, ephemeral: true });
            }

            await i.deferReply();
            let given = 0;
            for (const [, m] of members) {
                if (!m.roles.cache.has(role.id)) {
                    await m.roles.add(role).catch(() => null);
                    given++;
                }
            }

            await i.editReply({
                content: `${await client.getEmoji('check')} ${role} rolü **${given}** kişiye verildi.${tagla ? ' (Sadece taglı üyelere)' : ''}`
            });
            await msg.edit({ components: [] });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') msg.edit({ components: [] }).catch(() => null);
        });
    },
};
