const { Events, Collection } = require("discord.js");
const Loca = require('../../../../../Global/Settings/Schemas/Loca');
const config = require('../../../../../Global/Settings/System');    
module.exports = {
  Name: Events.ClientReady,
  System: true,

  execute: async (client) => {
    setInterval(async () => {
        const currentTime = Date.now();
        
        const expiredLocas = await Loca.find({ bitiştarih: { $lte: currentTime } });

        for (const loca of expiredLocas) {
            const guild = client.guilds.cache.get(config.serverID); 
            if (!guild) continue;

            const channel = guild.channels.cache.get(loca.id); 
            const owner = client.users.cache.get(loca.ownerId); 
            if (channel) {
                await channel.delete().catch(console.error); 
            }
            if (owner) {
                owner.send({
                    embeds: [
                        {
                            color: 0xff0000,
                            title: 'Özel Oda Süreniz Doldu!',
                            description: 'Satın aldığınız özel oda paketinin süresi doldu. Kanalınız silindi.',
                            timestamp: new Date(),
                            footer: { text: 'Özel Oda Sistemi' },
                        },
                    ],
                }).catch(console.error);
            }
            const logChannel = guild.channels.cache.find(c => c.name === 'loca-log') || client.users.cache.get(guild.ownerId);
   
                logChannel.send({
                    embeds: [
                        {
                            color: 0xff0000,
                            title: 'Özel Oda Süresi Doldu!',
                            description: `Bir özel oda süresi dolduğu için silindi.`,
                            fields: [
                                { name: 'Kullanıcı', value: `<@${loca.ownerId}>`, inline: true },
                                { name: 'Kanal ID', value: loca.id, inline: true },
                                { name: 'Bitiş Tarihi', value: `<t:${Math.floor(loca.bitiştarih / 1000)}:F>`, inline: true },
                            ],
                            timestamp: new Date(),
                            footer: { text: 'Özel Oda Sistemi' },
                        },
                    ],
                }).catch(console.error);
            
            await loca.deleteOne().catch(console.error);
        }
    }, 10 * 60 * 1000);
  }
};