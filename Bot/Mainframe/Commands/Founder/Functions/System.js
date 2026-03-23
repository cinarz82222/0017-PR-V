const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, bold, inlineCode } = require('discord.js');

module.exports = async function Boolean(client, message, option, luhux, question, author, functionType) {
    await question.edit({
        content: '',
        components: createRow(option.name, (luhux.systems)[option.value]),
    });

    const filter = (i) => i.user.id === author;
    const collector = await question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 10,
    });

    collector.on('collect', async (i) => {
        if (i.isButton() && i.customId === 'back') {
            collector.stop('luhuxBABAPRO');
            i.deferUpdate();
            functionType(client, message, question, 'main');
            return;
        }

        if (i.isButton()) {
            (luhux.systems)[option.value] = i.customId === 'enable';

            await message?.guild.updateSettings({
                $set: { [`systems.${option.value}`]: (luhux.systems)[option.value] },
            });

            i.reply({
                content: `Başarıyla ${bold(option.name)} adlı ayar ${inlineCode(i.customId === 'enable' ? 'açık' : 'kapalı')} şeklinde ayarlandı.`,
                ephemeral: true,
            });


            question.edit({
                components: createRow(option.name, (luhux.systems)[option.value])
            });
        }
    });

    collector.on('end', (_, reason) => {
        if (reason === 'time') {
            question.edit({ components: [client.functions.timesUp()] });
        }
    });
}

function createRow(name, enabled) {
    return [
        new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'data',
                    disabled: true,
                    placeholder: `${name}: ${enabled ? 'Açık!' : 'Kapalı!'}`,
                    options: [{ label: 'test', value: 'a' }],
                }),
            ],
        }),
        new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'back',
                    label: 'Geri',
                    style: ButtonStyle.Danger,
                }),
                new ButtonBuilder({
                    custom_id: 'enable',
                    label: 'Aç',
                    disabled: enabled,
                    style: ButtonStyle.Success,
                }),
                new ButtonBuilder({
                    custom_id: 'disable',
                    label: 'Kapat',
                    disabled: !enabled,
                    style: ButtonStyle.Success,
                }),
            ],
        }),
    ];
}