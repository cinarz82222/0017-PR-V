const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
const {
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextInputBuilder,
    ModalBuilder,
    TextInputStyle,
    EmbedBuilder
} = require('discord.js');
const fetch = require('node-fetch');
const TweetModel = require('../../../../../Global/Settings/Schemas/Tweet');

module.exports = {
    Name: 'tweet',
    Aliases: [],
    Description: 'Tweet Gönder Paneli',
    Usage: 'tweet',
    Category: 'General',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args) => {
        try {
            const embed = new EmbedBuilder()
                .setTitle("Tweet At")
                .setDescription("Tweet oluşturmak için aşağıdaki butona tıklayın!")
                .setColor(0x1DA1F2);

            const openModalButton = new ButtonBuilder()
                .setCustomId('tweet:openTweetModal')
                .setLabel('Tweet At')
                .setStyle(ButtonStyle.Secondary);

            const initialRow = new ActionRowBuilder().addComponents(openModalButton);

            await message.channel.send({ embeds: [embed], components: [initialRow] });
        } catch (error) {
            console.error('Tweet komutu çalıştırılırken hata:', error);
            return message.reply('Tweet komutu çalıştırılırken bir hata oluştu: ' + error.message);
        }
    }
};

client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId === 'tweetModal') {
        await interaction.deferReply({ ephemeral: true });

        const tweetContent = interaction.fields.getTextInputValue('tweetContent');
        const tweetImageURL = interaction.fields.getTextInputValue('tweetImage');

        let hasImage = false;
        let imagePath = null;
        if (tweetImageURL && tweetImageURL.startsWith('http')) {
            hasImage = true;
            try {
                const tempDir = path.join(__dirname, '../../../../temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                const fileName = `temp_img_${Date.now()}.png`;
                imagePath = path.join(tempDir, fileName);
                const response = await fetch(tweetImageURL);
                const buffer = await response.arrayBuffer();
                fs.writeFileSync(imagePath, Buffer.from(buffer));
            } catch (err) {
                console.error("Resim indirilirken hata:", err);
                hasImage = false;
            }
        }

        const tweetId = interaction.id;
        const newTweetRecord = new TweetModel({
            tweetNo: Math.floor(Math.random() * 1000000), 
            tweetId: tweetId,
            content: tweetContent,
            likes: [],
            retweets: [],
            comments: 0,
            dowlands: 0,
            commentData: []
        });
        await newTweetRecord.save();

        class Tweet {
            constructor(tweetData, tweetContent, hasImage, imagePath) {
                this.tweetData = tweetData || { likes: [], retweets: [], comments: 0, dowlands: 0, commentData: [] };
                this.avatar = interaction.user.displayAvatarURL({ extension: 'png', size: 1024 });
                this.tweetContent = tweetContent;
                this.verified = false;
                this.user = {
                    id: interaction.user.id, 
                    displayName: interaction.user.username,
                    username: interaction.user.username.toLowerCase()
                };
                this.hasImage = hasImage;
                this.imagePath = imagePath;

                this.padding = 30;
                this.headerHeight = 120;
                this.imageMargin = 20;
                this.borderRadius = 15;
                this.border = 2;
                this.maxTextWidth = 900;
                this.lineHeight = 35;
                this.canvasWidth = 1000;
                this.iconFiles = {
                    reply: 'reply.png',
                    retweet: 'retweet.png',
                    like: 'like.png',
                    share: 'share.png'
                };
                this.theme = "dark";
            }

            async build() {
                const contentHeight = await this.calculateContentHeight();
                const canvasHeight = this.headerHeight + contentHeight + 100;
                const canvas = createCanvas(this.canvasWidth, canvasHeight);
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = this.theme === "dark" ? "#000000" : "#ffffff";
                ctx.fillRect(0, 0, this.canvasWidth, canvasHeight);

                this.drawRoundedRect(
                    ctx,
                    this.padding,
                    this.padding,
                    this.canvasWidth - this.padding * 2,
                    canvasHeight - this.padding * 2,
                    this.borderRadius,
                    this.theme === "dark" ? "#000000" : "#ffffff"
                );

                this.drawRoundedRect(
                    ctx,
                    this.padding + this.border,
                    this.padding + this.border,
                    this.canvasWidth - this.padding * 2 - this.border * 2,
                    canvasHeight - this.padding * 2 - this.border * 2,
                    this.borderRadius - this.border,
                    this.theme === "dark" ? "#000000" : "#ffffff"
                );

                await this.drawAvatar(ctx);
                await this.drawUserInfo(ctx);
                const textHeight = this.drawTweetText(ctx);

                let imageTotalHeight = 0;
                if (this.hasImage && this.imagePath) {
                    imageTotalHeight = await this.drawTweetImage(ctx, this.headerHeight + textHeight + this.imageMargin);
                }

                await this.drawActionBar(ctx, canvasHeight - 60);

                return canvas.toBuffer('image/png');
            }

            async calculateContentHeight() {
                const tempCanvas = createCanvas(1, 1);
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.font = "600 22px Arial";
                const lines = this.getTextLines(tempCtx, this.tweetContent, this.maxTextWidth);
                const textHeight = lines.length * this.lineHeight + 40;
                let imageHeight = 0;
                if (this.hasImage && this.imagePath) {
                    try {
                        const image = await loadImage(this.imagePath);
                        const aspectRatio = image.width / image.height;
                        let width = this.maxTextWidth;
                        let height = width / aspectRatio;
                        if (height > 400) {
                            height = 400;
                            width = height * aspectRatio;
                        }
                        imageHeight = height + this.imageMargin * 2;
                    } catch (err) {
                        console.error("Resim yüksekliği hesaplanırken hata:", err);
                    }
                }
                return textHeight + imageHeight;
            }

            drawRoundedRect(ctx, x, y, width, height, radius, color) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.fill();
            }

            async drawAvatar(ctx) {
                const avatarSize = 70;
                const avatarX = this.padding + 30;
                const avatarY = this.padding + 25;
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();

                try {
                    const avatarImg = await loadImage(this.avatar);
                    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
                } catch (err) {
                    console.error("Avatar yüklenirken hata:", err);
                    ctx.fillStyle = "#555";
                    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
                }
                ctx.restore();
            }

            async drawUserInfo(ctx) {
                const nameX = this.padding + 120;
                const nameY = this.padding + 50;
                ctx.fillStyle = this.theme === "dark" ? "#fff" : "#000";
                ctx.font = "bold 22px Arial";
                ctx.fillText(this.user.displayName, nameX, nameY);
                const orospular = ['341592492224806914', '1095457604156796939']; 
                if (orospular.includes(this.user.id)) {
                    this.verified = true;
                }
                if (this.verified) {
                    const nameWidth = ctx.measureText(this.user.displayName).width;
                    const badgeX = nameX + nameWidth + 10;
                    const badgeY = nameY - 15;
                    const badgePath = path.join(__dirname, '../../../../../Global/Assets/Images/verified.png');
                    try {
                        const badgeImg = await loadImage(badgePath);
                        ctx.drawImage(badgeImg, badgeX, badgeY, 20, 20);
                    } catch (err) {
                        console.error("Verified badge yüklenemedi:", err);
                    }
                }

                ctx.fillStyle = this.theme === "dark" ? "#bbb" : "#555";
                ctx.font = "18px Arial";
                ctx.fillText(`@${this.user.username}`, nameX, nameY + 25);
                ctx.fillStyle = this.theme === "dark" ? "#bbb" : "#555";
                ctx.font = "24px Arial";
                ctx.fillText("···", this.canvasWidth - this.padding - 50, nameY);
            }

            getTextLines(ctx, text, maxWidth) {
                const words = text.split(' ');
                const lines = [];
                let line = "";
                for (const word of words) {
                    const testLine = line + (line ? " " : "") + word;
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && line !== "") {
                        lines.push(line);
                        line = word;
                    } else {
                        line = testLine;
                    }
                }
                if (line) lines.push(line);
                return lines;
            }

            drawTweetText(ctx) {
                ctx.font = "600 22px Arial";
                ctx.fillStyle = this.theme === "dark" ? "#fff" : "#000";
                const startX = this.padding + 30;
                const startY = this.headerHeight + 30;
                const lines = this.getTextLines(ctx, this.tweetContent, this.maxTextWidth);
                lines.forEach((line, index) => {
                    ctx.fillText(line, startX, startY + index * this.lineHeight);
                });
                return lines.length * this.lineHeight + 20;
            }

            async drawTweetImage(ctx, y) {
                try {
                    const image = await loadImage(this.imagePath);
                    let startX = this.padding + 30;
                    let startY = y;
                    let width = this.maxTextWidth;
                    let height = image.height * (width / image.width);
                    if (height > 400) {
                        height = 400;
                        width = image.width * (height / image.height);
                    }
                    ctx.save();
                    ctx.beginPath();
                    this.drawRoundedRect(ctx, startX, startY, width, height, 15, this.theme === "dark" ? "#000" : "#fff");
                    ctx.clip();
                    ctx.drawImage(image, startX, startY, width, height);
                    ctx.restore();
                    fs.unlink(this.imagePath, (err) => {
                        if (err) console.error("Geçici resim silinirken hata:", err);
                    });
                    return height + this.imageMargin;
                } catch (err) {
                    console.error("Tweet resmi çizilirken hata:", err);
                    ctx.fillStyle = "#FF5555";
                    ctx.font = "18px Arial";
                    ctx.fillText("Resim yüklenemedi", this.padding + 30, y + 30);
                    return 60;
                }
            }

            async drawActionBar(ctx, y) {
                const iconSpacing = 150;
                const startX = this.padding + 30;
                ctx.font = "18px Arial";
                ctx.fillStyle = this.theme === "dark" ? "#bbb" : "#555";
                const actions = [
                    { icon: 'reply', count: this.tweetData.comments },
                    { icon: 'retweet', count: this.tweetData.retweets.length },
                    { icon: 'like', count: this.tweetData.likes.length },
                    { icon: 'share', count: 0 }
                ];
                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    const x = startX + i * iconSpacing;
                    try {
                        const iconPath = path.join(__dirname, `../../../../../Global/Assets/Images/${this.iconFiles[action.icon]}`);
                        const iconImg = await loadImage(iconPath);
                        ctx.drawImage(iconImg, x, y - 15, 24, 24);
                    } catch (err) {
                        console.error(`${action.icon} ikonu yüklenemedi:`, err);
                        ctx.fillText(action.icon, x, y);
                    }
                    if (action.count !== null) {
                        ctx.fillText(action.count.toString(), x + 35, y + 5);
                    }
                }
                const now = new Date();
                const hours = now.getHours();
                const minutes = now.getMinutes().toString().padStart(2, '0');
                const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                const timeStr = `${hours}:${minutes} · ${dateStr} · Twitter for Discord`;
                ctx.fillText(timeStr, startX, y - 40);
            }
        }

        const tweetInstance = new Tweet(newTweetRecord, tweetContent, hasImage, imagePath);
        const buffer = await tweetInstance.build();

        const interactionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('yorum')
                .setStyle(ButtonStyle.Secondary)
                .setLabel('Yorum Yap'),
            new ButtonBuilder()
                .setCustomId('tweet:retweet')
                .setStyle(ButtonStyle.Secondary)
                .setLabel('Retweet'),
            new ButtonBuilder()
                .setCustomId('like')
                .setStyle(ButtonStyle.Secondary)
                .setLabel('Beğen'),
            new ButtonBuilder()
                .setCustomId('indir')
                .setStyle(ButtonStyle.Secondary)
                .setLabel('İndir'),
            new ButtonBuilder()
                .setCustomId('interactions')
                .setStyle(ButtonStyle.Secondary)
                .setLabel('İnteractions')
        );
        await interaction.editReply({ content: 'Tweetiniz başarıyla oluşturuldu!' });
        const sentTweetMsg = await interaction.channel.send({ files: [{ attachment: buffer, name: 'tweet.png' }], components: [interactionRow] });

        const updateCanvas = async () => {
            const updatedTweet = await TweetModel.findOne({ tweetId });
            tweetInstance.tweetData = updatedTweet;
            const updatedBuffer = await tweetInstance.build();
            await sentTweetMsg.edit({ files: [{ attachment: updatedBuffer, name: 'tweet.png' }], components: [interactionRow] });
        };
        await sendTweetEmbed(interaction.channel);

        sentTweetMsg.createMessageComponentCollector().on('collect', async i => {
            switch (i.customId) {
                case 'interactions': {
                    const choiceRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('viewLikes')
                            .setLabel('Beğeniler')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('viewRetweets')
                            .setLabel('Retweetler')
                            .setStyle(ButtonStyle.Secondary)
                    );
                    await i.reply({ content: 'Hangi etkileşimleri görüntülemek istersiniz?', components: [choiceRow], ephemeral: true });
                    const choiceMsg = await i.fetchReply();
                    const filter = btn => btn.user.id === i.user.id;
                    try {
                        const choiceInteraction = await choiceMsg.awaitMessageComponent({ filter });
                        if (choiceInteraction.customId === 'viewLikes') {
                            const tweet = await TweetModel.findOne({ tweetId });
                            if (!tweet || tweet.likes.length === 0) {
                                return choiceInteraction.reply({ content: "Henüz beğeni yapılmamış.", ephemeral: true });
                            }
                            const likes = tweet.likes;
                            let currentPage = 0;
                            const totalPages = likes.length;
                            const generateLikeEmbed = (page) => {
                                const like = likes[page];
                                return new EmbedBuilder()
                                    .setTitle(`Beğeni (${page + 1} / ${totalPages})`)
                                    .setColor(0xFF4500)
                                    .setDescription(`Beğenen: **${like.username}**`)
                                    .setFooter({ text: `User ID: ${like.userId}` })
                                    .setTimestamp(new Date(like.likedAt));
                            };

                            const likeMsg = await choiceInteraction.reply({
                                embeds: [generateLikeEmbed(currentPage)],
                                components: [
                                    new ActionRowBuilder().addComponents(
                                        new ButtonBuilder()
                                            .setCustomId(`prevLike-${tweetId}`)
                                            .setLabel('Önceki')
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(currentPage === 0),
                                        new ButtonBuilder()
                                            .setCustomId(`nextLike-${tweetId}`)
                                            .setLabel('Sonraki')
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(currentPage === totalPages - 1)
                                    )
                                ],
                                ephemeral: true,
                                fetchReply: true
                            });

                            const likeCollector = likeMsg.createMessageComponentCollector({ filter });
                            likeCollector.on('collect', async btnInt => {
                                if (btnInt.customId === `prevLike-${tweetId}`) {
                                    currentPage = Math.max(currentPage - 1, 0);
                                } else if (btnInt.customId === `nextLike-${tweetId}`) {
                                    currentPage = Math.min(currentPage + 1, totalPages - 1);
                                }
                                await btnInt.update({
                                    embeds: [generateLikeEmbed(currentPage)],
                                    components: [
                                        new ActionRowBuilder().addComponents(
                                            new ButtonBuilder()
                                                .setCustomId(`prevLike-${tweetId}`)
                                                .setLabel('Önceki')
                                                .setStyle(ButtonStyle.Secondary)
                                                .setDisabled(currentPage === 0),
                                            new ButtonBuilder()
                                                .setCustomId(`nextLike-${tweetId}`)
                                                .setLabel('Sonraki')
                                                .setStyle(ButtonStyle.Secondary)
                                                .setDisabled(currentPage === totalPages - 1)
                                        )
                                    ]
                                });
                            });
                        } else if (choiceInteraction.customId === 'viewRetweets') {
                            const tweet = await TweetModel.findOne({ tweetId });
                            if (!tweet || tweet.retweets.length === 0) {
                                return choiceInteraction.reply({ content: "Henüz retweet yapılmamış.", ephemeral: true });
                            }
                            const retweets = tweet.retweets;
                            let currentPage = 0;
                            const totalPages = retweets.length;
                            const generateRetweetEmbed = (page) => {
                                const retweet = retweets[page];
                                return new EmbedBuilder()
                                    .setTitle(`Retweet (${page + 1} / ${totalPages})`)
                                    .setColor(0x1DA1F2)
                                    .setDescription(`Retweetleyen: **${retweet.username}**`)
                                    .setFooter({ text: `User ID: ${retweet.userId}` })
                                    .setTimestamp(new Date(retweet.retweetedAt));
                            };

                            const retweetMsg = await choiceInteraction.reply({
                                embeds: [generateRetweetEmbed(currentPage)],
                                components: [
                                    new ActionRowBuilder().addComponents(
                                        new ButtonBuilder()
                                            .setCustomId(`prevRetweet-${tweetId}`)
                                            .setLabel('Önceki')
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(currentPage === 0),
                                        new ButtonBuilder()
                                            .setCustomId(`nextRetweet-${tweetId}`)
                                            .setLabel('Sonraki')
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(currentPage === totalPages - 1)
                                    )
                                ],
                                ephemeral: true,
                                fetchReply: true
                            });

                            const retweetCollector = retweetMsg.createMessageComponentCollector({ filter });
                            retweetCollector.on('collect', async btnInt => {
                                if (btnInt.customId === `prevRetweet-${tweetId}`) {
                                    currentPage = Math.max(currentPage - 1, 0);
                                } else if (btnInt.customId === `nextRetweet-${tweetId}`) {
                                    currentPage = Math.min(currentPage + 1, totalPages - 1);
                                }
                                await btnInt.update({
                                    embeds: [generateRetweetEmbed(currentPage)],
                                    components: [
                                        new ActionRowBuilder().addComponents(
                                            new ButtonBuilder()
                                                .setCustomId(`prevRetweet-${tweetId}`)
                                                .setLabel('Önceki')
                                                .setStyle(ButtonStyle.Secondary)
                                                .setDisabled(currentPage === 0),
                                            new ButtonBuilder()
                                                .setCustomId(`nextRetweet-${tweetId}`)
                                                .setLabel('Sonraki')
                                                .setStyle(ButtonStyle.Secondary)
                                                .setDisabled(currentPage === totalPages - 1)
                                        )
                                    ]
                                });
                            });
                        }
                    } catch (err) {
                        console.error("Etkileşim seçimi sırasında hata:", err);
                        await i.followUp({ content: 'İşlem sırasında hata oluştu, lütfen tekrar deneyin.', ephemeral: true });
                    }
                    break;
                }
                case 'like': {
                    const tweet = await TweetModel.findOne({ tweetId });
                    if (!tweet) return i.reply({ content: "Tweet bulunamadı.", ephemeral: true });
                    if (tweet.likes.some(item => item.userId === i.user.id)) {
                        return i.reply({ content: "Bu tweeti zaten beğendin.", ephemeral: true });
                    }
                    tweet.likes.push({
                        userId: i.user.id,
                        username: i.user.username,
                        likedAt: new Date()
                    });
                    await tweet.save();
                    await i.reply({ content: "Tweet başarıyla beğenildi!", ephemeral: true });
                    break;
                }
            
                case 'yorum': {
                    const yorumRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`yorumAt-${tweetId}`)
                            .setLabel('Yorum At')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`yorumGoruntule-${tweetId}`)
                            .setLabel('Yorumları Görüntüle')
                            .setStyle(ButtonStyle.Secondary)
                    );
                    await i.reply({ content: 'Lütfen bir seçenek belirleyin:', components: [yorumRow], ephemeral: true });
                    const replyMsg = await i.fetchReply();
                    const filter = btn => btn.user.id === i.user.id;
                    try {
                        const btnInteraction = await replyMsg.awaitMessageComponent({ filter });
                        if (btnInteraction.customId === `yorumAt-${tweetId}`) {
                            const modal = new ModalBuilder()
                                .setCustomId(`commentModal-${tweetId}`)
                                .setTitle('Tweet Yorum');
                            const commentInput = new TextInputBuilder()
                                .setCustomId('commentInput')
                                .setLabel('Yorumunuz')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true);
                            const modalRow = new ActionRowBuilder().addComponents(commentInput);
                            modal.addComponents(modalRow);
                            await btnInteraction.showModal(modal);
                        } else if (btnInteraction.customId === `yorumGoruntule-${tweetId}`) {
                            const tweet = await TweetModel.findOne({ tweetId });
                            if (!tweet || tweet.commentData.length === 0) {
                                await btnInteraction.reply({ content: "Henüz yorum yapılmamış.", ephemeral: true });
                            } else {
                                const comments = tweet.commentData;
                                let currentPage = 0;
                                const totalPages = comments.length;
                                const generateEmbed = (page) => {
                                    const comment = comments[page];
                                    const embed = new EmbedBuilder()
                                        .setTitle(`Yorum (${page + 1} / ${totalPages})`)
                                        .setColor(0x00AE86)
                                        .setDescription(comment.comment)
                                        .setTimestamp(comment.timestamp ? new Date(comment.timestamp) : new Date())
                                        .setFooter({ text: `Adel Was Here ❤️` });
                                    embed.setAuthor({ name: comment.username, iconURL: comment.profilePic || null });
                                    return embed;
                                };

                                const embedMsg = await btnInteraction.reply({
                                    embeds: [generateEmbed(currentPage)],
                                    components: [
                                        new ActionRowBuilder().addComponents(
                                            new ButtonBuilder()
                                                .setCustomId(`prevPage-${tweetId}`)
                                                .setLabel('Önceki')
                                                .setStyle(ButtonStyle.Secondary)
                                                .setDisabled(currentPage === 0),
                                            new ButtonBuilder()
                                                .setCustomId(`nextPage-${tweetId}`)
                                                .setLabel('Sonraki')
                                                .setStyle(ButtonStyle.Secondary)
                                                .setDisabled(currentPage === totalPages - 1)
                                        )
                                    ],
                                    ephemeral: true,
                                    fetchReply: true
                                });

                                const paginationFilter = btn => btn.user.id === i.user.id &&
                                    (btn.customId === `prevPage-${tweetId}` || btn.customId === `nextPage-${tweetId}`);
                                const paginationCollector = embedMsg.createMessageComponentCollector({ filter: paginationFilter, time: 60000 });
                                paginationCollector.on('collect', async btnInt => {
                                    if (btnInt.customId === `prevPage-${tweetId}`) {
                                        currentPage = currentPage > 0 ? currentPage - 1 : 0;
                                    } else if (btnInt.customId === `nextPage-${tweetId}`) {
                                        currentPage = currentPage < totalPages - 1 ? currentPage + 1 : totalPages - 1;
                                    }
                                    await btnInt.update({
                                        embeds: [generateEmbed(currentPage)],
                                        components: [
                                            new ActionRowBuilder().addComponents(
                                                new ButtonBuilder()
                                                    .setCustomId(`prevPage-${tweetId}`)
                                                    .setLabel('Önceki')
                                                    .setStyle(ButtonStyle.Secondary)
                                                    .setDisabled(currentPage === 0),
                                                new ButtonBuilder()
                                                    .setCustomId(`nextPage-${tweetId}`)
                                                    .setLabel('Sonraki')
                                                    .setStyle(ButtonStyle.Secondary)
                                                    .setDisabled(currentPage === totalPages - 1)
                                            )
                                        ]
                                    });
                                });
                                paginationCollector.on('end', async () => {
                                    try {
                                        await embedMsg.edit({
                                            components: [
                                                new ActionRowBuilder().addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId(`prevPage-${tweetId}`)
                                                        .setLabel('Önceki')
                                                        .setStyle(ButtonStyle.Secondary)
                                                        .setDisabled(true),
                                                    new ButtonBuilder()
                                                        .setCustomId(`nextPage-${tweetId}`)
                                                        .setLabel('Sonraki')
                                                        .setStyle(ButtonStyle.Secondary)
                                                        .setDisabled(true)
                                                )
                                            ]
                                        });
                                    } catch (editErr) {
                                        console.error("Sayfalama bitişinde mesaj güncellenemedi:", editErr);
                                    }
                                });
                            }
                        }
                    } catch (err) {
                        console.error("Yorum seçimi sırasında hata:", err);
                        await i.followUp({ content: 'Zaman aşımına uğradı, lütfen tekrar deneyin.', ephemeral: true });
                    }
                    break;
                }
                case 'indir': {
                    try {
                        const downloadBuffer = await tweetInstance.build();
                        try {
                            await i.user.send({ files: [{ attachment: downloadBuffer, name: 'tweet.png' }] });
                            await i.reply({ content: "Tweet görseli DM üzerinden gönderildi.", ephemeral: true });
                            const tweet = await TweetModel.findOne({ tweetId });
                            tweet.dowlands += 1;
                            await updateCanvas();
                        } catch (dmError) {
                            console.error("DM gönderilemedi:", dmError);
                            await i.reply({ content: "DM gönderilemiyor, tweet görseli aşağıda:", files: [{ attachment: downloadBuffer, name: 'tweet.png' }] });
                        }
                    } catch (err) {
                        console.error("İndir butonu hatası:", err);
                        await i.reply({ content: "Tweet görseli oluşturulurken hata oluştu.", ephemeral: true });
                    }
                    break;
                }
                default:
                    return i.reply({ content: "Bu buton için bir işlem tanımlanmamış.", ephemeral: true });
            }
            await updateCanvas();
        });
        client.on('interactionCreate', async interaction => {
            if (!interaction.isModalSubmit()) return;
            if (interaction.customId.startsWith('commentModal-')) {
                const tweetIdFromModal = interaction.customId.split('-')[1];
                const commentText = interaction.fields.getTextInputValue('commentInput');
                const tweet = await TweetModel.findOne({ tweetId: tweetIdFromModal });
                if (!tweet) return interaction.reply({ content: "Tweet bulunamadı.", ephemeral: true });
                tweet.commentData.push({
                    username: interaction.user.username,
                    comment: commentText,
                    timestamp: new Date(),
                    profilePic: interaction.user.displayAvatarURL({ extension: 'png', size: 1024 })
                });
                tweet.comments += 1;
                await tweet.save();
                await updateCanvas();
                await interaction.reply({ content: 'Yorumunuz kaydedildi!', ephemeral: true });

            }
        });
    }

});



async function sendTweetEmbed(channel) {
    const messages = await channel.messages.fetch({ limit: 50 });
    const oldMessage = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].title === "Tweet At");

    if (oldMessage) {
        await oldMessage.delete().catch(console.error);
    }


    const embed = new EmbedBuilder()
        .setTitle("Tweet At")
        .setDescription("Tweet oluşturmak için aşağıdaki butona tıklayın!")
        .setColor(0x1DA1F2);

    const openModalButton = new ButtonBuilder()
        .setCustomId('tweet:openTweetModal')
        .setLabel('Tweet At')
        .setStyle(ButtonStyle.Secondary);

    const initialRow = new ActionRowBuilder().addComponents(openModalButton);

    await channel.send({ embeds: [embed], components: [initialRow] });
}