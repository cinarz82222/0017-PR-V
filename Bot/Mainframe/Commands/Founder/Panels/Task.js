const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    Name: 'görevpanel',
    Aliases: ['görev-panel'],
    Description: 'Görev paneli',
    Usage: 'görevpanel',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, luhux) => {

        const ilision = new EmbedBuilder({
            thumbnail: { url: message.guild.iconURL({ dynamic: true, size: 2048 }) },
            title: 'Görev Seçme Sistemi',
            description: [
                `Merhaba! Aşağıdaki butonlardan sunucudaki görevlerinizi seçebilirsiniz. Bot komut odasından '.görev' komutunu kullanarak görevlerinizi takip edebilirsiniz.`,
                '',
                `- Streamer Görevi`,
                `- Public Görevi`,
                `- Chat Görevi`,
                `- Yetkili Alım Görevi`,
                '',
                `Aşağıda ki butona basarak eğer görevlerinizi almadıysanız görevlerinizi alabilirsiniz.`,
            ].join('\n'),
        });

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'task:streamer',
                    label: 'Streamer Görevi',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    custom_id: 'task:public',
                    label: 'Public Görevi',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    custom_id: 'task:message',
                    label: 'Mesaj Görevi',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    custom_id: 'task:staff',
                    label: 'Yetkili Alım Görevi',
                    style: ButtonStyle.Secondary,
                }),
            ]
        })

        message.channel.send({ embeds: [ilision], components: [row] });
    },
};