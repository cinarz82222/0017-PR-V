const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
  Name: 'inventory',
  Aliases: ['envanter', 'inv'],
  Description: 'Envanterinizi görüntüler: nakit, roelcoin, yüzük, eşyalar, rozetler ve oyun istatistikleri.',
  Usage: 'inventory [user]',
  Category: 'Economy',
  Cooldown: 5,
  Permissions: { User: [], Role: [] },
  Command: { Prefix: true },

  messageRun: async (client, message, args) => {
    try {
      let targetUser = message.author;
      if (args.length > 0) {
        const mentionedUser = message.mentions.users.first() ||
          await client.users.fetch(args[0]).catch(() => null);
        if (mentionedUser) targetUser = mentionedUser;
      }

      const user = await UserModel.findOne({ id: targetUser.id }) || {};
      const loadingMessage = await message.reply({
        content: `> ${targetUser.id === message.author.id ? 'Envanterin' : `${targetUser.username}'in envanteri`} yükleniyor, lütfen bekleyin...`
      });

      const cash = user.inventory?.cash || 0;
      const roelcoin = user.inventory?.roelcoin || 0;

      let ringDisplay = 'Bekar';
      let ringPartner = null;
      if (user.marriage?.active && user.marriage.married) {
        try {
          const spouseMember = await message.guild.members.fetch(user.marriage.married);
          ringDisplay = 'Evli';
          ringPartner = spouseMember.user.username;
        } catch (error) {
          ringDisplay = 'Evli';
        }
      }

      const { currentStreak = 0, maxStreak = 0, totalWins = 0, totalLosses = 0 } = user.games || {};
      const totalGames = totalWins + totalLosses;
      const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

      const level = user.level?.current || 1;
      const exp = user.level?.exp || 0;
      const expNeeded = level * 100;
      const expPercentage = Math.min(Math.round((exp / expNeeded) * 100), 100);

      const itemsList = [];
      const items = user.inventory?.items || [];
      const allItems = { sword: { name: 'Kılıç', icon: '⚔️' }, shield: { name: 'Kalkan', icon: '🛡️' }, potion: { name: 'İksir', icon: '🧪' }, bow: { name: 'Yay', icon: '🏹' } };
      items.forEach(item => {
        const d = allItems[item.id] || { name: item.id, icon: '📦' };
        itemsList.push(`${d.icon} ${d.name} x${item.count || 1}`);
      });
      if (user.inventory?.gifts?.length) {
        const giftMap = { gift1: '🍫 Çikolata', gift2: '🌹 Çiçek', gift3: '💋 Öpücük' };
        user.inventory.gifts.forEach(g => {
          itemsList.push(giftMap[g.id] || `🎁 ${g.name || 'Hediye'}`);
        });
      }
      if (user.marriage?.active && user.marriage.ring) {
        const ringNames = { ring1: 'Pırlanta', ring2: 'Baget', ring3: 'Tektaş', ring4: 'Tria', ring5: 'Beştaş' };
        itemsList.push(`💍 ${ringNames[user.marriage.ring] || 'Yüzük'}`);
      }
      if (itemsList.length === 0) itemsList.push('—');

      const badges = [];
      if (user.day >= 30) badges.push('⭐ Aktif');
      if (user.day >= 90) badges.push('⚜️ Veteran');
      if (user.day >= 365) badges.push('🏛️ Eski Üye');
      if (user.inventory?.roelcoin >= 1000) badges.push('💰 Zengin');
      if (user.inventory?.roelcoin >= 10000) badges.push('💎 Milyoner');
      if (user.games?.totalWins >= 500) badges.push('🏆 Şampiyon');
      if (user.invites?.length >= 10) badges.push('📨 Davetçi');
      if (user.register) badges.push('📝 Kayıtçı');
      if (user.id === '341592492224806914') badges.push('👑 Owner');
      const badgesStr = badges.length ? badges.join(' ') : '—';

      const embed = new EmbedBuilder()
        .setColor('#ff8a00')
        .setTitle('ENVANTER')
        .setThumbnail(targetUser.displayAvatarURL({ extension: 'png', size: 256 }))
        .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
        .addFields(
          {
            name: '💰 Para & Coinler',
            value: `**${cash.toLocaleString('tr-TR')}** Nakit\n**${roelcoin.toLocaleString('tr-TR')}** Roel Coin`,
            inline: true
          },
          {
            name: '❤️ İlişki Durumu',
            value: ringDisplay === 'Evli' && ringPartner ? `${ringDisplay} — **${ringPartner}**` : ringDisplay,
            inline: true
          },
          {
            name: '📊 Oyun İstatistikleri',
            value: `**${currentStreak}** Güncel Seri • **${maxStreak}** Max Seri\n**${totalWins}** Kazanç • **%${winRate}** Kazanma Oranı`,
            inline: false
          },
          {
            name: '🎒 Eşyalar',
            value: itemsList.slice(0, 10).join('\n') + (itemsList.length > 10 ? `\n+${itemsList.length - 10} daha` : ''),
            inline: false
          },
          {
            name: '🏅 Rozetler',
            value: badgesStr,
            inline: false
          }
        )
        .setFooter({ text: `Seviye ${level} • XP: ${exp}/${expNeeded} (${expPercentage}%) • Adel Was Here ❤️` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('loca:rozetbilgi')
          .setLabel('Rozet Bilgisi')
          .setStyle(ButtonStyle.Secondary)
      );

      await loadingMessage.edit({
        content: `${message.author}, ${targetUser.id === message.author.id ? 'envanterin' : `${targetUser.username}'in envanteri`} hazır!`,
        embeds: [embed],
        components: [row]
      });
    } catch (error) {
      console.error('Inventory command error:', error);
    }
  }
};
