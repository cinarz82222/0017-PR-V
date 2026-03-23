const { ChannelType, inlineCode } = require('discord.js');

module.exports = {
    Name: 'welcome',
    Aliases: ['welcom', 'hoşgeldin', 'girişkanal', 'kayıtkanal'],
    Description: 'Giriş-çıkış (kayıt) mesajlarının gönderileceği kanalı ayarlar.',
    Usage: 'welcome [#kanal]',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: { User: [], Role: [] },

    Command: { Prefix: true },

    messageRun: async (client, message, args, luhux) => {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;

        if (channel.type !== ChannelType.GuildText) {
            return message.reply({ content: `${await client.getEmoji('mark')} Lütfen bir metin kanalı belirt.` });
        }

        await message.guild.updateSettings({ $set: { 'settings.registerChannel': channel.id } });
        message.guild.find.settings.registerChannel = channel.id;

        return message.reply({
            content: `${await client.getEmoji('check')} Giriş-çıkış kanalı ${channel} olarak ayarlandı. Hoş geldin mesajları bu kanala gönderilecek.`
        });
    },
};
