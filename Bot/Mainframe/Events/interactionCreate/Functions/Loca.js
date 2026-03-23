const { PermissionsBitField: { Flags }, MentionableSelectMenuBuilder, ModalBuilder, TextInputStyle, TextInputBuilder, inlineCode, ActionRowBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const Loca3 = require('../../../../../Global/Settings/Schemas/Loca');
const inviteRegex = /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite)\/([a-zA-Z0-9\-]{2,32})\b/;
const adsRegex = /([^a-zA-ZIıİiÜüĞğŞşÖöÇç\s])+/gi;
const { SettingsModel, UserModel } = require('../../../../../Global/Settings/Schemas');
module.exports = async function Loca(client, interaction, route, luhux) {
    const member = interaction.guild?.members.cache.get(interaction.user.id)
    if (!member) return;
    const settings = await Loca3.findOne({ guildId: interaction.guild.id });
    const data = (await UserModel.findOne({ id: interaction.user.id })) || await new UserModel({ id: interaction.user.id }).save();
    if (route === 'yetkilibaşvuru') {
  const modal = new ModalBuilder()
        .setCustomId('loca:yetkilibasvurumodal')
        .setTitle('Yetkili Başvuru Formu');

      const nameInput = new TextInputBuilder()
        .setCustomId('isim')
        .setLabel('Adın nedir?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const ageInput = new TextInputBuilder()
        .setCustomId('yas')
        .setLabel('Kaç yaşındasın?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const reasonInput = new TextInputBuilder()
        .setCustomId('neden')
        .setLabel('Neden yetkili olmak istiyorsun?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const oldStaffInput = new TextInputBuilder()
        .setCustomId('tecrube')
        .setLabel('Daha önce yetkili oldun mu?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row1 = new ActionRowBuilder().addComponents(nameInput);
      const row2 = new ActionRowBuilder().addComponents(ageInput);
      const row3 = new ActionRowBuilder().addComponents(reasonInput);
      const row4 = new ActionRowBuilder().addComponents(oldStaffInput);

      modal.addComponents(row1, row2, row3, row4);
      return await interaction.showModal(modal);
    }
   if (route === 'yetkilibasvurumodal') {
  const name = interaction.fields.getTextInputValue('isim');
      const age = interaction.fields.getTextInputValue('yas');
      const reason = interaction.fields.getTextInputValue('neden');
      const experience = interaction.fields.getTextInputValue('tecrube');

      const embed = new EmbedBuilder()
        .setTitle('Yeni Yetkili Başvurusu')
        .setColor('Green')
        .addFields(
          { name: 'Kullanıcı', value: `${interaction.user} - \`${interaction.user.id}\`` },
          { name: 'İsim', value: name, inline: true },
          { name: 'Yaş', value: age, inline: true },
          { name: 'Neden Yetkili Olmak İstiyor', value: reason },
          { name: 'Daha Önce Yetkili Oldu mu?', value: experience }
        )
        .setTimestamp();

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('basvuru:onayla')
    .setLabel('Onayla')
    .setStyle(ButtonStyle.Success)
    .setEmoji('✅'),
  new ButtonBuilder()
    .setCustomId('basvuru:reddet')
    .setLabel('Reddet')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('❌')
);

const logChannel = client.channels.cache.get('1383739826938843217');
if (logChannel) {
  await logChannel.send({
    embeds: [embed],
    components: [row]
  });
}

      await interaction.reply({ content: '✅ Başvurun başarıyla alındı. Yönetim seni en kısa sürede değerlendirecek.', ephemeral: true });
   }
    if (route === 'roeloluştur') {
        const userLoca = await Loca3.findOne({ ownerId: interaction.user.id });
        if (!userLoca) {
            return interaction.reply({ content: "> Lütfen menüden bir loca paketi satın alın ve tekrar deneyin.", ephemeral: true });
        }

        if (userLoca.id) {
            return interaction.reply({ content: "> Zaten bir locanız ve kanalınız var. Yeni bir kanal oluşturamazsınız.", ephemeral: true });
        }
        const createRoom = new ModalBuilder()
            .setTitle('Özel Loca Oluştur')
            .setCustomId('loca:createLoca')
            .setComponents(
                new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId("channelName").setLabel("Loca ismini giriniz.").setStyle(TextInputStyle.Short)),
                new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId("channelLimit").setLabel("Limiti giriniz.").setStyle(TextInputStyle.Short)),
            );

        interaction.showModal(createRoom)
    }
    if (route === 'roellimit') {
        const userLoca = await Loca3.findOne({ ownerId: interaction.user.id });
        if (!userLoca) {
            return interaction.reply({ content: '> Özel oda kanalınız bulunamadı.', ephemeral: true });
        }

        const lockChannel = interaction.guild.channels.cache.get(userLoca.id);

        if (!lockChannel) {
            return interaction.reply({ content: '> Veritabanında kayıtlı kanal bulunamadı, işlem gerçekleştirilemiyor.', ephemeral: true });
        }

        let modal = new ModalBuilder()
            .setTitle('Kanalı Düzenle')
            .setCustomId('loca:editchannellocal')
            .setComponents(
                new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId("ChannelName").setLabel("Yeni loca ismini giriniz.").setPlaceholder(`${lockChannel.name}`).setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId("ChannelLimit").setLabel("Yeni limiti giriniz.").setPlaceholder(`${lockChannel.userLimit}`).setStyle(TextInputStyle.Short).setRequired(true)),
            );

        interaction.showModal(modal);
    }

    if (route === 'roelEkle') {
        const userLoca = await Loca3.findOne({ ownerId: interaction.user.id });
        if (!userLoca || userLoca.ownerId !== interaction.user.id) {
            return interaction.reply({ content: 'Bu kanal size ait olmadığı için bu işlemi yapamazsınız.', ephemeral: true });
        }
        const row = new ActionRowBuilder().addComponents(
            new MentionableSelectMenuBuilder()
                .setCustomId('loca:AddUserOrRoleRoel')
                .setPlaceholder('Kullanıcı veya rol seçin')
                .setMinValues(1)
                .setMaxValues(25)
                .addDefaultRoles(
                    (data?.access || []).filter(id => message.guild.roles.cache.has(id))
                )
                .addDefaultUsers(
                    (data?.access || []).filter(id => message.guild.members.cache.has(id))
                )
        );

        await interaction.reply({
            content: 'Kullanıcı veya rol seçin:',
            components: [row],
            ephemeral: true
        });
    }

    if (route === 'reolÇıkar') {
        const userLoca = await Loca3.findOne({ ownerId: interaction.user.id });
        if (!userLoca || userLoca.ownerId !== interaction.user.id) {
            return interaction.reply({ content: 'Bu kanal size ait olmadığı için bu işlemi yapamazsınız.', ephemeral: true });
        }

        const lockChannel = interaction.guild.channels.cache.get(userLoca.id);
        if (!lockChannel) {
            return interaction.reply({ content: 'Kanal bulunamadı.', ephemeral: true });
        }

        const options = [];

        const userPermissions = lockChannel.permissionOverwrites.cache
            .filter(po => {
                return (
                    interaction.guild.members.cache.has(po.id) &&
                    po.id !== userLoca.ownerId
                );
            });

        userPermissions.forEach(po => {
            const member = interaction.guild.members.cache.get(po.id);
            options.push({
                label: member.user.username,
                description: `@${member.user.tag}`,
                value: po.id,
            });
        });

        const rolePermissions = lockChannel.permissionOverwrites.cache
            .filter(po => {
                return interaction.guild.roles.cache.has(po.id) &&
                    po.id !== interaction.guild.id;
            });

        rolePermissions.forEach(po => {
            const role = interaction.guild.roles.cache.get(po.id);
            options.push({
                label: role.name,
                description: `@${role.name} Rolü`,
                value: po.id,
            });
        });

        if (options.length === 0) {
            return interaction.reply({ content: 'Kanalınızda çıkarılacak kullanıcı veya rol bulunmamaktadır.', ephemeral: true });
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId('loca:RemoveUserRoel')
            .setPlaceholder('Çıkarılacak kullanıcı veya rolleri seçin')
            .setMinValues(1)
            .setMaxValues(options.length)
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);

        return interaction.reply({
            content: 'Aşağıdan çıkarmak istediğiniz kullanıcı veya rolleri seçin.',
            components: [row],
            ephemeral: true
        });
    }

    if (route === 'roelListe') {
       
        const userLoca = await Loca3.findOne({ ownerId: interaction.user.id });
        if (!userLoca) {
            return interaction.reply({ content: 'Herhangi bir loca bilgisi bulunamadı.', ephemeral: true });
        }

        let paketBilgisi;
        switch (userLoca.paket) {
            case 1:
                paketBilgisi = "1 günlük paket";
                break;
            case 2:
                paketBilgisi = "15 günlük paket";
                break;
            case 3:
                paketBilgisi = "30 günlük paket";
                break;
            default:
                paketBilgisi = "Bilinmeyen paket";
        }

        const oluşturmaTarihi = `<t:${Math.floor(userLoca.oluşturmatarih / 1000)}:F>`;
        const bitişTarihi = userLoca.bitiştarih
            ? `<t:${Math.floor(userLoca.bitiştarih / 1000)}:F>`
            : "Bilinmiyor";
        let kalanSüre = "Bilinmiyor";
        if (userLoca.bitiştarih) {
            const kalan = userLoca.bitiştarih - Date.now();
            kalanSüre = kalan > 0
                ? `<t:${Math.floor(userLoca.bitiştarih / 1000)}:R>`
                : "Süre dolmuş";
        }

        const bilgiMesajı = `
        ### **Loca Bilgileri:**
        
        - **Paket:** ${paketBilgisi}
        - **Oluşturma Tarihi:** ${oluşturmaTarihi}
        - **Bitiş Tarihi:** ${bitişTarihi}
        - **Kalan Süre:** ${kalanSüre}`;

        interaction.reply({ content: bilgiMesajı, ephemeral: true });

    }
    if (route === 'roelCoinListe') {
        const data = await UserModel.findOne({ id: interaction.user.id }) || await new UserModel({ id: interaction.user.id }).save();
        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }

        const coinMesajı = `
# Roel Coin Bilgileriniz 
        
## ${interaction.user}
        
### Bakiyeniz:
- **💵 Roel Coin:** \`${numberWithCommas(data?.inventory?.roelcoin || 0)}\`
            
### Nasıl Roel Coin Kazanabilirsiniz?
• **Sohbet:** Chat kanallarda aktif mesajlaşarak
• **Sesli Sohbet:** Public Sesli odalarda vakit geçirerek
• **Günlük Ödül:** \`.günlük\` komutu ile günlük bonusunuzu alarak
        
### Roel Coin Satın Al
Daha hızlı ilerlemek için \`Roel Tablosu\` butonunu kullanarak Roel Coin satın alabilirsiniz!
        `;

        interaction.reply({ content: coinMesajı, ephemeral: true });
    }
    if (route === 'roelTablo') {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🪙 ROEL COİN MAĞAZASI 🪙')
            .setDescription(`Özel odalarınızı kişiselleştirmek ve ayrıcalıklardan yararlanmak için Roel Coin paketlerimizi keşfedin!`)
            .addFields(
                {
                    name: '🥉 BRONZ PAKET',
                    value: `> 💰 **1,500 Roel Coin**\n> 💲 ~~59.99 TL~~ **30.99 TL**\n> 🔥 %45 İNDİRİM!`,
                    inline: true
                },
                {
                    name: '🥈 GÜMÜŞ PAKET',
                    value: `> 💰 **5,000 Roel Coin**\n> 💲 ~~120.99 TL~~ **70.99 TL**\n> 🔥 %40 İNDİRİM!`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: '🥇 ALTIN PAKET',
                    value: `> 💰 **15,000 Roel Coin**\n> 💲 ~~185.99 TL~~ **120.99 TL**\n> 🔥 %34 İNDİRİM!`,
                    inline: true
                },
                {
                    name: '💎 ELMAS PAKET',
                    value: `> 💰 **35,000 Roel Coin**\n> 💲 ~~269.99 TL~~ **160.99 TL**\n> 🔥 %40 İNDİRİM!`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: 'ÜCRETSİZ KAZAN',
                    value: `• Sesli kanallarda aktif olarak\n• Public sohbetlere katılarak\n• Haftalık etkinliklerde\n• Günlük giriş bonuslarıyla`,
                    inline: false
                }
            )
            .setFooter({ text: 'Satın alım için bot sahibi ile iletişime geçin' })
            .setTimestamp();

        interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
    if (route === 'roelKomutlar') {
        const userLoca = await Loca3.findOne({ ownerId: interaction.user.id });
        const selectedValue = interaction.values[0];
        const userCoin = data.inventory.roelcoin || 0;

        let paketGün = 0;
        let coinMaliyet = 0;

        switch (selectedValue) {
            case 'birgün':
                paketGün = 1;
                coinMaliyet = 1000;
                break;
            case 'onbeşgün':
                paketGün = 15;
                coinMaliyet = 5000;
                break;
            case 'biray':
                paketGün = 30;
                coinMaliyet = 15000;
                break;
            default:
                return interaction.reply({ content: 'Geçersiz seçim!', ephemeral: true });
        }

        if (userCoin < coinMaliyet) {
            return interaction.reply({
                content: `Bu işlemi gerçekleştirmek için yeterli Roel Coin'iniz yok. Gerekli miktar: **${coinMaliyet} 💰**`,
                ephemeral: true,
            });
        }

        try {
            await UserModel.findOneAndUpdate(
                { _id: data._id },
                { $inc: { 'inventory.roelcoin': -coinMaliyet } },
                { new: true }
            );

            data.inventory.roelcoin -= coinMaliyet;
        } catch (error) {
            console.error('RoelCoin güncelleme hatası:', error);
            return interaction.reply({
                content: 'Coin güncellenirken bir hata oluştu. Lütfen bir yetkiliyle iletişime geçin.',
                ephemeral: true
            });
        }

        let oluşturmaTarihi, bitişTarihi;

        if (userLoca) {
            userLoca.bitiştarih += paketGün * 24 * 60 * 60 * 1000;
            userLoca.paket += paketGün;
            await userLoca.save();

            oluşturmaTarihi = userLoca.oluşturmatarih;
            bitişTarihi = userLoca.bitiştarih;

            await interaction.reply({
                embeds: [
                    {
                        color: 0x00ff00,
                        title: 'Özel Oda Paketi Güncellendi!',
                        description: 'Mevcut özel oda paketinize süre eklediniz. İşte detaylar:',
                        fields: [
                            { name: 'Eklenen Gün', value: `${paketGün} Gün`, inline: true },
                            { name: 'Yeni Bitiş Tarihi', value: `<t:${Math.floor(userLoca.bitiştarih / 1000)}:F>`, inline: true },
                            { name: 'Ödenen Roel Coin', value: `${coinMaliyet} 💰`, inline: true },
                            { name: 'Kalan Roel Coin', value: `${data.inventory.roelcoin} 💰`, inline: true },
                        ],
                        timestamp: new Date(),
                        footer: { text: 'Özel Oda Sistemi' },
                    },
                ],
                ephemeral: true,
            });
        } else {
            oluşturmaTarihi = Date.now();
            bitişTarihi = oluşturmaTarihi + paketGün * 24 * 60 * 60 * 1000;

            const newLoca = new Loca3({
                ownerId: interaction.user.id,
                oluşturmatarih: oluşturmaTarihi,
                paket: paketGün,
                bitiştarih: bitişTarihi,
            });

            await newLoca.save();

            await interaction.reply({
                embeds: [
                    {
                        color: 0x00ff00,
                        title: 'Özel Oda Paketi Satın Alındı!',
                        description: 'Özel oda paketi satın alma işleminiz başarıyla tamamlandı. İşte detaylar:',
                        fields: [
                            { name: 'Satın Alınan Paket', value: `${paketGün} Günlük Paket`, inline: true },
                            { name: 'Ödenen Roel Coin', value: `${coinMaliyet} 💰`, inline: true },
                            { name: 'Kalan Roel Coin', value: `${data.inventory.roelcoin} 💰`, inline: true },
                            { name: 'Satın Alma Tarihi', value: `<t:${Math.floor(oluşturmaTarihi / 1000)}:F>`, inline: true },
                            { name: 'Paket Bitiş Tarihi', value: `<t:${Math.floor(bitişTarihi / 1000)}:F>`, inline: true },
                        ],
                        timestamp: new Date(),
                        footer: { text: 'Özel Oda Sistemi' },
                    },
                ],
                ephemeral: true,
            });
        }
        try {
            const guild = interaction.guild;
            const logChannel = guild.channels.cache.find(c => c.name === 'loca-log');

            if (logChannel) {
                await logChannel.send({
                    embeds: [
                        {
                            color: 0x00ff00,
                            title: 'Yeni Özel Oda Paketi Satın Alındı',
                            description: `Bir kullanıcı özel oda paketi satın aldı!`,
                            fields: [
                                { name: 'Kullanıcı', value: `<@${interaction.user.id}>`, inline: true },
                                { name: 'Satın Alınan Paket', value: `${paketGün} Günlük Paket`, inline: true },
                                { name: 'Harcanan Roel Coin', value: `${coinMaliyet} 💰`, inline: true },
                                { name: 'Kalan Roel Coin', value: `${data.inventory.roelcoin} 💰`, inline: true },
                                { name: 'Satın Alma Tarihi', value: `<t:${Math.floor(oluşturmaTarihi / 1000)}:F>`, inline: true },
                                { name: 'Bitiş Tarihi', value: `<t:${Math.floor(bitişTarihi / 1000)}:F>`, inline: true },
                            ],
                            timestamp: new Date(),
                            footer: { text: 'Özel Oda Sistemi' },
                        },
                    ],
                });
            } else {
                try {
                    const owner = await client.users.fetch(guild.ownerId);
                    if (owner) {
                        await owner.send({
                            embeds: [
                                {
                                    color: 0xffff00,
                                    title: 'Özel Oda Sistemi Log',
                                    description: `'loca-log' kanalı bulunamadı, bu yüzden size gönderiliyor.`,
                                    fields: [
                                        { name: 'Kullanıcı', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                                        { name: 'Satın Alınan Paket', value: `${paketGün} Günlük Paket`, inline: true },
                                        { name: 'Harcanan Coin', value: `${coinMaliyet} 💰`, inline: true },
                                        { name: 'Kalan Coin', value: `${data.inventory.roelcoin} 💰`, inline: true },
                                        { name: 'İşlem Tarihi', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                                    ],
                                },
                            ],
                        });
                    }
                } catch (dmError) {
                    console.error('Sunucu sahibine DM gönderme hatası:', dmError);
                }
            }
        } catch (error) {
            console.error('Log gönderme hatası:', error);
        }
    }
    if (route === 'createLoca') {
        const userLoca = await Loca3.findOne({ ownerId: interaction.user.id });
        const RoomName = interaction.fields.getTextInputValue("channelName");
        const RoomLimit = interaction.fields.getTextInputValue("channelLimit");

        if (inviteRegex.test(RoomName)) return interaction.reply({ content: `Kanal ismi davet içeremez.`, ephemeral: true });
        if (RoomName.length > 25) return interaction.reply({ content: `Kanal ismi 25 karakterden fazla olamaz.`, ephemeral: true });
        if (isNaN(RoomLimit)) return;

        const existingLoca = await Loca3.findOne({ ownerId: interaction.user.id });

        if (existingLoca && existingLoca.id) {
            return interaction.reply({ content: `Zaten bir kanalınız var. Lütfen mevcut kanalınızı kullanın.`, ephemeral: true });
        }
    await interaction.deferReply({ ephemeral: true });
        const channel = await interaction.guild.channels.create({
            name: RoomName,
            type: ChannelType.GuildVoice,
            userLimit: RoomLimit > 99 ? 99 : RoomLimit,
            parent: luhux.settings.locaParent,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [Flags.Connect],
                },
                {
                    id: interaction.user.id,
                    allow: [Flags.ViewChannel, Flags.Connect],
                },
            ],
        });

        existingLoca.id = channel.id;
        await existingLoca.save();


       await interaction.editReply({ content: `> Kanalınız başarıyla oluşturuldu`, ephemeral: true });
    }
    if (route === 'editchannellocal') {
        const userLoca = await Loca3.findOne({ ownerId: interaction.user.id });
        const channel = await interaction.guild.channels.cache.get(userLoca.id);
        const channelName = interaction.fields.getTextInputValue("ChannelName");
        const channelLimit = interaction.fields.getTextInputValue("ChannelLimit");

        await channel.edit({
            name: channelName,
            userLimit: channelLimit > 99 ? 99 : channelLimit,
        });

        interaction.reply({ content: `> Kanalınız başarıyla güncellendi.`, ephemeral: true });
    }
    if (route === 'roelKilitle') {
        const userLoca = await Loca3.findOne({ ownerId: interaction.user.id });
        if (!userLoca || userLoca.ownerId !== interaction.user.id) {
            return interaction.reply({ content: '> Bu kanal size ait olmadığı için bu işlemi yapamazsınız.', ephemeral: true });
        }

        const lockChannel = interaction.guild.channels.cache.get(userLoca.id);
        const currentPermissions = lockChannel.permissionOverwrites.cache.get(interaction.guild.roles.everyone.id);
        const isLocked = currentPermissions && currentPermissions.deny.has(Flags.Connect);
        if (isLocked) {
            await lockChannel.permissionOverwrites.create(interaction.guild.roles.everyone, {
                [Flags.Connect]: true,
            });
            interaction.reply({ content: `> Loca kanalına giriş açıldı`, ephemeral: true });
        } else {
            await lockChannel.permissionOverwrites.create(interaction.guild.roles.everyone, {
                [Flags.Connect]: false,
            });
            interaction.reply({ content: `> Loca kanalına giriş kapatıldı`, ephemeral: true });
        }
    }
    if (route === 'AddUserOrRoleRoel') {
        const userLoca = await Loca3.findOne({ ownerId: interaction.user.id });

        if (userLoca.ownerId !== interaction.user.id) {
            return interaction.reply({ content: 'Bu kanal size ait olmadığı için bu işlemi yapamazsınız.', ephemeral: true });
        }

        let channel = interaction.guild.channels.cache.get(userLoca.id);
        const selectedUsers = interaction.values;

        if (selectedUsers.includes(interaction.user.id)) {
            return interaction.reply({ content: 'Kendinizi ekleyemezsiniz.', ephemeral: true });
        }

        const selectedNames = [];

        for (const id of selectedUsers) {
            const member = interaction.guild.members.cache.get(id);
            const role = interaction.guild.roles.cache.get(id);

            if (member) {
                selectedNames.push(member.user.username);
                await channel.permissionOverwrites.create(member, { ViewChannel: true, Connect: true });
            } else if (role) {
                selectedNames.push(role.name);
                await channel.permissionOverwrites.create(role, { ViewChannel: true, Connect: true });
            }
        }

        const nameText = selectedNames.join(', ');
        const typeText = selectedUsers.length > 1 ? 'kullanıcıları/rolleri' : 'kullanıcısı/rolü';
        const replyMessage = `${inlineCode(nameText)} ${typeText} başarıyla kanala eklendi!`;

        interaction.reply({ content: replyMessage, components: [], ephemeral: true });
    }

    if (route === 'RemoveUserRoel') {
        const userLoca = await Loca3.findOne({ ownerId: interaction.user.id });

        if (userLoca.ownerId !== interaction.user.id) {
            return interaction.reply({ content: 'Bu kanal size ait olmadığı için bu işlemi yapamazsınız.', ephemeral: true });
        }

        let channel = interaction.guild.channels.cache.get(userLoca.id);
        const selectedIds = interaction.values;

        const removedNames = [];

        for (const id of selectedIds) {

            const member = interaction.guild.members.cache.get(id);
            const role = interaction.guild.roles.cache.get(id);

            if (member) {
                removedNames.push(member.user.username);
                await channel.permissionOverwrites.delete(id);
            } else if (role) {
                removedNames.push(role.name);
                await channel.permissionOverwrites.delete(id);
            }
        }

        if (removedNames.length === 0) {
            return interaction.reply({ content: 'Çıkarma işlemi başarısız oldu.', ephemeral: true });
        }

        const nameText = removedNames.join(', ');
        const itemText = removedNames.length > 1 ? 'kullanıcıları/rolleri' : 'kullanıcısı/rolü';
        const replyMessage = `${inlineCode(nameText)} ${itemText} başarıyla kanaldan çıkarıldı!`;

        interaction.reply({ content: replyMessage, components: [], ephemeral: true });
    }
    if (route === 'rozetbilgi') {
        const badges = [
            { name: '👑 Owner', value: '> Yalnızca Adel' },
            { name: '⭐ Aktif Üye', value: '> 30 gün boyunca sunucuda kalanlara.' },
            { name: '⚜️ Veteran', value: '> 90 gün sunucuda kalanlara.' },
            { name: '🏛️ Eski Üye', value: '> 365 gün (1 yıl) sunucuda kalanlara.' },
            { name: '💰 Zengin', value: '> 1000 Roel Coin biriktirenlere.' },
            { name: '💎 Milyoner', value: '> 10.000 Roel Coin biriktirenlere.' },
            { name: '🏆 Şampiyon', value: '> Oyunlarda 500 galibiyet kazananlara.' },
            { name: '📨 Davetçi', value: '> Sunucuya 10 kişi davet edenlere.' },
            { name: '📝 Kayıtçı', value: '> Kayıt görevinde aktif olanlara.' },
            { name: '🍀 Şanslı', value: '> Etkinlik/çekiliş kazananlarına.' },
            { name: '🏅 Özel Rozet', value: '> Sürpriz etkinliklerle verilen özel rozetler.' },
          ];
          
          if (route === 'rozetbilgi') {
            const embed = new EmbedBuilder()
              .setColor('#2e2e4d')
              .setTitle('🏅 Rozet Bilgileri')
              .setDescription('Sunucudaki tüm rozetler ve nasıl kazanılacakları:')
              .addFields(badges.map(b => ({ name: b.name, value: b.value })))
              .setFooter({ text: 'Adel Was Here ❤️' });
            await interaction.reply({ embeds: [embed], ephemeral: true });
          }
        }
}