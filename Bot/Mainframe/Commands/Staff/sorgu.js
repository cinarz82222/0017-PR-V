const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, codeBlock } = require('discord.js');
const axios = require('axios');

module.exports = {
    Name: 'sorgu',
    Aliases: ['sorgu'],
    Description: 'Kullanıcının Genel Discord profilini gösterir.',
    Usage: 'sorgu <@kullanıcı/ID>',
    Category: 'Staff',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args) => {
        const user = message.mentions.users.first() || client.users.cache.get(args[0]);
        if (!user) return message.reply({ content: '> Lütfen bir kullanıcı belirtin.' });

        const data = await getUserData(user.id);
        if (data.error) return 
        const pages = [];
        const userInfo = data.UserInfo;
        const codeBlockContent = [
            codeBlock('yaml', [
                `→ Kullanıcı ID: ${userInfo.UserID}`,
                `→ Durum: ${userInfo.Presence?.Status || 'Yok'}`,
                `→ Yaş: ${data.TopAge || 'Bilinmiyor'}`,
            ].join('\n')),
            codeBlock('ansi', [
                '# Ek Bilgiler',
                `→ Global Ad: ${userInfo.UserGlobalName || 'Yok'}`,
                `→ İsim: ${data.TopName || 'Bilinmiyor'}`,
            ].join('\n'))
        ].join('\n\n');

        const embed1 = new EmbedBuilder()
            .setTitle(`${userInfo.UserName} Kullanıcı Bilgileri`)
            .setThumbnail(userInfo.UserdisplayAvatar)
            .setColor('#2f3136')
            .addFields(
                { name: 'Detaylı Bilgiler', value: codeBlockContent }
            );

        if (userInfo.UserBanner && !userInfo.UserBanner.includes('singlecolorimage.com')) {
            embed1.setImage(userInfo.UserBanner);
        }

        pages.push(embed1);

        const ah = data.ActiveHours;
        const aktiflikYaml = [
            `Toplam Aktiflik: ${ah.totalActiveHours?.toString() || '0 saat'}`,
            `Özet: ${ah.summary || 'Yok'}`
        ].join('\n');

        const aktiflikAnsi = [
            '# Aktiflik Detayları',
            `Toplam Saat: ${ah.totalActiveHours?.toString() || '0 saat'}`,
            `Özet Bilgi: ${ah.summary || 'Yok'}`
        ].join('\n');

        const embed2 = new EmbedBuilder()
            .setTitle('Aktiflik Bilgileri')
            .setColor('Blurple')
            .addFields(
                {
                    name: 'Detaylı Aktiflik',
                    value: codeBlock('yaml', aktiflikYaml) + '\n' + codeBlock('ansi', aktiflikAnsi),
                    inline: false
                }
            )
            .setFooter({ text: 'Sayfa 2/6 - Aktiflik', iconURL: user.displayAvatarURL() });

        pages.push(embed2);

        const embed3 = new EmbedBuilder()
            .setTitle('Sunucu İstatistikleri')
            .setColor('Gold');
        for (const guild of data.GuildStats) {
            const yamlBlock = [
                `→ İsim: ${guild.GuildName}`,
                `→ Ses Süresi: ${guild.VoiceStatText}`,
                `→ Mesaj Sayısı: ${guild.MessageStat}`
            ].join('\n');

            embed3.addFields({
                name: guild.GuildName,
                value: codeBlock('yaml', yamlBlock),
                inline: false
            });
        }

        embed3.setFooter({ text: 'Sayfa 3/6 - Sunucu İstatistikleri', iconURL: user.displayAvatarURL() });
        pages.push(embed3);
        const embed4 = new EmbedBuilder()
            .setTitle('Yetkili Olduğu Sunucular')
            .setColor('Green');

        if (data.GuildStaff.length === 0) {
            embed4.setDescription('Kullanıcı hiçbir sunucuda yetkili değil.');
        } else {
            for (const staff of data.GuildStaff) {
 
                const ansiBlock = [
                    '# Yetkili Sunucu Bilgileri',
                    `→ Sunucu: ${staff.GuildName}`,
                    `→ İsim: ${staff.displayName}`,
                    `→ ID: ${staff.GuildId}`
                ].join('\n');

                embed4.addFields({
                    name: staff.GuildName,
                    value: codeBlock('yaml', ansiBlock),
                    inline: false
                });
            }
        }

        embed4.setFooter({ text: 'Sayfa 4/6 - Yetkili Olduğu Sunucular', iconURL: user.displayAvatarURL() });
        pages.push(embed4);

        const embed5 = new EmbedBuilder()
            .setTitle('Üye Olduğu Sunucular')
            .setColor('Aqua');

        for (const g of data.Guilds) {
            const ansiBlock = [
                '# Üyelik Bilgileri',
                `→ Sunucu: ${g.GuildName}`,
                `→ Takma Ad: ${g.displayName}`,
                `→ Katılım Tarihi: ${g.JoinTime}`,
                `→ Booster: ${g.Booster ? 'Evet' : 'Hayır'}`
            ].join('\n');

            embed5.addFields({
                name: g.GuildName,
                value: codeBlock('yaml', ansiBlock),
                inline: false
            });
        }

        embed5.setFooter({ text: 'Sayfa 5/6 - Üyelikler', iconURL: user.displayAvatarURL() });
        pages.push(embed5);



        const embed6 = new EmbedBuilder()
            .setTitle('Son Görülme Bilgisi')
            .setColor('DarkRed')
            .setThumbnail(user.displayAvatarURL());

        const messageLastSeen = data.LastSeen?.Message?.[0] || null;
        const voiceLastSeen = data.LastSeen?.Voice?.[0] || null;

        const messageBlock = messageLastSeen?.channelName
            ? [
                `channelName: ${messageLastSeen.channelName}`,
                `date: ${messageLastSeen.date}`
            ].join('\n')
            : 'Yok';

        const voiceBlock = voiceLastSeen?.channelName
            ? [
                `channelName: ${voiceLastSeen.channelName}`,
                `date: ${voiceLastSeen.date}`
            ].join('\n')
            : 'Yok';

        embed6.addFields(
            {
                name: 'Mesaj Kanalı',
                value: codeBlock('yaml', messageBlock),
                inline: true
            },
            {
                name: 'Ses Kanalı',
                value: codeBlock('yaml', voiceBlock),
                inline: true
            }
        );

        embed6.setFooter({ text: 'Sayfa 6/6 - Son Görülme', iconURL: user.displayAvatarURL() });
        pages.push(embed6);


        let page = 0;
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev').setLabel('◀️ Geri').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('next').setLabel('İleri ▶️').setStyle(ButtonStyle.Secondary)
        );

        const msg = await message.channel.send({ embeds: [pages[page]], components: [row] });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 120000
        });

        collector.on('collect', async i => {
            await i.deferUpdate();
            if (i.customId === 'next') page = (page + 1) % pages.length;
            if (i.customId === 'prev') page = (page - 1 + pages.length) % pages.length;
            await msg.edit({ embeds: [pages[page]] });
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => { });
        });
    }
};

async function getUserData(UserID) {
    if (!UserID) return { error: 'UserID belirtilmelidir.' };

    try {
        const authHeader = process.env.FINDCORD_AUTHORIZATION;
        if (!authHeader) {
            return { error: 'API yetki anahtarı eksik (FINDCORD_AUTHORIZATION). Local .env ile tanımlayın.' };
        }

        const response = await axios.get(`https://app.findcord.com/api/user/${UserID}`, {
            headers: {
                'Authorization': authHeader,
            },
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return { error: `Sunucu hatası: ${error.response.status} - ${error.response.data?.message || 'Bilinmeyen hata'}` };
        } else if (error.request) {
            return { error: 'Sunucudan yanıt alınamadı.' };
        } else {
            return { error: `İstek hatası: ${error.message}` };
        }
    }
}
