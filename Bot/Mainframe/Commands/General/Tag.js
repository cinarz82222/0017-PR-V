module.exports = {
    Name: 'tag',
    Aliases: [],
    Description: 'Sunucunun tagını gösterir.',
    Usage: 'tag',
    Category: 'General',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, luhux) => {
        if (!luhux.systems.public) return;

        const tag = luhux.settings.tag;
        message.channel.send(tag || 'Tag ayarlanmamış.');
    }
};