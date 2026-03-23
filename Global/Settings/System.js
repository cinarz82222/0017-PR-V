const { ActivityType } = require('discord.js');

module.exports = {
    // NOT: Degerleri public'a koyma; yerelde doldur.
    serverID: '',
    serverName: '',
    ownerID: [],
    channelID: '',
    // MongoDB connection string'i gizlidir.
    database: '',

    Presence: {
        Status: 'idle',
        Type: ActivityType.Playing,
        Message: [
            'Adel Was Here ❤️',
        ]
    },

    Monitor: [
        { ID: 'System', Webhook: '' },
        { ID: 'Servers', Webhook: '' }, 
        { ID: 'Feedbacks', Webhook: '' },
        { ID: 'Bugs', Webhook: '' },
    ],

    Main: {
        // Discord bot tokenlari gizlidir.
        Mainframe: '',
        Elixir: '',
        Point: '',
        Prefix: ['.'],
    },

    Welcome: {
        Tokens: [],
        Channels: [],
    },

    Security: {
        // Discord bot tokenlari gizlidir.
        Logger: '',
        Punish: '',
        Backup: '',
        Dists: [],
        BotsIDs: [],
        Prefix: '!'
    }
};