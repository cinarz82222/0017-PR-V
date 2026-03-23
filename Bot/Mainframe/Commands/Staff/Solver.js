const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const { Solver } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'solver',
    Aliases: ["sorunçöz", "sorunçözmebaşlat", "sç"],
    Description: 'Sorun çözme başlatır.',
    Usage: 'solver <@User/ID>',
    Category: 'Staff',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, luhux, embed) => {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!member) return message.reply({ embeds: [embed.setDescription('Bir kullanıcı belirtmelisin!')] });
        if (member.id === message.author.id) return message.reply({ embeds: [embed.setDescription('Kendinle sorun çözme başlatamazsın!')] });

        const OnSolver = await Solver.findOne({ userId: member.id, "issueSession.active": true });
        if (OnSolver) return message.reply({ embeds: [embed.setDescription('Bu kullanıcı için zaten aktif bir sorun çözme oturumu bulunmakta!')] });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('accept')
                    .setLabel('Kabul Et')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('decline')
                    .setLabel('Reddet')
                    .setStyle(ButtonStyle.Danger)
            );

        const ertununannesi = await message.channel.send({
            content: `${member}, ${message.author} seninle sorun çözme başlatmak istiyor. Kabul ediyor musun?`,
            components: [row]
        });

        const collector = ertununannesi.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== member.id) {
                return interaction.reply({
                    content: 'Bu butonları sadece etiketlenen kullanıcı kullanabilir.',
                    ephemeral: true
                });
            }

            if (interaction.customId === 'accept') {
                await interaction.update({
                    content: `${member} sorun çözme oturumunu kabul etti!`,
                    components: []
                });

                const ModalSex = new ModalBuilder()
                    .setCustomId('description_modal')
                    .setTitle('Sorun Açıklaması');

                const sexciler = new TextInputBuilder()
                    .setCustomId('description')
                    .setLabel('Sorunu detaylı bir şekilde açıklayın')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Sorun nedir? Ne zaman başladı? Öncesinde ne oldu?')
                    .setRequired(true)
                    .setMinLength(10)
                    .setMaxLength(1000);

                const issueRow = new ActionRowBuilder().addComponents(sexciler);
                ModalSex.addComponents(issueRow);

                const resolveRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('resolve')
                            .setLabel('Çözüldü')
                            .setStyle(ButtonStyle.Primary)
                    );

                const modalButton = new ButtonBuilder()
                    .setCustomId('show_issue_modal')
                    .setLabel('Sorun Açıklaması Ekle')
                    .setStyle(ButtonStyle.Secondary);

                const modalRow = new ActionRowBuilder().addComponents(modalButton);

                const modalButtonMsg = await message.channel.send({
                    content: `${message.author}, sorunu açıklamak için butona tıklayın.`,
                    components: [modalRow]
                });

                const modalButtonCollector = modalButtonMsg.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 300000
                });

                modalButtonCollector.on('collect', async (btnInteraction) => {
                    if (btnInteraction.user.id !== message.author.id) {
                        return btnInteraction.reply({
                            content: 'Bu butonu sadece sorunu başlatan yetkili kullanabilir.',
                            ephemeral: true
                        });
                    }

                    await btnInteraction.showModal(ModalSex);

                    try {
                        const modalSubmit = await btnInteraction.awaitModalSubmit({
                            time: 300000
                        });

                        const konusex = modalSubmit.fields.getTextInputValue('description');
                        const startTime = new Date();

                        const issueEmbed = new EmbedBuilder()
                            .setTitle('Sorun Çözme Oturumu Başlatıldı')
                            .setColor('#3498db')
                            .setDescription(`
**Kullanıcı:** ${member} (${member.user.tag})
**Yetkili:** ${message.author} (${message.author.tag})
**Başlangıç Zamanı:** <t:${Math.floor(startTime.getTime() / 1000)}:F>
**Konu:**
\`\`\`
${konusex}
\`\`\`
                            
Sorun çözüldüğünde "Çözüldü" butonuna tıklayın.
`)
                            .setFooter({ text: `${message.guild.name} • ID: ${member.id}`, iconURL: message.guild.iconURL() })
                            .setTimestamp();

                        const çözümyoluyokbizde = await message.channel.send({
                            embeds: [issueEmbed],
                            components: [resolveRow]
                        });

                        await modalButtonMsg.delete().catch(console.error);
                        await Solver.findOneAndUpdate(
                            { userId: member.id, guildId: message.guild.id },
                            {
                                $set: {
                                    username: member.user.tag,
                                    "issueSession": {
                                        active: true,
                                        staffId: message.author.id,
                                        startTime: startTime,
                                        subject: konusex,
                                        channelId: message.channel.id,
                                        messageId: çözümyoluyokbizde.id
                                    }
                                }
                            },
                            { upsert: true }
                        );


                        sendLog(client, message.guild, {
                            title: '🟢 Sorun Çözme Başlatıldı',
                            description: `
**Kullanıcı:** ${member} (${member.user.tag})
**Yetkili:** ${message.author} (${message.author.tag})
**Zaman:** <t:${Math.floor(startTime.getTime() / 1000)}:F>
**Kanal:** <#${message.channel.id}>
                            
**Sorun:**
\`\`\`
${konusex}
\`\`\`
`,
                            color: 0x2ecc71
                        });

                        await modalSubmit.reply({ content: 'Sorun çözme oturumu başarıyla başlatıldı.', ephemeral: true });

                        const resolveCollector = çözümyoluyokbizde.createMessageComponentCollector({
                            componentType: ComponentType.Button,
                            time: 86400000
                        });

                        resolveCollector.on('collect', async (resolveInteraction) => {

                            if (resolveInteraction.user.id !== message.author.id) {
                                return resolveInteraction.reply({
                                    content: 'Bu butonu sadece sorunu başlatan yetkili kullanabilir.',
                                    ephemeral: true
                                });
                            }

                            if (resolveInteraction.customId === 'resolve') {
                                const resolutionModal = new ModalBuilder()
                                    .setCustomId('resolution_modal')
                                    .setTitle('Sorun Çözüm Detayları');

                                const resolutionInput = new TextInputBuilder()
                                    .setCustomId('resolution_description')
                                    .setLabel('Sorun nasıl çözüldü?')
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setPlaceholder('Sorunu nasıl çözdünüz? Hangi adımları uyguladınız?')
                                    .setRequired(true)
                                    .setMinLength(10)
                                    .setMaxLength(1000);

                                const resolutionRow = new ActionRowBuilder().addComponents(resolutionInput);
                                resolutionModal.addComponents(resolutionRow);

                                await resolveInteraction.showModal(resolutionModal);

                                try {
                                    const utkubabacık = await resolveInteraction.awaitModalSubmit({
                                        time: 300000
                                    });

                                    const çözümsex = utkubabacık.fields.getTextInputValue('resolution_description');
                                    const endTime = new Date();
                                    const duration = Math.floor((endTime - startTime) / 1000);

                                    const issueData = await Solver.findOne({ userId: member.id, "issueSession.active": true });
                                    const sexkonusu = issueData?.issueSession?.subject || 'Bilinmiyor';

                                    const resolvedEmbed = new EmbedBuilder()
                                        .setTitle('Sorun Çözme Oturumu Tamamlandı')
                                        .setColor('#2ecc71')
                                        .setDescription(`
**Kullanıcı:** ${member} (${member.user.tag})
**Yetkili:** ${message.author} (${message.author.tag})
**Başlangıç Zamanı:** <t:${Math.floor(startTime.getTime() / 1000)}:F>
**Bitiş Zamanı:** <t:${Math.floor(endTime.getTime() / 1000)}:F>
**Süre:** ${formatDuration(duration)}
                                        
**Sorun:**
\`\`\`
${sexkonusu}
\`\`\`
                                        
**Çözüm:**
\`\`\`
${çözümsex}
\`\`\`
`)
                                        .setFooter({ text: `${message.guild.name} • ID: ${member.id}`, iconURL: message.guild.iconURL() })
                                        .setTimestamp();


                                    await çözümyoluyokbizde.edit({
                                        embeds: [resolvedEmbed],
                                        components: []
                                    });

                                    await Solver.findOneAndUpdate(
                                        { userId: member.id, guildId: message.guild.id },
                                        {
                                            $set: {
                                                "issueSession.active": false,
                                                "issueSession.endTime": endTime,
                                                "issueSession.resolution": çözümsex
                                            },
                                            $push: {
                                                "issueHistory": {
                                                    staffId: message.author.id,
                                                    staffUsername: message.author.tag,
                                                    startTime: startTime,
                                                    endTime: endTime,
                                                    subject: sexkonusu,
                                                    resolution: çözümsex,
                                                    durationSeconds: duration
                                                }
                                            }
                                        }
                                    );

                                    sendLog(client, message.guild, {
                                        title: '✅ Sorun Çözme Tamamlandı',
                                        description: `
                                        **Kullanıcı:** ${member} (${member.user.tag})
                                        **Yetkili:** ${message.author} (${message.author.tag})
                                        **Başlangıç:** <t:${Math.floor(startTime.getTime() / 1000)}:F>
                                        **Bitiş:** <t:${Math.floor(endTime.getTime() / 1000)}:F>
                                        **Süre:** ${formatDuration(duration)}
                                        **Kanal:** <#${message.channel.id}>
                                        
                                        **Sorun:**
                                        \`\`\`
                                        ${sexkonusu}
                                        \`\`\`
                                        
                                        **Çözüm:**
                                        \`\`\`
                                        ${çözümsex}
                                        \`\`\`
                                        `,
                                        color: 0x27ae60
                                    });

                                    await utkubabacık.reply({ content: 'Sorun başarıyla çözüldü ve kayıtlara eklendi.', ephemeral: true });

                                } catch (err) {
                                    console.error('Resolution modal error:', err);
                                    resolveInteraction.followUp({ content: 'Çözüm detayları girilemedi. Lütfen tekrar deneyin.', ephemeral: true });
                                }
                            }
                        });

                        resolveCollector.on('end', (collected, reason) => {
                            if (reason === 'time' && çözümyoluyokbizde.editable) {
                                çözümyoluyokbizde.edit({
                                    components: [],
                                    content: `${çözümyoluyokbizde.content}\n\n⚠️ Bu sorun çözme oturumu için zaman aşımına uğradı.`
                                }).catch(console.error);
                            }
                        });

                    } catch (err) {
                        console.error('Modal submission error:', err);
                    }
                });

                modalButtonCollector.on('end', (collected, reason) => {
                    if (reason === 'time' && modalButtonMsg.editable) {
                        modalButtonMsg.edit({
                            components: [],
                            content: `${modalButtonMsg.content}\n\n⚠️ Zaman aşımı. Sorun çözme işlemi iptal edildi.`
                        }).catch(console.error);
                    }
                });

            } else if (interaction.customId === 'decline') {
                await interaction.update({
                    content: `${member} sorun çözme oturumunu reddetti.`,
                    components: []
                });


                sendLog(client, message.guild, {
                    title: '🔴 Sorun Çözme Reddedildi',
                    description: `
**Kullanıcı:** ${member} (${member.user.tag})
**Yetkili:** ${message.author} (${message.author.tag})
**Zaman:** <t:${Math.floor(Date.now() / 1000)}:F>
**Kanal:** <#${message.channel.id}>
                    
Kullanıcı sorun çözme talebini reddetti.
                    `,
                    color: 0xe74c3c
                });
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time' && collected.size === 0 && ertununannesi.editable) {
                ertununannesi.edit({
                    content: 'Sorun çözme isteği zaman aşımına uğradı.',
                    components: []
                }).catch(console.error);
            }
        });
    }
};


function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let result = '';
    if (hours > 0) result += `${hours} saat `;
    if (minutes > 0) result += `${minutes} dakika `;
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) result += `${remainingSeconds} saniye`;

    return result.trim();
}


async function sendLog(client, guild, logData) {
    const logChannelId = guild.channels.cache.find(c =>
        c.name.includes('solver-log')
    )?.id || guild.channels.cache.find(c => c.name.includes('solver-log'))?.id;

    if (!logChannelId) return;

    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(logData.title)
        .setDescription(logData.description)
        .setColor(logData.color || 0x3498db)
        .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(console.error);
}