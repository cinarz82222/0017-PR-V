const { PermissionsBitField: { Flags }, ActionRowBuilder, ButtonBuilder, ButtonStyle, codeBlock } = require('discord.js');

module.exports = {
    Name: 'yetkilidenetim',
    Aliases: ['staffsay', 'ysay', 'ytsay'],
    Description: 'Sunucudaki yetkilileri kontrol eder.',
    Usage: 'ysay',
    Category: 'Advanced',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, luhux) => {

        const minStaffRole = message.guild?.roles.cache.get(luhux.settings.minStaffRole)
        if (!minStaffRole) return client.embed(message, 'Sunucuda yetkili rolü bulunamadı.');

        const members = await message.guild?.members.fetch();
        if (!members) return;

        const staffMembers = members.filter((m) => m.roles.highest.position >= minStaffRole.position && !m.user.bot);

        const sub = [];
        const middle = [];
        const top = [];

        staffMembers.forEach((member) => {
            const { type } = client.staff.getRank(member, luhux);
            if (!type) return;

            if (type === 'sub') sub.push(member);
            if (type === 'middle') middle.push(member);
            if (type === 'top') top.push(member);
        });

        const topLength = top.length;
        const middleLength = middle.length;
        const subLength = sub.length;

        const topNoVoice = top.filter(m => !m.voice.channelId && m.presence && m.presence.status !== 'offline');
        const middleNoVoice = middle.filter(m => !m.voice.channelId && m.presence && m.presence.status !== 'offline');
        const subNoVoice = sub.filter(m => !m.voice.channelId && m.presence && m.presence.status !== 'offline');

        const mentionsTopNoVoice = topNoVoice.map(m => m.toString()).join(', ');
        const mentionsMiddleNoVoice = middleNoVoice.map(m => m.toString()).join(', ');
        const mentionsSubNoVoice = subNoVoice.map(m => m.toString()).join(', ');

        const messageContent = [
            `Üst Yönetim: ${topLength} kişi`,
            `Ses Kanalında Olmayanlar: ${topNoVoice.length} kişi`,
            mentionsTopNoVoice.length ? mentionsTopNoVoice : 'Üst Yönetimde ses kanalında olmayan kimse yok.',
            '-------------------------------------------',
            `Orta Yönetim: ${middleLength} kişi`,
            `Ses Kanalında Olmayanlar: ${middleNoVoice.length} kişi`,
            mentionsMiddleNoVoice.length ? mentionsMiddleNoVoice : 'Orta Yönetimde ses kanalında olmayan kimse yok.',
            '-------------------------------------------',
            `Alt Yönetim: ${subLength} kişi`,
            `Ses Kanalında Olmayanlar: ${subNoVoice.length} kişi`,
            mentionsSubNoVoice.length ? mentionsSubNoVoice : 'Alt Yönetimde ses kanalında olmayan kimse yok.',
            '-------------------------------------------',
        ].join('\n');

        const splitMessage = client.functions.splitMessage(messageContent, { maxLength: 2000 });

        splitMessage.forEach((content) => {
            message.channel.send({ content });
        });
    },
};