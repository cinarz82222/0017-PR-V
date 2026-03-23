const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require('discord.js');

module.exports = {
  Name: 'yetkilibaşvuru',
  Aliases: [],
  Description: 'Yetkili başvuru formu gönderir.',
  Usage: 'yetkilibaşvuru',
  Category: 'Founder',
  Cooldown: 0,

  Permissions: {
    User: [],
    Role: []
  },

  Command: {
    Prefix: true,
  },

  messageRun: async (client, message, args, luhux) => {
    const embed = new EmbedBuilder()
      .setTitle('Yetkili Başvuru Sistemi')
      .setDescription(`Yetkili olmak istiyorsan aşağıdaki butona tıklayarak başvuru formunu doldurabilirsin.`)

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('loca:yetkilibaşvuru')
        .setLabel('Başvuru Yap')
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({ embeds: [embed], components: [button] });
  },
};
