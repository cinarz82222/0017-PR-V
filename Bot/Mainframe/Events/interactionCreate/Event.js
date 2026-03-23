const { Events } = require('discord.js');
const { Commands: { SlashCommandsHandler } } = require('../../../../Global/Handlers');
const { SecretRoom, MemberPanel, Streamer, Punish, Invasion, Menu, Solver, Task, Orientation, StreamerRoom, Bots, Responsibility, Punitive,Tweet,Loca } = require('./Functions');
const { SettingsModel } = require('../../../../Global/Settings/Schemas'); 

module.exports = {
    Name: Events.InteractionCreate,
    System: true,

    execute: async (client, interaction) => {
        if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
            const value = interaction.customId.split(':')[0]; 

            const luhux = await SettingsModel.findOne({ id: interaction.guild.id });
            if (!luhux) return;

            if (value === 'secretroom') return SecretRoom(client, interaction, interaction.customId.split(':')[1])
            if (value === 'member') return MemberPanel(client, interaction, interaction.customId.split(':')[1]);
            if (value === 'streamer') return Streamer(client, interaction, interaction.customId.split(':')[1], luhux);
            if (value === 'punish') return Punish(client, interaction, interaction.customId.split(':')[1], luhux);
            if (value === 'check') return Invasion(client, interaction, interaction.customId.split(':')[1], luhux);
            if (value === 'rolepanel') return Menu(client, interaction, interaction.customId.split(':')[1], luhux);
            if (value === 'solver') return Solver(client, interaction, interaction.customId.split(':')[1], luhux);
            if (value === 'task') return Task(client, interaction, interaction.customId.split(':')[1], luhux);
            if (value === 'staff') return Orientation(client, interaction, interaction.customId.split(':')[1], luhux);
            if (value === 'streamerRoom') return StreamerRoom(client, interaction, interaction.customId.split(':')[1], luhux);
            if (value === 'bots') return Bots(client, interaction, interaction.customId.split(':')[1], luhux);
            if (value === 'responsibility') return Responsibility(client, interaction, interaction.customId.split(':')[1], luhux);
            if (value === 'punitive') return Punitive(client, interaction, interaction.customId.split(':')[1], interaction.customId.split(':')[2], luhux);
            if (value === 'tweet') return Tweet(client, interaction, interaction.customId.split(':')[1], luhux);
            if (value === 'loca') return Loca(client, interaction, interaction.customId.split(':')[1], luhux);
        };

        if (interaction.isCommand()) {
            return await SlashCommandsHandler(client, interaction);
        }
    }
};