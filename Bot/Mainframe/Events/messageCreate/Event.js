const { commandHandler, afkHandler, specialHandler, complimentHandler } = require('./Functions')
const { Events } = require('discord.js')

module.exports = {
    Name: Events.MessageCreate,
    System: true,

    execute: async (client, message) => {
        if (!message.guild || message.author.bot || !message.content) return;

        const luhux = message.guild?.find

        if (luhux?.settings?.photoChannels.includes(message.channel.id) && message.attachments.size === 0) return message.delete().catch(err => { })
        if (message.activity && message.activity.partyId.startsWith('spotify:')) return message.delete().catch(err => { })

        const prefixes = [...client.system.Main.Prefix, `<@${client.user.id}>`, `<@!${client.user.id}>`]
        const prefix = prefixes.find((p) => message.content.startsWith(p))

        commandHandler(client, message, prefix)
        afkHandler(client, message, prefix)
        complimentHandler(client, message, luhux)  
        specialHandler(client, message, prefix, luhux)
    }
};