const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'streamerpanel',
    Aliases: ['streamer-panel'],
    Description: 'Streamer yönetim paneli',
    Usage: 'streamerpanel',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: { User: [], Role: [] },

    Command: { Prefix: true },

    messageRun: async (client, message) => {
        try {
            await message.delete().catch(() => {});

            const serverName = client.guilds.cache.first()?.name || 'Valoria';

            const embed = new EmbedBuilder()
                .setColor('#7B61FF')
                .setTitle('Yayıncı Odası Düzenleme Paneli')
                .setDescription(
                    `Merhaba, **${serverName}** yayıncı paneline hoşgeldiniz.\n\n` +
                    'Sunucumuzda bulunan **Yayıncı Odaları** için düzenleme yapmak istiyorsanız, aşağıdaki seçeneklerden birini kullanın.'
                )
                .addFields(
                    { name: '▶ Odayı Sahiplen', value: 'Bu seçeneği kullanmak için tıklayın.', inline: false },
                    { name: '🔄 Oda Sahipliğini Aktar', value: 'Bu seçeneği kullanmak için tıklayın.', inline: false },
                    { name: '👥 Odaya İzin Ekle/Çıkar', value: 'Bu seçeneği kullanmak için tıklayın.', inline: false },
                    { name: '⚙ Oda Ayarları', value: 'Bu seçeneği kullanmak için tıklayın.', inline: false }
                )
                .setFooter({ text: 'made by Adel ❤️' });

            const row = new ActionRowBuilder({
                components: [
                    new ButtonBuilder({ customId: 'streamerRoom:claim', label: 'Odayı Sahiplen', style: ButtonStyle.Success }),
                    new ButtonBuilder({ customId: 'streamerRoom:owner', label: 'Oda Sahipliğini Aktar', style: ButtonStyle.Primary }),
                    new ButtonBuilder({ customId: 'streamerRoom:permission', label: 'Odaya İzin Ekle/Çıkar', style: ButtonStyle.Primary }),
                    new ButtonBuilder({ customId: 'streamerRoom:settings', label: 'Oda Ayarları', style: ButtonStyle.Secondary }),
                ]
            });

            await message.channel.send({ content: '\u200B', embeds: [embed], components: [row] });
        } catch (error) {
            console.error(error);
        }
    },
};
