const { EmbedBuilder, codeBlock, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { StaffModel } = require('../../../../../Global/Settings/Schemas')

module.exports = async function Task(client, interaction, route, luhux) {
    const member = interaction.guild?.members.cache.get(interaction.user.id)
    if (!member) return;

    if (!client.staff.check(member, luhux)) return interaction.reply({ content: 'Bu butonu kullanabilmek için yetkiniz bulunmamakta!', ephemeral: true });

    const { currentRank } = client.staff.getRank(member, luhux);
    console.log(currentRank)
    if (!currentRank) return interaction.deferUpdate();

    if (currentRank.type == 'sub') return interaction.reply({ content: 'Bu butonu kullanabilmek için yetkiniz bulunmamakta!', ephemeral: true });

    const document = await StaffModel.findOne({ user: member.id })

    if (document?.tasks?.length > 0) return interaction.reply({ content: 'Zaten bir göreviniz bulunmakta!', ephemeral: true });

    if (route === 'streamer') {
        await StaffModel.updateOne(
            { user: member.id },
            {
                $set: {
                    tasks: currentRank?.tasks.map((t) => ({
                        type: t.TYPE,
                        name: t.NAME,
                        count: 0,
                        required: t.COUNT,
                        completed: false,
                    })),
                    taskStartAt: Date.now(),
                    taskName: 'Streamer',
                },
            },
            { upsert: true }
        )


        await StaffModel.findOneAndUpdate(
            { user: member.id },
            {
                $pull: { tasks: { type: 'PUBLIC' } },
            },
            { new: true, upsert: true }
        );

        const ilision = new EmbedBuilder({
            color: client.getColor('random'),
            description: [
                `Stremer görevini başarıyla aldınız!`,
                `Aldığınız Görevler;`,
                `${codeBlock('yaml', currentRank?.tasks.filter((t) => t.TYPE !== 'STREAMER').map((t) => `- ${t.NAME} ${t.COUNT_TYPE === 'TIME' ? `(${client.functions.formatDurations(t.COUNT)})` : `(${t.COUNT})`} ${t.COUNT_TYPE === 'TIME' ? 'süre' : 'adet'}`).join('\n'))}`,
            ].join('\n'),
        })

        return interaction.reply({ embeds: [ilision], ephemeral: true });
    }

    if (route === 'public') {
        await StaffModel.updateOne(
            { user: member.id },
            {
                $set: {
                    tasks: currentRank?.tasks.map((t) => ({
                        type: t.TYPE,
                        name: t.NAME,
                        count: 0,
                        required: t.COUNT,
                        completed: false,
                    })),
                    taskStartAt: Date.now(),
                    taskName: 'Public',
                },
            },
            { upsert: true }
        )

        await StaffModel.findOneAndUpdate(
            { user: member.id },
            {
                $pull: { tasks: { type: 'STREAMER' } },
            },
            { new: true, upsert: true }
        );

        const ilision = new EmbedBuilder({
            color: client.getColor('random'),
            description: [
                `Public görevini başarıyla aldınız!`,
                `Aldığınız Görevler;`,
                `${codeBlock('yaml', currentRank?.tasks.filter((t) => t.TYPE !== 'PUBLIC').map((t) => `- ${t.NAME} ${t.COUNT_TYPE === 'TIME' ? `(${client.functions.formatDurations(t.COUNT)})` : `(${t.COUNT})`} ${t.COUNT_TYPE === 'TIME' ? 'süre' : 'adet'}`).join('\n'))}`,
            ].join('\n'),
        })

        return interaction.reply({ embeds: [ilision], ephemeral: true });
    }

    if (route === 'message') {
        await StaffModel.updateOne(
            { user: member.id },
            {
                $set: {
                    tasks: currentRank?.tasks.map((t) => ({
                        type: t.TYPE,
                        name: t.NAME,
                        count: 0,
                        required: t.COUNT,
                        completed: false,
                    })),
                    taskStartAt: Date.now(),
                    taskName: 'Mesaj',
                },
            },
            { upsert: true }
        )

        if (currentRank.type === 'middle') {
            await StaffModel.findOneAndUpdate(
                { user: member.id, 'tasks.type': 'MESSAGE' },
                {
                    $inc: { 'tasks.$[elem].required': 1900 },
                },
                { arrayFilters: [{ 'elem.type': 'MESSAGE' }], new: true, upsert: true }
            );
        } else {
            await StaffModel.findOneAndUpdate(
                { user: member.id, 'tasks.type': 'MESSAGE' },
                {
                    $inc: { 'tasks.$[elem].required': 2900 },
                },
                { arrayFilters: [{ 'elem.type': 'MESSAGE' }], new: true, upsert: true }
            );
        }

        const ilision = new EmbedBuilder({
            color: client.getColor('random'),
            description: [
                `Moderation görevini başarıyla aldınız!`,
                `Aldığınız Görevler;`,
                `${codeBlock('yaml', currentRank?.tasks.map((t) => `- ${t.NAME} ${t.TYPE === 'TIME' ? `(${client.functions.formatDurations(t.COUNT)})` : `(${t.COUNT})`} ${t.TYPE === 'TIME' ? 'süre' : 'adet'}`).join('\n'))}`,
            ].join('\n'),
        })

        return interaction.reply({ embeds: [ilision], ephemeral: true });
    }

    if (route === 'staff') {
        await StaffModel.updateOne(
            { user: member.id },
            {
                $set: {
                    tasks: currentRank?.tasks.map((t) => ({
                        type: t.TYPE,
                        name: t.NAME,
                        count: 0,
                        required: t.COUNT,
                        completed: false,
                    })),
                    taskStartAt: Date.now(),
                    taskName: 'Yetkili Alım',
                },
            },
            { upsert: true }
        )

        if (currentRank.type === 'middle') {
            await StaffModel.findOneAndUpdate(
                { user: member.id, 'tasks.type': 'STAFF' },
                {
                    $inc: { 'tasks.$[elem].required': 10 },
                },
                { arrayFilters: [{ 'elem.type': 'STAFF' }], new: true, upsert: true }
            );
        } else {
            await StaffModel.findOneAndUpdate(
                { user: member.id, 'tasks.type': 'STAFF' },
                {
                    $inc: { 'tasks.$[elem].required': 25 },
                },
                { arrayFilters: [{ 'elem.type': 'STAFF' }], new: true, upsert: true }
            );
        }

        const ilision = new EmbedBuilder({
            color: client.getColor('random'),
            description: [
                `Yetkili alım görevini başarıyla aldınız!`,
                `Aldığınız Görevler;`,
                `${codeBlock('yaml', currentRank?.tasks.map((t) => `- ${t.NAME} ${t.TYPE === 'TIME' ? `(${client.functions.formatDurations(t.COUNT)})` : `(${t.COUNT})`} ${t.TYPE === 'TIME' ? 'süre' : 'adet'}`).join('\n'))}`,
            ].join('\n'),
        })

        return interaction.reply({ embeds: [ilision], ephemeral: true });
    }
};