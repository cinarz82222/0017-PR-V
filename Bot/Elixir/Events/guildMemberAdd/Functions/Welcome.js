const { UserModel } = require('../../../../../Global/Settings/Schemas');
const { inlineCode, ChannelType, bold, roleMention } = require('discord.js');

module.exports = async function Welcome(client, member, luhux, channel) {
    const chatChannel = member.guild.channels.cache.get(luhux.settings.chatChannel);

    const document = await UserModel.findOne({ id: member.id });

    if (luhux.systems.autoRegister && !luhux.systems.taggedMode && document && document.gender) {

        if (document && document.gender == 'Man') {
            member.setNickname(`${member.tag()} ${document.name}`).catch(() => null);
            member.setRoles(luhux.settings.manRoles).catch(() => null);
            document.nameLogs.push(
                {
                    gender: 'ERKEK',
                    type: 'Erkek',
                    date: Date.now(),
                    type: 'Otomatik Kayıt',
                    name: document.name,
                    staff: client?.user?.id
                }
            );

            await document.save();
        }

        if (document && document.gender == 'Girl') {
            member.setNickname(`${member.tag()} ${document.name}`).catch(() => null);
            member.setRoles(luhux.settings.womanRoles).catch(() => null);
            document.nameLogs.push(
                {
                    gender: 'KADIN',
                    type: 'Kadın',
                    date: Date.now(),
                    type: 'Otomatik Kayıt',
                    name: document.name,
                    staff: client?.user?.id
                }
            );

            await document.save();
        }

        if (chatChannel) chatChannel.send({
            content: `Tekrar aramıza hoş geldin ${member}`
        });

        if (channel) channel.send({
            content: `${await client.getEmoji('check')} ${member} (${inlineCode(`${member.user.username} - ${member.user.id}`)}) adlı üye önceden kayıtlı olduğu için kayıdı otomatik yapıldı.`
        });
        return;
    }

    member.setRoles(luhux.settings.unregisterRoles).catch(() => null);
    member.setNickname(`${member.tag()} ${luhux.settings.name}`).catch(() => null);

    const findRegisterCategory = member.guild.channels.cache.find((c) => ['register', 'gate', 'welcome', 'registration', 'welcome'].some(text => c.name.toLowerCase().includes(text)) && c.type === ChannelType.GuildCategory);
    const voiceChannel = member.guild.channels.cache.filter((c) => c.isVoiceBased() && c.parentId === findRegisterCategory?.id)
    .sort((a,b) => a.members.size - b.members.size)
    .first();

    if (channel) channel.send({
        content: [
            `Merhabalar ${member}, aramıza hoşgeldin. Seninle beraber sunucumuz ${bold(member.guild.memberCount)} üye sayısına ulaştı. 🎉`,

            `Hesabın ${client.timestamp(member.user.createdTimestamp, 'f')} tarihinde ${client.timestamp(member.user.createdTimestamp)} oluşturulmuş!`,

            `Sunucuya erişebilmek için ${voiceChannel} odalarında kayıt olup ismini ve yaşını belirtmen gerekmektedir!`,

            `${member.guild.channels.cache.find(c => c.name === 'rules' || c.name === 'kurallar')} kanalından sunucu kurallarımızı okumayı ihmal etme!`,

            luhux.settings.registerStaffs.length ? `${luhux.settings.registerStaffs.filter((r) => member.guild.roles.cache.has(r)).map((r) => roleMention(r)).listArray()} rolüne sahip yetkililer seninle ilgilenecektir.` : null,
            
            `-# Kayıt olmanız, kuralları kabul ettiğiniz anlamına gelir. Cezalar buna göre uygulanacaktır.`,
        ].filter(Boolean).join('\n\n'),
    });
}