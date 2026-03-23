const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'streamerbaşvuru',
    Aliases: ['streamer-başvuru'],
    Description: 'Streamer başvuru paneli',
    Usage: 'streamerbaşvuru',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: { User: [], Role: [] },

    Command: { Prefix: true },

    messageRun: async (client, message, args, luhux) => {
        try {
            if (!luhux.settings.streamerRole) return message.channel.send({
                content: `${await client.getEmoji('mark')} Streamer rolü ayarlanmamış.`
            });

            const embed = new EmbedBuilder()
                .setColor('#7f1df6')
                .setTitle('🔴 Streamer Başvuru')
                .setDescription(
                    'Aşağıdaki adımları takip ederek başvurunu yapabilirsin. Bir sorun yaşarsan sunucu yetkililerine ulaş.\n\n' +
                    '**Adımlar:**'
                )
                .addFields(
                    {
                        name: '1️⃣ Hız Testi Yap',
                        value: '[Speedtest](https://www.speedtest.net) sitesine gidip hız testi yap. Sonucu kaydet veya ekran görüntüsü al.',
                        inline: false
                    },
                    {
                        name: '2️⃣ Başvuru Yap',
                        value: 'Hız testini tamamladıktan sonra aşağıdaki **Başvuru Yap** butonuna tıkla.',
                        inline: false
                    },
                    {
                        name: '3️⃣ Formu Doldur',
                        value: 'Açılan forma hız testi linkini yapıştır ve **Gönder** butonuna tıkla.',
                        inline: false
                    },
                    {
                        name: '4️⃣ Rolünü Al',
                        value: 'Başvurun alındıktan sonra şartları sağlaman durumunda **Streamer** rolü otomatik verilecektir.',
                        inline: false
                    }
                )
                .setFooter({ text: 'Adel Was Here ❤️' });

            const row = new ActionRowBuilder({
                components: [
                    new ButtonBuilder({
                        customId: 'streamer:appeal',
                        label: 'Başvuru Yap',
                        style: ButtonStyle.Secondary,
                        emoji: '📺'
                    }),
                    new ButtonBuilder({
                        label: 'Speedtest',
                        style: ButtonStyle.Link,
                        url: 'https://www.speedtest.net/',
                    })
                ]
            });

            message.delete().catch(() => {});

            await message.channel.send({
                content: '\u200B',
                embeds: [embed],
                components: [row]
            });
        } catch (error) {
            console.error('Komut çalıştırılırken hata:', error);
            message.channel.send('Komut çalıştırılırken bir hata oluştu.');
        }
    },
};
