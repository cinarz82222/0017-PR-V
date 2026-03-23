const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'loca',
    Aliases: ['loca'],
    Description: 'Sunucunun özel loca kullanımını gösterir.',
    Usage: 'loca',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: { User: [], Role: [] },

    Command: { Prefix: true },

    messageRun: async (client, message, args, luhux) => {
        try {
            message.delete().catch(() => {});

            const embed = new EmbedBuilder()
                .setColor('#404eed')
                .setTitle('Özel Loca Sistemi')
                .setDescription(
                    '**Özel Loca Sistemi Nedir?**\n\n' +
                    'Kendine özel bir alan oluşturabilir ve tamamen kontrolü ele alabilirsin! Odanda neler olacağına sadece sen karar verirsin. Sen izin vermediğin sürece bu alana **kurucular** bile giremiyor. 🔐'
                )
                .addFields(
                    { name: '🔨 Loca Oluştur', value: 'Hemen kendine özel bir Loca oluştur ve kişiselleştir!', inline: true },
                    { name: '👥 Loca Limit Ayarla', value: 'Locaya maksimum kaç kişinin girebileceğini belirle.', inline: true },
                    { name: '✏️ Loca İsim Ayarla', value: 'Locanı kişiselleştirecek benzersiz bir isim seç.', inline: true },
                    { name: '🔒 Locayı Kilitle/Aç', value: 'İstediğinde kilitle veya herkese aç.', inline: true },
                    { name: '➕ Kullanıcı Ekle', value: 'Locana istediğin arkadaşlarını davet et.', inline: true },
                    { name: '➖ Kullanıcı Çıkar', value: 'İstemediğin kullanıcıları locandan uzaklaştır.', inline: true },
                    {
                        name: '📦 Özel Loca Paketleri',
                        value: '**1 Günlük** — 1000 💰 (Kısa süreli)\n**15 Günlük** — 5000 💰 (Uzun sohbetler)\n**30 Günlük** — 15000 💰 (Sürekli gruplar)',
                        inline: false
                    },
                    {
                        name: '💰 Roel Coin Nasıl Kazanılır?',
                        value: 'Sunucuda aktif olarak vakit geçirerek veya etkinliklere katılarak Roel Coin biriktirebilirsin. Coin Tablosu butonuna göz at!',
                        inline: false
                    },
                    {
                        name: '⚠️ Önemli',
                        value: 'Odanın süresi dolmadan önce mutlaka yenilemeyi unutma!',
                        inline: false
                    }
                )
                .setFooter({ text: 'Adel Was Here ❤️' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Loca Oluştur')
                        .setCustomId('loca:roeloluştur')
                        .setEmoji('➕')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setLabel('Loca Düzenle')
                        .setCustomId('loca:roellimit')
                        .setEmoji('✏️')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setLabel('Loca Kilitle/Aç')
                        .setCustomId('loca:roelKilitle')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Secondary)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Kullanıcı Ekle')
                        .setCustomId('loca:roelEkle')
                        .setEmoji('👤')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setLabel('Kullanıcı Çıkar')
                        .setCustomId('loca:reolÇıkar')
                        .setEmoji('👤')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setLabel('Loca Bilgi')
                        .setCustomId('loca:roelListe')
                        .setEmoji('📋')
                        .setStyle(ButtonStyle.Secondary)
                );

            const row3 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Roel Coin Kontrol')
                        .setCustomId('loca:roelCoinListe')
                        .setEmoji('💰')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setLabel('Roel Coin Tablosu')
                        .setCustomId('loca:roelTablo')
                        .setEmoji('💰')
                        .setStyle(ButtonStyle.Success)
                );

            const row4 = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('loca:roelKomutlar')
                        .setPlaceholder('Özel Loca Süresini Uzat')
                        .addOptions([
                            { label: 'Paketi 1 Gün Uzat', description: '1000 💰', value: 'birgün' },
                            { label: 'Paketi 15 Gün Uzat', description: '5000 💰', value: 'onbeşgün' },
                            { label: 'Paketi 30 Gün Uzat', description: '15000 💰', value: 'biray' },
                        ])
                );

            await message.channel.send({
                content: '\u200B',
                embeds: [embed],
                components: [row, row2, row3, row4]
            });
        } catch (error) {
            console.error(error);
        }
    },
};
