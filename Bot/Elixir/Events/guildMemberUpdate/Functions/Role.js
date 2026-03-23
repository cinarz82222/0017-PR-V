const { AuditLogEvent, EmbedBuilder, inlineCode, codeBlock } = require('discord.js');
const { UserModel, SettingsModel } = require('../../../../../Global/Settings/Schemas');
const { checkWhitelist } = require('../../../../Guardian/Utils/Functions.js');
module.exports = async function Role(client, oldMember, newMember) {
    if (oldMember.roles.cache.map((r) => r.id) === newMember.roles.cache.map((r) => r.id)) return;

    const entry = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate }).then((audit) => audit.entries.first());
    if (!entry || !entry.executor || entry.targetId !== newMember.id || Date.now() - entry.createdTimestamp > 5000) return;

    const role = oldMember.roles.cache.difference(newMember.roles.cache).first();
    if (!role) return;

    const isRemove = oldMember.roles.cache.size > newMember.roles.cache.size;
    const now = Date.now();
    const changedRole = isRemove
        ? oldMember.roles.cache.difference(newMember.roles.cache).first()
        : newMember.roles.cache.difference(oldMember.roles.cache).first();

    if (!changedRole) return;

    await UserModel.updateOne(
        { id: newMember.id },
        {
            $push: {
                roleLogs: {
                    type: isRemove ? 'remove' : 'add',
                    roles: [role?.id],
                    staff: entry.executor.id,
                    date: now
                }
            }
        },
        { upsert: true }
    );
    if (!isRemove) {
        const settings = await SettingsModel.findOne({ id: newMember.guild.id });
        const blacklistedRoles = settings?.security?.blackListedRoles?.map(r => typeof r === 'string' ? r : r.id) || [];
        const executorMember = newMember.guild.members.cache.get(entry.executor.id) || entry.executor;
        const safeMode = await checkWhitelist(client, executorMember, 'blackList');

        if (safeMode?.isWarn) return;
        if (blacklistedRoles.includes(changedRole.id)) {
            console.log(`[BLACKLIST] ${entry.executor.tag} tarafından kara liste rol verildi: ${changedRole.name}`);

            try {
                await newMember.roles.remove(changedRole.id, 'Kara liste rol verildi.');
                console.log('[BLACKLIST] Rol kaldırıldı.');

                const logChannel = newMember.guild.channels.cache.find(c => c.name === 'guard-log');
                if (logChannel) {
                    const embed = new EmbedBuilder({
                        title: 'Kara Liste Rol Verildi ve Geri Alındı!',
                        description: [
                            codeBlock('yaml', [
                                `→ İşlem Yapan: ${entry.executor.tag} (${entry.executor.id})`,
                                `→ Hedef Üye: ${newMember.user.tag} (${newMember.id})`,
                                `→ Yasaklı Rol: ${changedRole.name} (${changedRole.id})`,
                                `→ Tarih: ${new Date().toLocaleString()}`,
                            ].join('\n')),
                            codeBlock('ansi', [
                                '[2;30m# İşlem Detayları[0m',
                                `[2;37m→ İşlem Yapan: [0m [2;31m${entry.executor.tag}[0m`,
                                `[2;37m→ Hedef Üye: [0m [2;31m${newMember.user.tag}[0m`,
                                `[2;37m→ Yasaklı Rol: [0m [2;31m${changedRole.name}[0m`,
                            ].join('\n'))
                        ].join('\n\n'),
                        footer: { text: 'Blacklist Koruma Sistemi' }
                    });
                    await logChannel.send({ embeds: [embed] });
                    console.log('[BLACKLIST] Log kanalına mesaj gönderildi.');
                } else {
                    console.log('[BLACKLIST] Log kanalı bulunamadı.');
                }
            } catch (err) {
                console.error('[BLACKLIST ERROR] Rol kaldırma veya log gönderme hatası:', err);
            }
        }
    }
    const channel = await client.getChannel('role-log', newMember)
    if (!channel) return;

    channel.send({
        flags: [4096],
        embeds: [
            new EmbedBuilder({
                color: isRemove ? client.getColor('red') : client.getColor('green'),
                title: `Rol ${isRemove ? 'Çıkarıldı' : 'Eklendi'}! (Sağ Tık)`,
                description: [
                    `→ Kullanıcı: ${newMember} (${inlineCode(newMember.id)})`,
                    `→ Yetkili: ${entry.executor} (${inlineCode(entry.executor.id)})`,
                    `→ Rol: ${role}`,
                    `→ Tarih: ${client.timestamp(now)}`
                ].join('\n'),
            })
        ]
    });
}