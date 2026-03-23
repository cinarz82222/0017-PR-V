const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'sendgift',
    Aliases: ['hediyever', 'hediyegönder', 'gift'],
    Description: 'Envanterinizdeki bir hediyeyi başka bir kullanıcıya gönderir.',
    Usage: 'sendgift @kullanıcı',
    Category: 'Economy',
    Cooldown: 10,

    Permissions: { User: [], Role: [] },
    Command: { Prefix: true },

    messageRun: async (client, message, args) => {

        const targetUser = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!targetUser) {
            client.embed(message, `Kullanıcı bulunamadı!`);
            return;
        }

        if (!targetUser) {
            client.embed(message, 'Lütfen hediye göndermek istediğiniz kişiyi etiketleyin! `!hediyever @kullanıcı');
            return;
        }

        if (targetUser.id === message.author.id) {
            client.embed(message, 'Kendinize hediye gönderemezsiniz!');
            return;
        }

        if (targetUser.bot) {
            client.embed(message, ' Botlara hediye gönderemezsiniz!');
            return;
        }

        const userData = await UserModel.findOne({ id: message.author.id });

        if (!userData || !userData.inventory || !userData.inventory.gifts || userData.inventory.gifts.length === 0) {
            client.embed(message, '❓ Envanterinizde gönderilebilecek hediye bulunamadı!');
            return;
        }

        const gifts = userData.inventory.gifts;

        const embed = new EmbedBuilder()
            .setTitle('🎁 Hediyeleriniz')
            .setDescription(`Lütfen göndermek istediğiniz hediyeyi seçin.`)
            .setColor('#FF69B4')
            .setFooter({ text: 'Hediyenizi göndermek için aşağıdaki menüyü kullanın.' })

        gifts.forEach((gift, index) => {
            embed.addFields({
                name: `${index + 1}. ${gift.icon} ${gift.name}`,
                value: `Alınma Tarihi: <t:${Math.floor(new Date(gift.purchaseDate).getTime() / 1000)}:R>`,
                inline: true
            });
        });

        const giftOptions = gifts.map((gift, index) => ({
            label: `${gift.name}`,
            description: `Hediye ID: ${gift.id}`,
            value: `${index}`,
            emoji: gift.icon
        }));

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('gift_select')
                .setPlaceholder('Göndermek istediğiniz hediyeyi seçin')
                .addOptions(giftOptions)
        );

        const response = await message.reply({
            embeds: [embed],
            components: [selectMenu]
        });

        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id && i.customId === 'gift_select',
            time: 60000,
            max: 1
        });

        collector.on('collect', async interaction => {
            const selectedIndex = parseInt(interaction.values[0]);
            const selectedGift = gifts[selectedIndex];

            if (!selectedGift) {
                return interaction.reply({ content: '❌ Seçilen hediye bulunamadı!', ephemeral: true });
            }

            const confirmRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_gift')
                    .setLabel('Hediyeyi Gönder')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎁'),
                new ButtonBuilder()
                    .setCustomId('cancel_gift')
                    .setLabel('İptal')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

            const confirmEmbed = new EmbedBuilder()
                .setTitle('🎁 Hediye Gönderme Onayı')
                .setDescription(`**${targetUser.username}** kullanıcısına **${selectedGift.icon} ${selectedGift.name}** hediyesini göndermek istediğinize emin misiniz?`)
                .setColor('#FF69B4')
                .setFooter({ text: 'Bu işlem geri alınamaz!' })
                .setTimestamp();

            await interaction.update({
                embeds: [confirmEmbed],
                components: [confirmRow]
            });


            const confirmCollector = response.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id && ['confirm_gift', 'cancel_gift'].includes(i.customId),
                time: 30000,
                max: 1
            });

            confirmCollector.on('collect', async confirmInteraction => {
                if (confirmInteraction.customId === 'cancel_gift') {
                    await confirmInteraction.update({
                        embeds: [new EmbedBuilder().setDescription('Hediye gönderme işlemi iptal edildi.').setColor('#FF0000')],
                        components: []
                    });
                    return;
                }

                try {
                    const updatedUserData = await UserModel.findOne({ id: message.author.id });

                    if (!updatedUserData.inventory.gifts || updatedUserData.inventory.gifts.length <= selectedIndex) {
                        return confirmInteraction.update({
                            embeds: [new EmbedBuilder().setDescription('❌ Hediye bulunamadı veya halihazırda gönderilmiş!').setColor('#FF0000')],
                            components: []
                        });
                    }

                    let targetUserData = await UserModel.findOne({ id: targetUser.id });

                    if (!targetUserData) {
                        targetUserData = new UserModel({ id: targetUser.id });
                    }
                    if (!targetUserData.inventory) {
                        targetUserData.inventory = {
                            cash: 0,
                            roelcoin: 0,
                            rings: {},
                            gifts: [],
                            boosters: [],
                            purchaseHistory: []
                        };
                    }

                    if (!targetUserData.inventory.gifts) targetUserData.inventory.gifts = [];

                    const giftToSend = updatedUserData.inventory.gifts.splice(selectedIndex, 1)[0];


                    giftToSend.sentDate = new Date();
                    giftToSend.sentBy = message.author.id;


                    targetUserData.inventory.gifts.push(giftToSend);


                    updatedUserData.markModified('inventory');
                    await updatedUserData.save();

                    targetUserData.markModified('inventory');
                    await targetUserData.save();


                    const successEmbed = new EmbedBuilder()
                        .setTitle('🎁 Hediye Gönderildi!')
                        .setDescription(`**${targetUser.username}** kullanıcısına **${giftToSend.icon} ${giftToSend.name}** hediyeniz başarıyla gönderildi!`)
                        .setColor('#00FF00')
                        .setTimestamp()
                        .setFooter({ text: 'Hediyeniz alıcının envanterine eklendi!' });

                    await confirmInteraction.update({
                        embeds: [successEmbed],
                        components: []
                    });


                    try {
                        const notificationEmbed = new EmbedBuilder()
                            .setTitle('🎁 Yeni Bir Hediye Aldınız!')
                            .setDescription(`**${message.author.username}** size bir hediye gönderdi: **${giftToSend.icon} ${giftToSend.name}**`)
                            .setColor('#FF69B4')
                            .setTimestamp()
                            .setFooter({ text: 'Hediyeniz envanterinize eklendi!' });

                        await targetUser.send({ embeds: [notificationEmbed] });
                    } catch (err) {

                        console.error('Hediye alıcısına DM gönderilemedi:', err);
                        message.channel.send(`${targetUser}, size bir hediye gönderildi! Detaylar için envanterinizi kontrol edin.`);
                    }

                } catch (err) {
                    console.error('Hediye gönderme hatası:', err);
                    await confirmInteraction.update({
                        embeds: [new EmbedBuilder().setDescription('❌ Hediye gönderilirken bir hata oluştu!').setColor('#FF0000')],
                        components: []
                    });
                }
            });

            confirmCollector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({
                        embeds: [new EmbedBuilder().setDescription('⏱️ Onay süresi doldu, işlem iptal edildi.').setColor('#FF0000')],
                        components: []
                    }).catch(console.error);
                }
            });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                response.edit({
                    embeds: [new EmbedBuilder().setDescription('⏱️ Hediye seçim süresi doldu, işlem iptal edildi.').setColor('#FF0000')],
                    components: []
                }).catch(console.error);
            }
        });
    }
};