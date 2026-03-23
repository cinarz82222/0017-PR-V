const { ActivityType, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'spotify',
    Aliases: ['spotify', 'spo'],
    Description: 'Kullanıcının Spotify cihaz bilgisini gösterir.',
    Usage: 'spo <@User/ID>',
    Category: 'General',
    Cooldown: 0,

    Permissions: { User: [], Role: [] },

    Command: { Prefix: true },

    messageRun: async (client, message, args) => {
        await message.channel.sendTyping();

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

        if (member?.presence?.activities?.some(a => a.name === 'Spotify' && a.type === ActivityType.Listening)) {
            const status = member.presence.activities.find(a => a.type === ActivityType.Listening);

            const songName = status.details;
            const artistName = status.state;
            const albumName = status.assets?.largeText || '-';
            const albumArt = `https://i.scdn.co/image/${status.assets.largeImage.slice(8)}`;
            const spotifyTrackId = status.syncId;
            const spotifyUrl = `https://open.spotify.com/track/${spotifyTrackId}`;

            const startTime = new Date(status.timestamps.start).getTime();
            const endTime = new Date(status.timestamps.end).getTime();
            const currentTime = Date.now();
            const elapsedTime = currentTime - startTime;
            const totalDuration = endTime - startTime;

            const formatTime = (ms) => {
                const seconds = Math.floor((ms / 1000) % 60);
                const minutes = Math.floor((ms / (1000 * 60)) % 60);
                return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            };

            const currentTimeFormatted = formatTime(elapsedTime);
            const totalTimeFormatted = formatTime(totalDuration);
            const progressPct = Math.min(100, (elapsedTime / totalDuration) * 100);
            const barLen = 20;
            const filled = Math.round((progressPct / 100) * barLen);
            const progressBar = '▬'.repeat(filled) + '🔘' + '▬'.repeat(barLen - filled);

            const embed = new EmbedBuilder()
                .setColor('#1DB954')
                .setAuthor({ name: 'ŞU ANDA DİNLENİYOR', iconURL: 'https://cdn.discordapp.com/emojis/810982995057508372.png' })
                .setTitle(songName)
                .setDescription(`${artistName}\n${albumName}\n\n\`${progressBar}\`\n${currentTimeFormatted} / ${totalTimeFormatted}`)
                .setThumbnail(albumArt)
                .setFooter({ text: `Dinleyen: ${member.displayName}`, iconURL: member.displayAvatarURL() })
                .setURL(spotifyUrl);

            const spotifyButton = new ButtonBuilder()
                .setLabel('Dinle')
                .setStyle(ButtonStyle.Link)
                .setURL(spotifyUrl);

            const albumUrl = `https://open.spotify.com/search/${encodeURIComponent(albumName + ' ' + artistName)}`;
            const albumButton = new ButtonBuilder()
                .setLabel('Albüm')
                .setStyle(ButtonStyle.Link)
                .setURL(albumUrl);

            const artistButton = new ButtonBuilder()
                .setLabel('Sanatçı')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://open.spotify.com/search/${encodeURIComponent(artistName)}`);

            const row = new ActionRowBuilder().addComponents(spotifyButton, albumButton, artistButton);

            await message.reply({ embeds: [embed], components: [row] });
        } else {
            const errorEmbed = new EmbedBuilder()
                .setDescription('Kullanıcı şu anda Spotify dinlemiyor.')
                .setColor('#E74C3C')
                .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            return message.reply({ embeds: [errorEmbed] });
        }
    }
};
