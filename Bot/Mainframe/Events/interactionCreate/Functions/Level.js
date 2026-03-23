const { PermissionsBitField: { Flags }, MentionableSelectMenuBuilder, ModalBuilder, TextInputStyle, TextInputBuilder, inlineCode, ActionRowBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { SettingsModel } = require('../../../../../Global/Settings/Schemas');
module.exports = async function Loca(client, interaction, route, luhux) {
    const member = interaction.guild?.members.cache.get(interaction.user.id)
    if (!member) return;

    if (route === 'level_add') {
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
 }