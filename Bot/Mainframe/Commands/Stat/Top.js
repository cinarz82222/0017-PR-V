const { ActionRowBuilder, StringSelectMenuBuilder,EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'top',
    Aliases: ['sıralama'],
    Description: 'SSunucudaki en aktif üyeleri sıralar.',
    Usage: 'top',
    Category: 'Statistics',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, luhux, embed) => {

        const titlesAndKeys = {
            messages: { text: 'Mesaj Sıralaması', emoji: '1367441260960550932' },
            voices: { text: 'Ses Sıralaması', emoji: '1367441260960550932' },
            cameras: { text: 'Kamera Sıralaması', emoji: '1367441260960550932' },
            streams: { text: 'Yayın Sıralaması', emoji: '1367441260960550932' },
            register: { text: 'Kayıt Sıralaması', emoji: '1367441260960550932' },
            invites: { text: 'Davet Sıralaması', emoji: '1367441260960550932' },
            staff: { text: 'Yetkili Sıralaması', emoji: '1367441260960550932' },
        }

        const row = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    customId: 'top',
                    placeholder: 'Lütfen bir kategori seçin.',
                    options: Object.keys(titlesAndKeys).map((key) => ({
                        label: titlesAndKeys[key].text,
                        value: key,
                        emoji: titlesAndKeys[key].emoji
                    }))
                })
            ]
        })
        const embedluhux = new EmbedBuilder()
        .setColor('#5865F2')
        .setDescription('> Aşağıdan görmek istediğin sıralama kategorisini seçebilirsin.')
        .setTimestamp();

        const question = await message.channel.send({
            embeds: [embedluhux],
            components: [row],
        });      
     
        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
        });

        collector.on('collect', async (i) => {
            collector.stop();
            i.deferUpdate();
            client.functions.pagination(client, question, i.values[0], message.author.id);
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.functions.timesUp()] });
        });
    },
};
