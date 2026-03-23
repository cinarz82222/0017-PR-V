const { PermissionsBitField: { Flags }, bold, inlineCode, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    Name: 'stat',
    Aliases: ['verilerim', 'stats'],
    Description: 'Istatistiklerinizi gösterir.',
    Usage: 'stat',
    Category: 'Statistics',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, luhux, embed) => {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) {
            client.embed(message, `Kullanıcı bulunamadı!`);
            return;
        }

        if (member.user.bot) {
            client.embed(message, 'Botların verisi bulunamaz!');
            return;
        }

        const document = await member.stats(args[0] ? Number(args[0]) : undefined);
        if (!document) {
            client.embed(message, 'Veri bulunmuyor.');
            return;
        }

        const argIndex = member.id !== message.author.id ? 1 : 0;
        const wantedDay = args[argIndex] ? Number(args[argIndex]) : document.day;
        if (!wantedDay || 0 >= wantedDay) {
            client.embed(message, 'Geçerli gün sayısı belirt!');
            return;
        };

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`stat_daily_${member.id}`)
                    .setLabel('Günlük')
                    .setEmoji('1367445172216008786')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`stat_weekly_${member.id}`)
                    .setLabel('Haftalık')
                    .setEmoji('1367445172216008786')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`stat_monthly_${member.id}`)
                    .setLabel('Aylık')
                    .setEmoji('1367445172216008786')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`stat_custom_${member.id}`)
                    .setEmoji('🔎')
                    .setStyle(ButtonStyle.Secondary),
            );

        await sendStatEmbed(client, message, member, document, wantedDay, embed, buttons);
        const collector = message.channel.createMessageComponentCollector({ time: 180000 });

        collector.on('collect', async (interaction) => {
            if (!interaction.customId.startsWith('stat_')) return;
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: 'Bu butonu sadece komutu kullanan kişi kullanabilir!', ephemeral: true });
            }

            const [_, type, userId] = interaction.customId.split('_');
            if (userId !== member.id) return;

            let selectedDay = document.day;

            if (type === 'daily') {
                selectedDay = 1;
            } else if (type === 'weekly') {
                selectedDay = 7;
            } else if (type === 'monthly') {
                selectedDay = 30;
            } else if (type === 'custom') {
                const modal = new ModalBuilder()
                    .setCustomId(`stat_modal_${member.id}`)
                    .setTitle('Özel Gün Sayısı');

                const dayInput = new TextInputBuilder()
                    .setCustomId('customDay')
                    .setLabel('Gün sayısını girin')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Örnek: 21')
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(3);

                const actionRow = new ActionRowBuilder().addComponents(dayInput);
                modal.addComponents(actionRow);

                await interaction.showModal(modal);
                return;
            }

            if (selectedDay > document.day) {
                selectedDay = document.day;
            }

            const newDocument = await member.stats(selectedDay);
            const newEmbed = embed.toJSON();

            await sendStatEmbed(client, interaction, member, newDocument, selectedDay, embed, buttons, true);
        });

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isModalSubmit() || !interaction.customId.startsWith('stat_modal_')) return;

            const userId = interaction.customId.split('_')[2];
            if (userId !== member.id) return;

            const customDay = parseInt(interaction.fields.getTextInputValue('customDay'));

            if (isNaN(customDay) || customDay <= 0) {
                return interaction.reply({ content: 'Geçerli bir gün sayısı girmelisiniz!', ephemeral: true });
            }

            let selectedDay = customDay;
            if (selectedDay > document.day) {
                selectedDay = document.day;
            }

            const newDocument = await member.stats(selectedDay);

            await sendStatEmbed(client, interaction, member, newDocument, selectedDay, embed, buttons, true);
        });
    },
};

async function sendStatEmbed(client, messageOrInteraction, member, document, wantedDay, embed, buttons, isInteraction = false) {
    embed.setDescription(`${member} adlı kullanıcının ${bold(`${wantedDay} günlük`)} veri bilgileri;`)
        .setColor(member.displayHexColor || '#00BFFF')
        .setFooter({ text: `${wantedDay > document.day ? `${document.day.toString()} günlük veri bulundu.` : 'Adel Was Here ❤️'}` })
        .spliceFields(0, embed.data.fields?.length || 0)
        .addFields(
            {
                name: `Toplam Ses Kanal Sıralaması (${client.functions.formatDurations(document.voice)})`,
                value: (await Promise.all(document.channels.voice.channels
                    .filter((d) => messageOrInteraction.guild?.channels.cache.has(d.id))
                    .map(async (data) => {
                        const channel = messageOrInteraction.guild?.channels.cache.get(data.id) || '#silinmiş-kanal';
                        if (!channel) return;

                        return `${await client.getEmoji('point')} ${channel}: ${inlineCode(client.functions.formatDurations(data.value))}`;
                    })
                )).filter(Boolean).slice(0, 10).join('\n') || 'Veri bulunamadı.',
                inline: false,
            },

            {
                name: `Toplam Yayın Kanal Sıralaması (${client.functions.formatDurations(document.stream)})`,
                value: (await Promise.all(document.channels.stream.channels
                    .filter((d) => messageOrInteraction.guild?.channels.cache.has(d.id))
                    .map(async (data) => {
                        const channel = messageOrInteraction.guild?.channels.cache.get(data.id) || '#silinmiş-kanal';
                        if (!channel) return;

                        return `${await client.getEmoji('point')} ${channel}: ${inlineCode(client.functions.formatDurations(data.value))}`;
                    })
                )).filter(Boolean).slice(0, 10).join('\n') || 'Veri bulunamadı.',
                inline: false,
            },

            {
                name: `Toplam Kamera Kanal Sıralaması (${client.functions.formatDurations(document.camera)})`,
                value: (await Promise.all(document.channels.camera.channels
                    .filter((d) => messageOrInteraction.guild?.channels.cache.has(d.id))
                    .map(async (data) => {
                        const channel = messageOrInteraction.guild?.channels.cache.get(data.id) || '#silinmiş-kanal';
                        if (!channel) return;

                        return `${await client.getEmoji('point')} ${channel}: ${inlineCode(client.functions.formatDurations(data.value))}`;
                    })
                )).filter(Boolean).slice(0, 10).join('\n') || 'Veri bulunamadı.',
                inline: false,
            },

            {
                name: `Toplam Mesaj Kanal Sıralaması (${document.message} Mesaj)`,
                value: (await Promise.all(document.channels.message.channels
                    .filter((d) => messageOrInteraction.guild?.channels.cache.has(d.id))
                    .map(async (data) => {
                        const channel = messageOrInteraction.guild?.channels.cache.get(data.id) || '#silinmiş-kanal';
                        if (!channel) return;

                        return `${await client.getEmoji('point')} ${channel}: ${inlineCode(data.value + ' mesaj')}`;
                    })
                )).filter(Boolean).slice(0, 10).join('\n') || 'Veri bulunamadı.',
                inline: false,
            },

            {
                name: `Diğer Bilgiler`,
                value: [
                    `${await client.getEmoji('point')} Toplam Kayıt: ${bold(`${document.register} kayıt`)}`,
                    `${await client.getEmoji('point')} Toplam Davet: ${bold(`${document.invite} davet`)}`,
                    `${await client.getEmoji('point')} Toplam Tag Aldırma: ${bold(`${document.taggeds} kişi`)}`,
                    `${await client.getEmoji('point')} Toplam Yetki Aldırma: ${bold(`${document.staffs} kişi`)}`,
                ].join('\n'),
            }
        );

    if (isInteraction) {
        if (messageOrInteraction.replied || messageOrInteraction.deferred) {
            await messageOrInteraction.editReply({
                embeds: [embed],
                components: [buttons]
            });
        } else {
            await messageOrInteraction.update({
                embeds: [embed],
                components: [buttons]
            });
        }
    } else {
        messageOrInteraction.channel.send({
            embeds: [embed],
            components: [buttons]
        });
    }
}