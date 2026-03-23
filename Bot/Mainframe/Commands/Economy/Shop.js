const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
  Name: 'shop',
  Aliases: ['market'],
  Description: 'Sunucudaki mağaza, yüzükler, hediyeler ve boosterlere özel kategorilerle.',
  Usage: 'shop',
  Category: 'Economy',
  Cooldown: 30,

  Permissions: { User: [], Role: [] },
  Command: { Prefix: true },

  messageRun: async (client, message, args) => {
    const rings = [
      { id: 'ring1', name: 'Pırlanta', icon: '💎', price: 500, emoji: '1366839706674790562', type: 'ring' },
      { id: 'ring2', name: 'Baget', icon: '💍', price: 300, emoji: '1366839701775974532', type: 'ring' },
      { id: 'ring3', name: 'Tektaş', icon: '💎', price: 400, emoji: '1366839705085149285', type: 'ring' },
      { id: 'ring4', name: 'Tria', icon: '💍', price: 450, emoji: '1366839703634055168', type: 'ring' },
      { id: 'ring5', name: 'Beştaş', icon: '💎', price: 600, emoji: '1366839708294053968', type: 'ring' }
    ];

    const gifts = [
      { id: 'gift1', name: 'Çikolata', icon: '🍫', price: 100, type: 'gift' },
      { id: 'gift2', name: 'Çiçek', icon: '🌹', price: 150, type: 'gift' },
      { id: 'gift3', name: 'Öpücük', icon: '💋', price: 200, type: 'gift' }
    ];

    const allItems = [...rings, ...gifts];

    const ringButtons = new ActionRowBuilder().addComponents(
      ...rings.map(item =>
        new ButtonBuilder()
          .setCustomId(`shop_${item.id}_${item.price}`)
          .setLabel(`${item.name}`)
          .setEmoji(item.icon)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    const giftButtons = new ActionRowBuilder().addComponents(
      ...gifts.map(item =>
        new ButtonBuilder()
          .setCustomId(`shop_${item.id}_${item.price}`)
          .setLabel(`${item.name}`)
          .setEmoji(item.icon)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    const ringsList = rings.map(r => `• **${r.name}** — ${r.price} 💰`).join('\n');
    const giftsList = gifts.map(g => `• ${g.icon} **${g.name}** — ${g.price} 💰`).join('\n');

    const embed = new EmbedBuilder()
      .setColor('#8e9ff5')
      .setTitle('Sunucu Mağazası')
      .setDescription('Yüzükler ve hediyeler için aşağıdaki butonları kullanın.')
      .addFields(
        { name: '💍 Yüzükler', value: ringsList, inline: false },
        { name: '🎁 Hediyeler', value: giftsList, inline: false }
      )
      .setFooter({ text: 'Satın almak için butona tıklayın • Adel Was Here ❤️' });

    const shopMessage = await message.reply({
      embeds: [embed],
      components: [ringButtons, giftButtons]
    });

    const filter = i => i.user.id === message.author.id && i.customId.startsWith('shop_');
    const collector = shopMessage.createMessageComponentCollector({ filter, time: 300000 });

    collector.on('collect', async interaction => {
      const [prefix, itemId, price] = interaction.customId.split('_');
      const selectedItem = allItems.find(item => item.id === itemId);

      if (!selectedItem) {
        await interaction.reply({ content: `❌ Ürün bulunamadı. (ID: ${itemId})`, ephemeral: true });
        return;
      }

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_${itemId}`)
          .setLabel('Satın Al')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`cancel_${itemId}`)
          .setLabel('İptal')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({
        content: `**${selectedItem.name}** satın almak istediğinize emin misiniz? Fiyat: **${selectedItem.price}** 💰`,
        components: [confirmRow],
        ephemeral: true
      });

      const confirmFilter = i =>
        i.user.id === message.author.id &&
        ['confirm_', 'cancel_'].some(prefix => i.customId.startsWith(prefix));

      const confirmCollector = interaction.channel.createMessageComponentCollector({
        filter: confirmFilter,
        time: 30000
      });

      confirmCollector.on('collect', async i => {
        const [action, itemId] = i.customId.split('_');
        const item = allItems.find(x => x.id === itemId);

        if (!item) {
          await i.update({ content: `❌ Ürün bulunamadı. (ID: ${itemId})`, components: [] });
          return confirmCollector.stop();
        }

        if (action === 'cancel') {
          await i.update({ content: '❌ Satın alma iptal edildi.', components: [] });
          return confirmCollector.stop();
        }

        try {
          let userData = await UserModel.findOne({ id: message.author.id });

          if (!userData.inventory) {
            userData.inventory = {
              cash: 0,
              roelcoin: 0,
              rings: {},
              gifts: [],
              purchaseHistory: []
            };
          }

          if (!userData.inventory.rings) userData.inventory.rings = {};
          if (!userData.inventory.gifts) userData.inventory.gifts = [];
          if (!userData.inventory.purchaseHistory) userData.inventory.purchaseHistory = [];

          if (!Array.isArray(userData.inventory.gifts)) userData.inventory.gifts = [];
          if (!Array.isArray(userData.inventory.purchaseHistory)) userData.inventory.purchaseHistory = [];

          if (!userData.inventory.cash || userData.inventory.cash < item.price) {
            await i.update({
              content: `❌ Yeterli paranız yok. Gerekli: ${item.price} 💰, Sizde: ${userData.inventory.cash || 0} 💰`,
              components: []
            });
            return confirmCollector.stop();
          }

          userData.inventory.cash -= item.price;
          userData.inventory.purchaseHistory.push({
            id: item.id,
            name: item.name,
            price: item.price,
            date: new Date()
          });

          switch (item.type) {
            case 'ring': {
              const prev = userData.inventory.rings[item.id] || 0;
              userData.inventory.rings[item.id] = prev + 1;
              userData.markModified('inventory');
              await userData.save();

              await i.update({
                content: `✅ **${item.name}** aldınız! Toplam: **${prev + 1}**.`,
                components: []
              });
              break;
            }
            case 'gift': {
              userData.inventory.gifts.push({
                id: item.id,
                name: item.name,
                icon: item.icon,
                purchaseDate: new Date()
              });
              userData.markModified('inventory');
              await userData.save();

              await i.update({
                content: `✅ **${item.name}** hediyeniz inventory'e eklendi.`,
                components: []
              });
              break;
            }
          }
        } catch (err) {
          console.error(err);
          await i.update({
            content: '❌ Satın alma sırasında hata oluştu, lütfen tekrar deneyin.',
            components: []
          });
        }

        confirmCollector.stop();
      });

      confirmCollector.on('end', async collected => {
        if (collected.size === 0) {
          try {
            await interaction.editReply({
              content: '⏱️ Satın alma onayı zaman aşımına uğradı.',
              components: []
            });
          } catch (err) {
            console.error('Yanıt güncellenirken hata:', err);
          }
        }
      });
    });

    collector.on('end', async collected => {
      try {
        const disabledRingButtons = new ActionRowBuilder().addComponents(
          ...ringButtons.components.map(button => ButtonBuilder.from(button).setDisabled(true))
        );
        const disabledGiftButtons = new ActionRowBuilder().addComponents(
          ...giftButtons.components.map(button => ButtonBuilder.from(button).setDisabled(true))
        );

        await shopMessage.edit({
          content: 'Mağaza süresi doldu. Yeniden açmak için komutu tekrar kullanın.',
          embeds: [embed],
          components: [disabledRingButtons, disabledGiftButtons]
        });
      } catch (err) {
        console.error('Mağaza mesajı güncellenirken hata:', err);
      }
    });
  }
};
