const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'evlen',
    Aliases: ['marry', 'evlilik', 'marriage'],
    Description: 'Başka bir kullanıcıya evlenme teklifi eder.',
    Usage: 'evlen <@User/ID> [yüzük ID]',
    Category: 'Economy',
    Cooldown: 10,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args) => {
        try {
            const userData = await UserModel.findOne({ id: message.author.id }) || await new UserModel({ id: message.author.id }).save();

            if (userData.marriage && userData.marriage.active === true) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`Zaten biriyle evlisin! Boşanmak için \`.boşan\` komutunu kullanabilirsin.`)
                            .setColor(0xe43f5a)
                    ]
                });
            }
            const targetUser = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if (!targetUser) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`Evlenmek istediğin kullanıcıyı etiketlemen veya ID'sini yazman gerekiyor.`)
                            .setColor(0xe43f5a)
                    ]
                });
            }

            if (targetUser.id === message.author.id) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`Dostum kendinle evlenecek kadar yalnız mısın gel bana dmden yaz bi konuşalım senle luhux ekle cabuk`)
                            .setColor(0xe43f5a)
                    ]
                });
            }

            const targetData = await UserModel.findOne({ id: targetUser.id }) || await new UserModel({ id: targetUser.id }).save();

            if (targetData.marriage && targetData.marriage.active === true) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`${targetUser} Ah be zaten biriyle evli!`)
                            .setColor(0xe43f5a)
                    ]
                });
            }
            if (!userData.inventory) {
                userData.inventory = {
                    cash: 0,
                    roelcoin: 0,
                    rings: {},
                    gifts: [],
                    boosters: [],
                    purchaseHistory: []
                };
                userData.markModified('inventory');
                await userData.save();
            }

            if (!userData.inventory.rings) {
                userData.inventory.rings = {};
                userData.markModified('inventory');
                await userData.save();
            }

            const rings = [
                { id: 'ring1', name: 'Pırlanta', icon: '💎', price: 500, emoji: '1366839706674790562' },
                { id: 'ring2', name: 'Baget', icon: '💍', price: 300, emoji: '1366839701775974532' },
                { id: 'ring3', name: 'Tektaş', icon: '💎', price: 400, emoji: '1366839705085149285' },
                { id: 'ring4', name: 'Tria', icon: '✨', price: 450, emoji: '1366839703634055168' },
                { id: 'ring5', name: 'Beştaş', icon: '🌟', price: 600, emoji: '1366839708294053968' }
            ];

            const userRings = [];
            let hasRings = false;

            for (const ring of rings) {
                const count = userData.inventory.rings[ring.id] || 0;
                if (count > 0) {
                    userRings.push({ ...ring, count });
                    hasRings = true;
                }
            }

            if (!hasRings) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('💔 Envanterinde Yüzük Yok!')
                            .setDescription(`Evlenmek için envanterinde yüzük bulunması gerekiyor. Mağazadan yüzük satın alabilirsin!\n\n\`.shop\` komutunu kullanarak mağazayı açabilirsin.`)
                            .setColor(0xe43f5a)
                            .setFooter({ text: 'Önce bir yüzük satın al ve tekrar dene!' })
                    ]
                });
            }

            let selectedRing = null;
            if (args[1]) {
                const ringId = args[1].startsWith('ring') ? args[1] : `ring${args[1]}`;
                selectedRing = rings.find(r => r.id === ringId);

                if (!selectedRing) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(`❌ Geçersiz yüzük ID'si girdin. \`1\` ile \`5\` arasında bir değer veya \`ring1\` - \`ring5\` formatında bir ID girmelisin.`)
                                .setColor(0xe43f5a)
                        ]
                    });
                }

                if (!(userData.inventory.rings[selectedRing.id] && userData.inventory.rings[selectedRing.id] > 0)) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(`❌ **${selectedRing.name}** yüzüğüne sahip değilsin. Başka bir yüzük seçmeyi dene veya \`.shop\` komutuyla mağazadan satın al.`)
                                .setColor(0xe43f5a)
                        ]
                    });
                }
            } else if (userRings.length === 1) {

                selectedRing = userRings[0];
            } else {
                const ringOptions = userRings.map(ring => `**${ring.name}** ${ring.icon} (ID: \`${ring.id}\` veya \`${ring.id.replace('ring', '')}\`) - Adet: ${ring.count}`).join('\n');

                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('💍 Yüzük Seçimi')
                            .setDescription(`Mevcut yüzükleriniz:\n\n${ringOptions}\n\nEvlenmek için aşağıdaki komutu kullanın:\n\`.evlen @${targetUser.user.username} [yüzük ID]\``)
                            .setColor(0x5865f2)
                            .setFooter({ text: 'Örnek: .evlen @luhux 3 (Tektaş yüzüğü seçer)' })
                    ]
                });
            }

            const proposalEmbed = new EmbedBuilder()
                .setTitle('💍 Evlenme Teklifi')
                .setColor(0xf173ac)
                .setDescription(`**${message.author.username}** sana **${selectedRing.name}** ${selectedRing.icon} yüzüğü ile evlenme teklif ediyor!\n\nBu teklifi kabul ediyor musun?`)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Teklif Eden', value: `${message.author}`, inline: true },
                    { name: 'Teklif Alan', value: `${targetUser}`, inline: true },
                    { name: 'Yüzük', value: `${selectedRing.name} ${selectedRing.icon}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Bu teklif 5 dakika boyunca geçerlidir.' });

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_${message.author.id}_${selectedRing.id}`)
                    .setLabel('Kabul Ediyorum')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💖'),

                new ButtonBuilder()
                    .setCustomId(`decline_${message.author.id}_${selectedRing.id}`)
                    .setLabel('Hayır, Teşekkürler')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💔')
            );

            const proposalMessage = await message.channel.send({
                content: `${targetUser}, **${message.author.username}** sana evlenme teklif ediyor!`,
                embeds: [proposalEmbed],
                components: [buttons]
            });


            const filter = (interaction) => {
                return interaction.user.id === targetUser.id &&
                    (interaction.customId.startsWith('accept_' + message.author.id) ||
                        interaction.customId.startsWith('decline_' + message.author.id));
            };

            const collector = proposalMessage.createMessageComponentCollector({
                filter,
                time: 300000
            });

            collector.on('collect', async (interaction) => {
                await interaction.deferUpdate();

                const action = interaction.customId.split('_')[0];

                if (action === 'accept') {

                    userData.inventory.rings[selectedRing.id] -= 1;


                    if (!userData.marriage) userData.marriage = {};
                    if (!targetData.marriage) targetData.marriage = {};


                    userData.marriage.active = true;
                    userData.marriage.married = targetUser.id;
                    userData.marriage.date = Date.now();
                    userData.marriage.ring = selectedRing.id;


                    targetData.marriage.active = true;
                    targetData.marriage.married = message.author.id;
                    targetData.marriage.date = Date.now();
                    targetData.marriage.ring = selectedRing.id;


                    userData.markModified('inventory');
                    userData.markModified('marriage');
                    targetData.markModified('marriage');

                    await userData.save();
                    await targetData.save();


                    const celebrationEmbed = new EmbedBuilder()
                        .setTitle('💖 Tebrikler! Artık Evlisiniz!')
                        .setDescription(`${message.author} ve ${targetUser} resmi olarak evlendiler! Onları tebrik edelim!`)
                        .setColor(0xf173ac)
                        .addFields(
                            { name: 'Evlilik Tarihi', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                            { name: 'Yüzük', value: `${selectedRing.name} ${selectedRing.icon}`, inline: true }
                        )
                        .setImage('https://cdn.discordapp.com/attachments/1304349914699927552/1367080298763784242/marriage-marry.gif?ex=6813483e&is=6811f6be&hm=18efedb8b35e2ea2ec4406c1a15f646c0c82109b37cfd3f62dfa89894a5f2d86&')
                        .setTimestamp()
                        .setFooter({ text: `${selectedRing.name} yüzüğü ile evlendiler • ${new Date().toLocaleDateString()}` });

                    await proposalMessage.edit({
                        content: `🎉 **${message.author.username}** ve **${targetUser.user.username}** artık evliler! Tebrikler!`,
                        embeds: [celebrationEmbed],
                        components: []
                    });

                } else {

                    const declineEmbed = new EmbedBuilder()
                        .setTitle('💔 Evlenme Teklifi Reddedildi')
                        .setDescription(`${targetUser} maalesef evlenme teklifini reddetti.`)
                        .setColor(0xe43f5a)
                        .setTimestamp();

                    await proposalMessage.edit({
                        content: `${message.author}, evlenme teklifin reddedildi.`,
                        embeds: [declineEmbed],
                        components: []
                    });
                }

                collector.stop();
            });


            collector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle('⏰ Zaman Aşımı')
                        .setDescription(`${targetUser} cevap vermedi, evlenme teklifi zaman aşımına uğradı.`)
                        .setColor(0x95a5a6)
                        .setTimestamp();

                    await proposalMessage.edit({
                        content: `${message.author}, evlenme teklifine cevap alamadın.`,
                        embeds: [timeoutEmbed],
                        components: []
                    });
                }
            });

        } catch (error) {
            console.error('Evlenme komutunda hata:', error);
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Hata')
                        .setDescription('Evlenme komutu çalıştırılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
                        .setColor(0xe43f5a)
                ]
            });
        }
    }
};