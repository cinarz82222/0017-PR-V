const { EmbedBuilder } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
  Name: 'evlilik',
  Aliases: ['kocam', 'karım', 'karim', 'sevgilim', 'manitam'],
  Description: 'Evlendiğiniz kişiyi gösterir, tüm bilgileri özel bir tasarım ile sunar.',
  Usage: 'evlilik',
  Category: 'Economy',
  Cooldown: 0,

  Permissions: { User: [], Role: [] },

  Command: { Prefix: true },

  messageRun: async (client, message, args) => {
    let document = await UserModel.findOne({ id: message.author.id });
    if (!document) {
      document = new UserModel({ id: message.author.id });
      await document.save();
    }
    const marriage = document.marriage;

    if (!marriage.active) {
      return client.embed(message, 'Şu anda evli değilsiniz 😢');
    }

    const spouse = await client.users.fetch(marriage.married);
    const startDate = new Date(marriage.date);
    const durationDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const formattedDate = `${startDate.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })} (${durationDays} Gün)`;

    const milestoneNote = `Bugün aşkınızın ${durationDays}. günü! Nice mutlu yıllara 💕`;

    const quotes = [
      'Aşk, iki ruhun tek bir bedende dans etmesidir.',
      'Seninle her an bir ömre bedel.',
      'Kalbim artık seninle atıyor.',
      'Sonsuzluk, seninle geçen bir ömürdür.',
      'Seninle her gün yeniden aşık oluyorum.',
      'Aşkın en güzel melodisi, kalplerimizin uyumudur.',
      'Gözlerin, karanlık bir dünyada bile yolumu aydınlatıyor.',
      'Sen yanımdayken zaman bile duruyor.',
      'Senin gülüşün, ruhumun en tatlı ilacıdır.',
      'Birlikte kurduğumuz hayaller, gerçek oldu.',
      'Zamanın değerini iyi bilin',
      'Ben yapamadım ama siz yapabilirsiniz aşk çaba sever',
    ];
    const romanticQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const ringTypes = {
      ring1: { label: 'Pırlanta' },
      ring2: { label: 'Baget' },
      ring3: { label: 'Tektaş' },
      ring4: { label: 'Tria' },
      ring5: { label: 'Beştaş' }
    };
    const ring = ringTypes[marriage.ring] || { label: 'Bilinmiyor' };

    const embed = new EmbedBuilder()
      .setColor('#ed4245')
      .setTitle('Sonsuz Aşk')
      .setDescription(`**EVLİLİK SERTİFİKASI**\n\n${milestoneNote}\n\n*"${romanticQuote}"*`)
      .setThumbnail(spouse.displayAvatarURL({ format: 'png', size: 256 }))
      .addFields(
        { name: '👤 Sen', value: message.author.username, inline: true },
        { name: '💍 Yüzük', value: ring.label, inline: true },
        { name: '❤️ Eş', value: spouse.username, inline: true }
      )
      .setFooter({ text: `📆 ${formattedDate}`, iconURL: message.author.displayAvatarURL() });

    await message.reply({
      content: `> **${message.author.username}**! **${spouse.username}** ile evlisin 🥂`,
      embeds: [embed]
    });
  }
};
