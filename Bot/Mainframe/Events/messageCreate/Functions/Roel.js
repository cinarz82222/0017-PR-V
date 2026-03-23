
const { Events } = require('discord.js');
const { UserModel,SettingsModel } = require('../../../../../Global/Settings/Schemas');
const userMessageCounts = {};

module.exports = {
  Name: Events.MessageCreate,
  System: true,

  execute: async (client, message) => {
    if (message.author.bot) return;
    let luhux;
    try {
        luhux = await SettingsModel.findOne({ guildId: message.guild.id });
        if (!luhux) {
            console.error(`Sunucu ayarları bulunamadı: ${message.guild.id}`);
            return;
        }
    } catch (error) {
        console.error('Ayarlar çekilemedi:', error);
        return;
    }

const chatChannel = message.guild.channels.cache.get(luhux?.settings?.chatChannel) || null;


if (message.channel.id === chatChannel?.id && !message.author.bot) {

      if (!userMessageCounts[message.author.id]) {
        userMessageCounts[message.author.id] = 0;
      }
      userMessageCounts[message.author.id]++;


      if (userMessageCounts[message.author.id] >= 50) {
        try {

          await updateUserCoins(message.author.id, 3);

          await message.react(':moneybag:');

          userMessageCounts[message.author.id] -= 50;
        } catch (error) {
          console.error(`Coin güncelleme hatası (${message.author.id}):`, error);
        }
      }
    }
  }
};

async function updateUserCoins(userId, coins) {
  return UserModel.findOneAndUpdate(
    { id: userId },
    { $inc: { "inventory.roelcoin": coins } },
    { upsert: true, new: true }
  );
}