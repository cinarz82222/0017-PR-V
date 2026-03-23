const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'secretroom',
    Aliases: ['secretrooms', 'gizlioda', 'privateroom'],
    Description: 'Sunucunuzda gizli oda oluşturur.',
    Usage: 'secretroom',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: { User: [], Role: [] },

    Command: { Prefix: true },

    messageRun: async (client, message, args, luhux, embed) => {
        try {
            message.delete().catch(() => {});

            const roomEmbed = new EmbedBuilder()
                .setColor('#7B1FA2')
                .setTitle('Gizli Oda Paneli')
                .setDescription(
                    'Kendine özel bir gizli oda oluştur ve kontrol et!\n\n' +
                    '**Seçenekler:**\n' +
                    '🔄 **İsim/Resim Değiştir** — Odanın adını veya ikonunu değiştir\n' +
                    '🔢 **Limit** — Odaya girebilecek max kişi sayısını ayarla\n' +
                    '🔒 **Kilitle** — Odayı kilitle veya aç\n' +
                    '👁️ **Görünürlük** — Odayı gizle veya göster\n' +
                    '👥 **Üye Yönetimi** — Odana kimlerin gireceğini belirle'
                )
                .setFooter({ text: 'Aşağıdaki butonlarla odanı yönet • Adel Was Here ❤️' });

            const components = [
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({ customId: 'secretroom:change', style: ButtonStyle.Secondary, emoji: '🔄' }),
                        new ButtonBuilder({ customId: 'secretroom:limit', style: ButtonStyle.Secondary, emoji: '🔢' }),
                        new ButtonBuilder({ customId: 'secretroom:lock', style: ButtonStyle.Secondary, emoji: '🔒' }),
                        new ButtonBuilder({ customId: 'secretroom:visible', style: ButtonStyle.Secondary, emoji: '👁️' }),
                        new ButtonBuilder({ customId: 'secretroom:member', style: ButtonStyle.Secondary, emoji: '👥' }),
                    ]
                })
            ];

            await message.channel.send({
                content: '\u200B',
                embeds: [roomEmbed],
                components: components
            });
        } catch (error) {
            console.error('Komut çalıştırılırken hata:', error);
        }
    },
};
