const {
  PermissionsBitField: { Flags },
  bold,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  channelMention,
  ComponentType
} = require('discord.js');

module.exports = {
  Name: 'nuke',
  Aliases: ['nuke'],
  Description: 'Kanalı sıfırlar (tüm mesajları siler gibi). Onaylı sistem.',
  Usage: 'nuke',
  Category: 'Founder',
  Cooldown: 0,

  Permissions: {
    User: [Flags.Administrator],
    Role: []
  },

  Command: {
    Prefix: true,
  },

  messageRun: async (client, message) => {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_nuke')
        .setLabel('✅ Onayla')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_nuke')
        .setLabel('❌ Vazgeç')
        .setStyle(ButtonStyle.Secondary)
    );

    const prompt = await message.reply({
      content: `⚠️ ${bold(`Devam edersen ${channelMention(message.channel.id)} kanalındaki tüm mesajlar kalıcı olarak silinecek. Bu işlem geri alınamaz.`)}\nDevam etmek istediğine emin misin?`,
      components: [row],
    });

    const collector = prompt.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15_000,
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: '❌ Bu butonları yalnızca komutu kullanan kişi tıklayabilir.', ephemeral: true });
      }

      if (interaction.customId === 'cancel_nuke') {
        await interaction.update({ content: '> `❌` _İşlem iptal edildi_', components: [] });
        return collector.stop();
      }

      if (interaction.customId === 'confirm_nuke') {
        const oldChannel = message.channel;
        const { name, topic, nsfw, rateLimitPerUser, type, position, parent, guild } = oldChannel;

        const permissionOverwrites = oldChannel.permissionOverwrites.cache.map(overwrite => ({
          id: overwrite.id,
          allow: overwrite.allow.toArray(),
          deny: overwrite.deny.toArray(),
          type: overwrite.type,
        }));

        await interaction.update({ content: '> _Kanal sıfırlanıyor..._', components: [] });

        await oldChannel.delete();

        const newChannel = await guild.channels.create({
          name,
          type,
          topic,
          nsfw,
          rateLimitPerUser,
          parent,
          permissionOverwrites,
          reason: `${interaction.user.tag} tarafından nuke yapıldı.`
        });

        await newChannel.setPosition(position);

        await newChannel.send(`\`✅\` ${bold(interaction.user.tag)} _tarafından kanal temizlendi. Tüm önceki mesajlar kaldırıldı_`);
        collector.stop();
      }
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        prompt.edit({
          content: '⏱️ Onay süresi doldu. İşlem iptal edildi.',
          components: [],
        });
      }
    });
  }
};
