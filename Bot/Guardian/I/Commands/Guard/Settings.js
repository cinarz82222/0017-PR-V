const { ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, PermissionFlagsBits, PermissionsBitField, ButtonBuilder, ButtonStyle } = require('discord.js');
const { roleBackup, channelBackup, createChatGuardian } = require('../../../Utils/Functions');
const { SettingsModel } = require('../../../../../Global/Settings/Schemas');
const { Collection } = require('mongoose');

module.exports = {
    name: 'ayarlar',
    aliases: ['settings'],

    execute: async (client, message, args) => {
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder({
                    custom_id: 'settings',
                    placeholder: 'Bir Ayar Seçin',
                    options: [
                        { label: 'Kanal Backup', value: 'channel_backup', emoji: '🔄' },
                        { label: 'Rol Backup', value: 'role_backup', emoji: '🔄' },
                        { label: 'Chat Guard', value: 'chat_guard', emoji: '🛡️' },
                        { label: 'Blacklist Rolleri', value: 'blacklist_roles', emoji: '🛡️' },
                        { label: 'Blacklist Kanalları', value: 'blacklist_channels', emoji: '🛡️' },
                        { label: 'Yetki İşlemleri', value: 'authority_operations', emoji: '⚙️' },
                    ]
                })
            )

        const question = await message.channel.send({
            components: [row]
        }).catch(err => { });

        const collector = question.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id, time: 60000
        });

        collector.on('collect', async i => {
            i.deferUpdate();

            if (i.values[0] === 'channel_backup') {
                await channelBackup(message.guild);
                question.reply({ content: 'Kanal Yedeği Başarıyla Alındı!', components: [] }).catch(err => { });
            } else if (i.values[0] === 'role_backup') {
                await roleBackup(message.guild);
                question.reply({ content: 'Rol Yedeği Başarıyla Alındı!', components: [] }).catch(err => { });
            } else if (i.values[0] === 'chat_guard') {
                await createChatGuardian(client, message.guild.id);
                await question.reply({ content: 'Chat Guard Kurulumu Yapıldı!', components: [] }).catch(err => { });
            } else if (i.values[0] === 'blacklist_channels') {

                const data = await SettingsModel.findOne({ id: message.guild.id })

                const blackListChannels = data?.security.blackListedChannels.map((x) => x.id) || [];

                const stringSelectMenu = new StringSelectMenuBuilder({
                    custom_id: 'remove_channel',
                    placeholder: 'Kanal seç..',
                    options: blackListChannels.length > 0 ? blackListChannels.slice(0, 25).map((x) => {
                        return {
                            label: message.guild.channels.cache.get(x)?.name || '#deleted-channel',
                            description: 'Kaldırmak için tıklayın.',
                            value: x,
                        }
                    }) : [{ label: 'Kanal Bulunamadı.', value: 'null' }],
                    disabled: blackListChannels.length === 0
                });

                const channelSelectMenu = new ChannelSelectMenuBuilder({
                    customId: 'add_channel',
                    placeholder: 'Kanal ara..',
                    min_values: 1,
                    max_values: 25
                });

                const stringRow = new ActionRowBuilder().addComponents(stringSelectMenu);
                const channelRow = new ActionRowBuilder().addComponents(channelSelectMenu);

                const msg = await question.reply({
                    content: 'Kara Listeye Alınacak Kanalları Seçin',
                    components: [stringRow, channelRow]
                }).catch(err => { })

                const collector = msg.createMessageComponentCollector({
                    filter: i => i.user.id === message.author.id, time: 60000
                });

                collector.on('collect', async i => {
                    i.deferUpdate();
                    if (i.customId === 'remove_channel') {
                        await SettingsModel.updateOne(
                            { id: message.guild.id },
                            {
                              $pull: {
                                'security.blackListedChannels': { id: i.values[0] }
                              }
                            }
                          );
                        await msg.edit({ content: 'Kanal Kara Listeden Kaldırıldı!', components: [] }).catch(err => { });
                    } else if (i.customId === 'add_channel') {
                        const value = i.values;
                        await SettingsModel.updateOne(
                            { id: message.guild.id },
                            {
                              $push: {
                                'security.blackListedChannels': {
                                  $each: value.map((x) => { return { id: x } })
                                }
                              }
                            }
                          );
                        await msg.edit({ content: 'Kanal Kara Listeye Eklendi!', components: [] }).catch(err => { });
                    }
                });
            } else if (i.values[0] === 'blacklist_roles') {
                const data = await SettingsModel.findOne({ id: message.guild.id })

                const blackListRoles = data?.security.blackListedRoles?.map((x) => x.id) || [];

                const stringSelectMenu = new StringSelectMenuBuilder({
                    custom_id: 'remove_role',
                    placeholder: 'Rol seç..',
                    options: blackListRoles.length > 0 ? blackListRoles.slice(0, 25).map((x) => {
                        return {
                            label: message.guild.roles.cache.get(x).name,
                            description: 'Kaldırmak için tıklayın.',
                            value: x,
                        }
                    }) : [{ label: 'Rol Bulunamadı.', value: 'null' }],
                    disabled: blackListRoles.length === 0
                });

                const roleSelectMenu = new RoleSelectMenuBuilder({
                    customId: 'add_role',
                    placeholder: 'Rol ara..',
                    minValues: 1,
                    maxValues: 25
                });

                const stringRow = new ActionRowBuilder().addComponents(stringSelectMenu);
                const roleRow = new ActionRowBuilder().addComponents(roleSelectMenu);

                const msg = await question.reply({
                    content: 'Kara Listeye Alınacak Rolleri Seçin',
                    components: [stringRow, roleRow]
                }).catch(err => { })

                const collector = msg.createMessageComponentCollector({
                    filter: i => i.user.id === message.author.id, time: 60000
                });

                collector.on('collect', async i => {
                    i.deferUpdate();
                    if (i.customId === 'remove_role') {
                        await SettingsModel(
                            { id: message.guild.id },
                            {
                                $pull: {
                                    'security.blackListedRoles': { id: i.values[0] }
                                }
                            }
                        );
                        await msg.edit({ content: 'Rol Kara Listeden Kaldırıldı!', components: [] }).catch(err => { });
                    } else if (i.customId === 'add_role') {
                        const value = i.values;
                        await SettingsModel.updateOne(
                            { id: message.guild.id },
                            {
                                $push: {
                                    'security.blackListedRoles': {
                                        $each: value.map((x) => { return { id: x } })
                                    }
                                }
                            }
                        );
                        await msg.edit({ content: 'Rol Kara Listeye Eklendi!', components: [] }).catch(err => { });
                    }
                });
            } else if (i.values[0] === 'authority_operations') {

                const data = await SettingsModel.findOne({ id: message.guild.id });
                if (!data || !data.security.rolePermissions) return question.reply({ content: 'Yetki İşlemleri ayarları bulunamadı.', components: [] });

                const msg = await question.reply({
                    content: 'Sunucuda bulunan rollerde ki yetkileri açmak veya kapatmak için aşağıda ki butonları kullanınız.',
                    components: [
                        new ActionRowBuilder({
                            components: [
                                new ButtonBuilder({
                                    custom_id: 'open',
                                    label: 'Yetkileri Aç',
                                    style: ButtonStyle.Danger,
                                    disabled: data.security.rolePermissions.length === 0 ? true : false
                                }),

                                new ButtonBuilder({
                                    custom_id: 'close',
                                    label: 'Yetkileri Kapat',
                                    style: ButtonStyle.Danger,
                                    disabled: data.security.rolePermissions.length === 0 ? false : true
                                })
                            ]
                        })
                    ]
                }).catch(err => { });

                const collector = msg.createMessageComponentCollector({
                    filter: i => i.user.id === message.author.id, time: 60000
                });

                collector.on('collect', async i => {
                    i.deferUpdate();
                    if (i.customId === 'open') {
                        data?.security.rolePermissions?.forEach(p => {
                            const role = message.guild.roles.cache.get(p.role);
                            if (!role) return;
                            if (!role.editable) return;

                            setTimeout(() => role.setPermissions(new PermissionsBitField(p.permissions)), 2000);
                        });

                        await SettingsModel.updateOne(
                            { id: message.guild.id },
                            {
                                $set: {
                                    'security.rolePermissions': []
                                }
                            }
                        );
                        await msg.edit({ content: 'Yetkiler başarıyla açıldı.', components: [] }).catch(err => { });
                    } else if (i.customId === 'close') {
                        let perms = [PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageWebhooks, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageGuild, PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers];
                        const dangerRoles = message.guild.roles.cache.filter((r) => perms.some((perm) => r.permissions.has(perm)) && r.editable);
                        const data = [];

                        for (const r of dangerRoles.values()) {
                            data.push({  
                                role: r.id,
                                permissions: new PermissionsBitField(r.permissions.bitfield),
                            })

                            await r.setPermissions(PermissionsBitField.Flags.SendMessages).catch(() => { });
                            await SettingsModel.updateOne(
                                { id: message.guild.id },
                                { $push: { 'security.rolePermissions': data } },
                                { upsert: true }
                            );
                        }

                        await msg.edit({ content: 'Yetkiler başarıyla kapatıldı.', components: [] }).catch(err => { });
                    }
                });
            }
        })
    }
}