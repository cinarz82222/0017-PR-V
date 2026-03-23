const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    ComponentType
} = require("discord.js");
const { SettingsModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'levelsystem',
    Aliases: ['lvl'],
    Description: 'Level sistemini gösterir ve yapılandırmanı sağlar.',
    Usage: '.levelsystem',
    Category: 'Register',
    Cooldown: 0,
    Permissions: { User: [], Role: [] },
    Command: { Prefix: true },

    messageRun: async (client, message) => {
        const guildID = message.guild.id;
        let data = await SettingsModel.findOne({ id: guildID }) || new SettingsModel({ id: guildID, Roles: [] });

        const embed = new EmbedBuilder()
            .setTitle("\uD83D\uDCCA Level Rol Listesi")
            .setColor("Blurple")
            .setDescription(
                data.Roles.length > 0
                    ? data.Roles
                        .sort((a, b) => a.Level - b.Level)
                        .map((x, i) => `\`${i + 1}.\` **Level ${x.Level}** → <@&${x.RoleID}>`)
                        .join("\n")
                    : "Henüz ayarlanmış bir level rolü yok."
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("level_add")
                .setLabel("➕ Ekle")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("level_remove")
                .setLabel("➖ Sil")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(data.Roles.length === 0),
            new ButtonBuilder()
                .setCustomId("level_members")
                .setLabel("\uD83D\uDC65 Roldeki Üyeleri Gör")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(data.Roles.length === 0)
        );

        const msg = await message.reply({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000,
            filter: i => i.user.id === message.author.id
        });

        collector.on("collect", async interaction => {
            if (interaction.customId === "level_add") {
                const modal = new ModalBuilder()
                    .setCustomId("level_modal_add")
                    .setTitle("Yeni Level Rolü Ekle");

                const levelInput = new TextInputBuilder()
                    .setCustomId("level_input")
                    .setLabel("Hedef Seviye (sayı)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const roleInput = new TextInputBuilder()
                    .setCustomId("role_input")
                    .setLabel("Rol ID")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(levelInput),
                    new ActionRowBuilder().addComponents(roleInput)
                );

                await interaction.showModal(modal);
            }

            if (interaction.customId === "level_remove") {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId("level_select_remove")
                    .setPlaceholder("Silmek istediğin leveli seç")
                    .addOptions(
                        data.Roles
                            .sort((a, b) => a.Level - b.Level)
                            .map(x => ({
                                label: `Level ${x.Level}`,
                                value: x.Level.toString(),
                                description: `Rol: ${message.guild.roles.cache.get(x.RoleID)?.name || "Bilinmiyor"}`
                            }))
                    );

                const row = new ActionRowBuilder().addComponents(selectMenu);

                await interaction.reply({ content: "❓ Hangi level silinsin?", components: [row], ephemeral: true });
            }

            if (interaction.customId === "level_members") {
                const menu = new StringSelectMenuBuilder()
                    .setCustomId("level_member_select")
                    .setPlaceholder("Level seç → kimde var görelim")
                    .addOptions(
                        data.Roles
                            .sort((a, b) => a.Level - b.Level)
                            .map(r => ({
                                label: `Level ${r.Level}`,
                                value: r.Level.toString(),
                                description: `Rol: ${message.guild.roles.cache.get(r.RoleID)?.name || "Silinmiş"}`
                            }))
                    );

                const row = new ActionRowBuilder().addComponents(menu);
                await interaction.reply({ content: "\uD83D\uDD0D İncelemek istediğin leveli seç:", components: [row], ephemeral: true });
            }
        });

        client.on("interactionCreate", async interaction => {
            if (interaction.isModalSubmit() && interaction.customId === "level_modal_add") {
                const level = parseInt(interaction.fields.getTextInputValue("level_input"));
                const roleID = interaction.fields.getTextInputValue("role_input");
                const role = message.guild.roles.cache.get(roleID);

                if (!level || isNaN(level) || !role)
                    return interaction.reply({ content: "❌ Geçerli bir seviye ve rol ID girmelisin.", ephemeral: true });

                let doc = await SettingsModel.findOne({ id: guildID }) || new SettingsModel({ id: guildID, Roles: [] });
                const existing = doc.Roles.find(x => x.Level === level);

                if (existing) existing.RoleID = roleID;
                else doc.Roles.push({ Level: level, RoleID: roleID });

                await doc.save();
                return interaction.reply({ content: `✅ Artık Level **${level}** olanlara <@&${roleID}> rolü verilecek.`, ephemeral: true });
            }

            if (interaction.isStringSelectMenu() && interaction.customId === "level_select_remove") {
                const levelToRemove = parseInt(interaction.values[0]);
                const doc = await SettingsModel.findOne({ id: guildID });
                if (!doc) return;

                doc.Roles = doc.Roles.filter(x => x.Level !== levelToRemove);
                await doc.save();

                await interaction.update({ content: `✅ Level ${levelToRemove} başarıyla kaldırıldı.`, components: [], ephemeral: true });
            }

            if (interaction.isStringSelectMenu() && interaction.customId === "level_member_select") {
                const selectedLevel = parseInt(interaction.values[0]);
                const doc = await SettingsModel.findOne({ id: guildID });
                const match = doc?.Roles?.find(x => x.Level === selectedLevel);
                if (!match) return interaction.reply({ content: "❌ Bu level tanımlı değil.", ephemeral: true });

                const role = message.guild.roles.cache.get(match.RoleID);
                if (!role) return interaction.reply({ content: "❌ Rol sunucuda bulunamadı.", ephemeral: true });

                const members = role.members.map(m => `${m.user.tag} (${m.id})`);
                if (!members.length)
                    return interaction.reply({ content: `ℹ️ Level ${selectedLevel} rolü şu anda hiç kimsede yok.`, ephemeral: true });

                let page = 0;
                const perPage = 10;
                const totalPages = Math.ceil(members.length / perPage);

                const getPageContent = (p) => {
                    const sliced = members.slice(p * perPage, (p + 1) * perPage);
                    return sliced.map((x, i) => `\`${p * perPage + i + 1}.\` ${x}`).join("\n");
                };

                const embed = new EmbedBuilder()
                    .setTitle(`\uD83D\uDC65 Level ${selectedLevel} - Roldeki Üyeler`)
                    .setDescription(getPageContent(page))
                    .setFooter({ text: `Sayfa ${page + 1}/${totalPages}` })
                    .setColor("Blue");

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("prev_page")
                        .setEmoji("⬅️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId("next_page")
                        .setEmoji("➡️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page + 1 >= totalPages)
                );

                const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true, ephemeral: true });

                const buttonCollector = msg.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 60_000,
                    filter: i => i.user.id === interaction.user.id
                });

                buttonCollector.on("collect", async (btn) => {
                    if (btn.customId === "prev_page" && page > 0) page--;
                    if (btn.customId === "next_page" && page + 1 < totalPages) page++;

                    const newEmbed = EmbedBuilder.from(embed)
                        .setDescription(getPageContent(page))
                        .setFooter({ text: `Sayfa ${page + 1}/${totalPages}` });

                    const newRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("prev_page")
                            .setEmoji("⬅️")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId("next_page")
                            .setEmoji("➡️")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page + 1 >= totalPages)
                    );

                    await btn.update({ embeds: [newEmbed], components: [newRow] });
                });
            }
        });
    }
};