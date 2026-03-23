const { EmbedBuilder } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
  Name: 'daily',
  Aliases: ['günlük', 'günlükpara', 'dailycoin'],
  Description: 'Sunucudaki Günlük Hediyenizi Alırsınız.',
  Usage: 'daily',
  Category: 'Economy',
  Cooldown: 86400,
  Permissions: { User: [], Role: [] },
  Command: { Prefix: true },

  messageRun: async (client, message, args) => {
    try {
      const userData = await UserModel.findOne({ id: message.author.id }) || {};

      const lastDailyTime = userData.lastDailyTime || 0;
      const currentTime = new Date().setHours(0, 0, 0, 0);
      const dayDifference = Math.floor((currentTime - lastDailyTime) / (24 * 60 * 60 * 1000));

      let dailyStreak = userData.dailyStreak || 0;

      if (dayDifference === 1) {
        dailyStreak += 1;
      } else if (dayDifference > 1) {
        dailyStreak = 1;
      } else if (dayDifference === 0) {
      }

      const dailyCash = Math.floor(Math.random() * (5000 - 100)) + 100;
      const dailyRoelCoin = Math.floor(Math.random() * (100 - 10 + 1)) + 10;

      const currentDate = new Date().toLocaleDateString('tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      const embed = new EmbedBuilder()
        .setColor('#1f202c')
        .setTitle('GÜNLÜK ÖDÜL')
        .setDescription('Ödülünü topla ve ekonomide yüksel!')
        .setThumbnail(message.author.displayAvatarURL({ extension: 'png', size: 256 }))
        .addFields(
          {
            name: '💵 NAKİT BONUS',
            value: `**${dailyCash}$**`,
            inline: true
          },
          {
            name: '🪙 ROEL COIN',
            value: `**${dailyRoelCoin}**`,
            inline: true
          },
          {
            name: '📅 Günlük Seri',
            value: `**${dailyStreak}** gün`,
            inline: false
          },
          {
            name: 'Toplama Tarihi',
            value: currentDate,
            inline: true
          },
          {
            name: 'Sonraki Ödül',
            value: '**24 saat** sonra',
            inline: true
          }
        )
        .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
        .setFooter({ text: 'Adel Was Here ❤️' });

      await message.reply({
        content: `> ${message.author}, günlük ödülünüzü başarıyla aldınız!`,
        embeds: [embed]
      });

      await UserModel.updateOne(
        { id: message.author.id },
        {
          $inc: { 'inventory.cash': dailyCash, 'inventory.roelcoin': dailyRoelCoin },
          $set: {
            dailyStreak: dailyStreak,
            lastDailyTime: currentTime
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Daily reward error:', error);
    }
  }
};
