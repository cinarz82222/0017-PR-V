const { Events } = require('discord.js');
const { UserModel, SettingsModel } = require('../../../../../Global/Settings/Schemas');

const userVoiceTracking = new Map();

module.exports = {
    Name: Events.VoiceStateUpdate,
    System: true,

    execute: async (oldState, newState) => {
        if (newState.member.user.bot) return;

        let settings;
        try {
            settings = await SettingsModel.findOne({ guildId: newState.guild.id });
            if (!settings) {
                console.error(`Sunucu ayarları bulunamadı: ${newState.guild.id}`);
                return;
            }
        } catch (error) {
            console.error('Ayarlar çekilemedi:', error);
            return;
        }

        const allowedCategoryId = settings.settings.publicParent;
        console.log(allowedCategoryId);
        if (!allowedCategoryId) {
            console.error('Geçerli ses kategori idsi ayarlarda tanımlı değil.');
            return;
        }

        const isAllowed = (channel) => channel && channel.parentId === allowedCategoryId;

        const userId = newState.id;
        const oldChannel = oldState.channel;
        const newChannel = newState.channel;

        if (oldChannel && isAllowed(oldChannel) && (!newChannel || !isAllowed(newChannel))) {
            userVoiceTracking.delete(userId);
            return;
        }
        if (newChannel && isAllowed(newChannel)) {
            const now = Date.now();
            if (!userVoiceTracking.has(userId)) {
                userVoiceTracking.set(userId, {
                    guildId: newState.guild.id,
                    channelId: newChannel.id,
                    joinTime: now,
                    lastAwardTime: now
                });
            } else {
                const tracking = userVoiceTracking.get(userId);
                tracking.channelId = newChannel.id;
            }
        }
    }
};

setInterval(async () => {
    const now = Date.now();
    for (const [userId, tracking] of userVoiceTracking.entries()) {
        const elapsed = now - tracking.lastAwardTime;
        if (elapsed >= 3600000) { 
            try {
                await updateUserCoins(userId, 50);
                tracking.lastAwardTime = now;
                console.log(`Kullanıcı ${userId} ses odasında 1 saat kaldığı için 50 coin ödülü aldı.`);
            } catch (error) {
                console.error(`Coin güncelleme hatası (${userId}):`, error);
            }
        }
    }
}, 60000);

async function updateUserCoins(userId, coins) {
    return UserModel.findOneAndUpdate(
        { id: userId },
        { $inc: { "inventory.roelcoin": coins } },
        { upsert: true, new: true }
    );
}
