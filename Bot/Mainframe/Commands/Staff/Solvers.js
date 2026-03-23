const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { Solver } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'solverstat',
    Aliases: ["sorunistatistik", "çözümistatistik", "solverstats", "sorunçözmelerim"],
    Description: 'Sorun çözme istatistiklerini gösterir.',
    Usage: 'solverstat [kullanıcı]',
    Category: 'Staff',
    Cooldown: 5,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, luhux, embed) => {
        const target = message.mentions.members.first() || (args[0] ? message.guild.members.cache.get(args[0]) : null) || message.member;

        if (target) {
            const solverData = await getSolverStats(target.id, message.guild.id);

            const solvedForUser = await getIssuesSolvedForUser(target.id, message.guild.id);

            const userStatsEmbed = new EmbedBuilder()
                .setTitle(`Sorun Çözme İstatistikleri`)
                .setDescription(`${target} kullanıcısı için sorun çözme istatistikleri:`)
                .setColor('#3498db')
                .setThumbnail(target.user.displayAvatarURL())
                .addFields(
                    {
                        name: 'Çözülen Sorun Sayısı',
                        value: solverData.totalSolved.toString(),
                        inline: true
                    },
                    {
                        name: 'Ortalama Çözüm Süresi',
                        value: solverData.avgDuration || 'Veri yok',
                        inline: true
                    },
                    {
                        name: 'Aktif Sorun',
                        value: solverData.activeSessions > 0 ? `${solverData.activeSessions} aktif sorun çözme oturumu var` : 'Yok',
                        inline: true
                    }
                )
                .setFooter({ text: `${message.guild.name}`, iconURL: message.guild.iconURL() })
                .setTimestamp();

            if (solvedForUser.length > 0) {
                userStatsEmbed.addFields({
                    name: 'Bu Kullanıcının Çözülen Sorunları',
                    value: `Bu kullanıcı için ${solvedForUser.length} sorun çözüldü.\nSon çözüm: <t:${Math.floor(new Date(solvedForUser[0].endTime).getTime() / 1000)}:R>`
                });
            }

            if (solverData.totalSolved > 0) {
                const recentlyHelped = solverData.recentUsers.slice(0, 5).map((issue, index) => {
                    return `${index + 1}. <@${issue.userId}> - <t:${Math.floor(new Date(issue.endTime).getTime() / 1000)}:R>`;
                }).join('\n');

                userStatsEmbed.addFields({
                    name: 'Son Yardım Edilen Kullanıcılar',
                    value: recentlyHelped || 'Veri bulunamadı'
                });
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('view_solved_issues')
                        .setLabel('Çözülen Sorunlar')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(solverData.totalSolved === 0),
                    new ButtonBuilder()
                        .setCustomId('view_helped_users')
                        .setLabel('Yardım Edilen Kullanıcılar')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(solverData.totalSolved === 0)
                );


            const statsMessage = await message.channel.send({
                embeds: [userStatsEmbed],
                components: solverData.totalSolved > 0 ? [row] : []
            });


            if (solverData.totalSolved > 0) {
                const collector = statsMessage.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 300000
                });

                collector.on('collect', async (interaction) => {
                    if (interaction.user.id !== message.author.id) {
                        return interaction.reply({
                            content: 'Bu butonları sadece komutu kullanan kişi kullanabilir.',
                            ephemeral: true
                        });
                    }

                    if (interaction.customId === 'view_solved_issues') {
                        const fullIssueData = await getDetailedSolverData(target.id, message.guild.id);
                        let currentPage = 0;
                        const itemsPerPage = 5;
                        const totalPages = Math.ceil(fullIssueData.length / itemsPerPage);

                        const paginationRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('prev_page')
                                    .setLabel('◀️ Önceki')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('next_page')
                                    .setLabel('Sonraki ▶️')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(totalPages <= 1),
                                new ButtonBuilder()
                                    .setCustomId('back_to_stats')
                                    .setLabel('Ana İstatistiklere Dön')
                                    .setStyle(ButtonStyle.Primary)
                            );

                        const generateIssuesPage = (page) => {
                            const startIdx = page * itemsPerPage;
                            const endIdx = Math.min(startIdx + itemsPerPage, fullIssueData.length);
                            const pageItems = fullIssueData.slice(startIdx, endIdx);

                            const issuesEmbed = new EmbedBuilder()
                                .setTitle(`Çözülen Sorunlar (${target.user.username})`)
                                .setDescription(`Toplam çözülen sorun: ${fullIssueData.length}\nSayfa: ${page + 1}/${totalPages}`)
                                .setColor('#3498db')
                                .setFooter({ text: `${message.guild.name}`, iconURL: message.guild.iconURL() })
                                .setTimestamp();

                            pageItems.forEach((issue, index) => {
                                issuesEmbed.addFields({
                                    name: `#${startIdx + index + 1} - <t:${Math.floor(new Date(issue.endTime).getTime() / 1000)}:D>`,
                                    value: `**Kullanıcı:** <@${issue.userId}>\n**Sorun:** ${truncateText(issue.subject, 100)}\n**Çözüm:** ${truncateText(issue.resolution, 100)}\n**Süre:** ${formatDuration(issue.durationSeconds)}`
                                });
                            });

                            return issuesEmbed;
                        };

                        await interaction.update({
                            embeds: [generateIssuesPage(currentPage)],
                            components: [paginationRow]
                        });

                        const paginationCollector = statsMessage.createMessageComponentCollector({
                            componentType: ComponentType.Button,
                            time: 300000
                        });

                        paginationCollector.on('collect', async (pageInteraction) => {
                            if (pageInteraction.user.id !== message.author.id) {
                                return pageInteraction.reply({
                                    content: 'Bu butonları sadece komutu kullanan kişi kullanabilir.',
                                    ephemeral: true
                                });
                            }


                            if (pageInteraction.customId === 'prev_page') {
                                currentPage--;
                            } else if (pageInteraction.customId === 'next_page') {
                                currentPage++;
                            } else if (pageInteraction.customId === 'back_to_stats') {
                                await pageInteraction.update({
                                    embeds: [userStatsEmbed],
                                    components: [row]
                                });
                                paginationCollector.stop();
                                return;
                            }

                            paginationRow.components[0].setDisabled(currentPage === 0);
                            paginationRow.components[1].setDisabled(currentPage === totalPages - 1);


                            await pageInteraction.update({
                                embeds: [generateIssuesPage(currentPage)],
                                components: [paginationRow]
                            });
                        });

                    } else if (interaction.customId === 'view_helped_users') {

                        const helpedUsersData = await getHelpedUsersData(target.id, message.guild.id);

                        const usersCount = {};
                        helpedUsersData.forEach(issue => {
                            if (!usersCount[issue.userId]) {
                                usersCount[issue.userId] = {
                                    count: 0,
                                    lastHelped: issue.endTime
                                };
                            }
                            usersCount[issue.userId].count++;

                            if (new Date(issue.endTime) > new Date(usersCount[issue.userId].lastHelped)) {
                                usersCount[issue.userId].lastHelped = issue.endTime;
                            }
                        });


                        const sortedUsers = Object.entries(usersCount)
                            .map(([userId, data]) => ({
                                userId,
                                count: data.count,
                                lastHelped: data.lastHelped
                            }))
                            .sort((a, b) => b.count - a.count);


                        const helpedUsersEmbed = new EmbedBuilder()
                            .setTitle(`Yardım Edilen Kullanıcılar (${target.user.username})`)
                            .setDescription(`${target} kullanıcısı toplam ${sortedUsers.length} farklı kullanıcıya yardım etmiş.`)
                            .setColor('#3498db')
                            .setFooter({ text: `${message.guild.name}`, iconURL: message.guild.iconURL() })
                            .setTimestamp();


                        const topUsers = sortedUsers.slice(0, 15);
                        if (topUsers.length > 0) {
                            const userList = topUsers.map((user, index) => {
                                return `${index + 1}. <@${user.userId}> - ${user.count} sorun (Son: <t:${Math.floor(new Date(user.lastHelped).getTime() / 1000)}:R>)`;
                            }).join('\n');

                            helpedUsersEmbed.addFields({
                                name: '🏆 En Çok Yardım Edilenler',
                                value: userList
                            });
                        } else {
                            helpedUsersEmbed.addFields({
                                name: '🏆 En Çok Yardım Edilenler',
                                value: 'Veri bulunamadı'
                            });
                        }


                        const backRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('back_to_stats')
                                    .setLabel('Ana İstatistiklere Dön')
                                    .setStyle(ButtonStyle.Primary)
                            );

                        await interaction.update({
                            embeds: [helpedUsersEmbed],
                            components: [backRow]
                        });


                        const backCollector = statsMessage.createMessageComponentCollector({
                            componentType: ComponentType.Button,
                            time: 300000
                        });

                        backCollector.on('collect', async (backInteraction) => {
                            if (backInteraction.user.id !== message.author.id) {
                                return backInteraction.reply({
                                    content: 'Bu butonu sadece komutu kullanan kişi kullanabilir.',
                                    ephemeral: true
                                });
                            }

                            if (backInteraction.customId === 'back_to_stats') {
                                await backInteraction.update({
                                    embeds: [userStatsEmbed],
                                    components: [row]
                                });
                                backCollector.stop();
                            }
                        });
                    }
                });

                collector.on('end', (collected, reason) => {
                    if (reason === 'time' && statsMessage.editable) {
                        statsMessage.edit({
                            components: []
                        }).catch(console.error);
                    }
                });
            }

        } else {

            const serverStats = await getServerStats(message.guild.id);


            const serverStatsEmbed = new EmbedBuilder()
                .setTitle(`Sunucu Sorun Çözme İstatistikleri`)
                .setDescription(`${message.guild.name} sunucusu için sorun çözme istatistikleri:`)
                .setColor('#3498db')
                .setThumbnail(message.guild.iconURL())
                .addFields(
                    {
                        name: 'Toplam Çözülen Sorun',
                        value: serverStats.totalSolved.toString(),
                        inline: true
                    },
                    {
                        name: 'Aktif Sorun Çözücüler',
                        value: serverStats.activeSolvers.toString(),
                        inline: true
                    },
                    {
                        name: 'Ortalama Çözüm Süresi',
                        value: serverStats.avgDuration || 'Veri yok',
                        inline: true
                    },
                    {
                        name: 'Aktif Sorunlar',
                        value: serverStats.activeSessions > 0 ? `${serverStats.activeSessions} aktif sorun çözme oturumu var` : 'Yok',
                        inline: true
                    }
                )
                .setFooter({ text: `${message.guild.name}`, iconURL: message.guild.iconURL() })
                .setTimestamp();


            if (serverStats.topSolvers.length > 0) {
                const topSolversString = serverStats.topSolvers
                    .map((solver, index) => `${index + 1}. <@${solver.staffId}> - ${solver.count} sorun çözdü`)
                    .join('\n');

                serverStatsEmbed.addFields({
                    name: 'En İyi Sorun Çözücüler',
                    value: topSolversString
                });
            }


            if (serverStats.recentActivities.length > 0) {
                const recentActivitiesString = serverStats.recentActivities
                    .map(activity => `• <@${activity.staffId}> → <@${activity.userId}> - <t:${Math.floor(new Date(activity.endTime).getTime() / 1000)}:R>`)
                    .join('\n');

                serverStatsEmbed.addFields({
                    name: 'Son Sorun Çözme Aktiviteleri',
                    value: recentActivitiesString
                });
            }

            message.channel.send({ embeds: [serverStatsEmbed] });
        }
    }
};

async function getSolverStats(userId, guildId) {
    try {

        const issueData = await Solver.find({
            guildId: guildId,
            "issueHistory.staffId": userId
        });


        const result = {
            totalSolved: 0,
            activeSessions: 0,
            avgDuration: 'Veri yok',
            recentUsers: []
        };


        let totalDuration = 0;
        let solvedCount = 0;
        let allIssues = [];


        issueData.forEach(doc => {

            if (doc.issueSession && doc.issueSession.active && doc.issueSession.staffId === userId) {
                result.activeSessions++;
            }


            doc.issueHistory.forEach(issue => {
                if (issue.staffId === userId) {
                    solvedCount++;


                    if (issue.durationSeconds) {
                        totalDuration += issue.durationSeconds;
                    }


                    allIssues.push({
                        userId: doc.userId,
                        endTime: issue.endTime,
                        subject: issue.subject,
                        resolution: issue.resolution,
                        durationSeconds: issue.durationSeconds
                    });
                }
            });
        });


        result.totalSolved = solvedCount;


        if (solvedCount > 0) {
            const avgSeconds = Math.floor(totalDuration / solvedCount);
            result.avgDuration = formatDuration(avgSeconds);
        }


        result.recentUsers = allIssues.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));

        return result;
    } catch (error) {
        console.error('Error getting solver stats:', error);
        return {
            totalSolved: 0,
            activeSessions: 0,
            avgDuration: 'Veri yok',
            recentUsers: []
        };
    }
}


async function getIssuesSolvedForUser(userId, guildId) {
    try {

        const userData = await Solver.findOne({
            userId: userId,
            guildId: guildId
        });

        if (!userData || !userData.issueHistory) {
            return [];
        }


        return userData.issueHistory.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
    } catch (error) {
        console.error('Error getting issues solved for user:', error);
        return [];
    }
}


async function getDetailedSolverData(userId, guildId) {
    try {

        const issueData = await Solver.find({
            guildId: guildId,
            "issueHistory.staffId": userId
        });

        let allIssues = [];

        issueData.forEach(doc => {

            doc.issueHistory.forEach(issue => {
                if (issue.staffId === userId) {

                    allIssues.push({
                        userId: doc.userId,
                        endTime: issue.endTime,
                        subject: issue.subject,
                        resolution: issue.resolution,
                        durationSeconds: issue.durationSeconds
                    });
                }
            });
        });


        return allIssues.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
    } catch (error) {
        console.error('Error getting detailed solver data:', error);
        return [];
    }
}


async function getHelpedUsersData(staffId, guildId) {
    try {

        const issueData = await Solver.find({
            guildId: guildId,
            "issueHistory.staffId": staffId
        });

        let helpedUsers = [];


        issueData.forEach(doc => {

            doc.issueHistory.forEach(issue => {
                if (issue.staffId === staffId) {

                    helpedUsers.push({
                        userId: doc.userId,
                        endTime: issue.endTime
                    });
                }
            });
        });

        return helpedUsers;
    } catch (error) {
        console.error('Error getting helped users data:', error);
        return [];
    }
}


async function getServerStats(guildId) {
    try {

        const allData = await Solver.find({ guildId: guildId });


        const result = {
            totalSolved: 0,
            activeSolvers: 0,
            activeSessions: 0,
            avgDuration: 'Veri yok',
            topSolvers: [],
            recentActivities: []
        };


        result.activeSessions = allData.filter(doc => doc.issueSession && doc.issueSession.active).length;


        let allIssues = [];
        let totalDuration = 0;
        const solverCounts = {};

        allData.forEach(doc => {

            doc.issueHistory.forEach(issue => {
                result.totalSolved++;

                if (issue.durationSeconds) {
                    totalDuration += issue.durationSeconds;
                }


                if (!solverCounts[issue.staffId]) {
                    solverCounts[issue.staffId] = 0;
                }
                solverCounts[issue.staffId]++;

                allIssues.push({
                    userId: doc.userId,
                    staffId: issue.staffId,
                    endTime: issue.endTime
                });
            });
        });


        if (result.totalSolved > 0) {
            const avgSeconds = Math.floor(totalDuration / result.totalSolved);
            result.avgDuration = formatDuration(avgSeconds);
        }


        result.activeSolvers = Object.keys(solverCounts).length;


        result.topSolvers = Object.entries(solverCounts)
            .map(([staffId, count]) => ({ staffId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);


        result.recentActivities = allIssues
            .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
            .slice(0, 5);

        return result;
    } catch (error) {
        console.error('Error getting server stats:', error);
        return {
            totalSolved: 0,
            activeSolvers: 0,
            activeSessions: 0,
            avgDuration: 'Veri yok',
            topSolvers: [],
            recentActivities: []
        };
    }
}


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


function truncateText(text, maxLength) {
    if (!text) return 'Bilgi yok';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}