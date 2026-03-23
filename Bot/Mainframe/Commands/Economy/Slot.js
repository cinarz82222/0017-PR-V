const { EmbedBuilder } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

function selectSymbol(symbols) {
    const totalLuck = Object.values(symbols).reduce((acc, { luck }) => acc + luck, 0);
    let random = Math.random() * totalLuck;
    for (const symbol of Object.values(symbols)) {
        if (random < symbol.luck) return symbol;
        random -= symbol.luck;
    }
    return Object.values(symbols)[0];
}

module.exports = {
    Name: 'slot',
    Aliases: ['s', 'slots'],
    Description: 'Discord temalı ultra görsel slot oyunu!',
    Usage: 'slot <miktar>',
    Category: 'Economy',
    Cooldown: 10,
    Permissions: { User: [], Role: [] },
    Command: { Prefix: true },

    messageRun: async (client, message, args) => {
        let document = await UserModel.findOne({ id: message.author.id });
        if (!document) document = new UserModel({ id: message.author.id });

        let amount = Number(args[0]);
        if (args[0] === 'all') amount = Math.min(Math.max(document.inventory?.cash || 0, 10), 10000);
        if (isNaN(amount) || amount < 10 || amount > 10000 || amount > (document.inventory?.cash || 0)) {
            return client.embed(message, 'Lütfen 10 ile 10.000 arasında geçerli bir miktar giriniz!');
        }

        document.inventory = document.inventory || { cash: 0 };
        document.inventory.cash -= amount;
        document.markModified('inventory');

        const symbols = {
            '💎': { emoji: '💎', multiplier: 8, luck: 5 },
            '🎰': { emoji: '🎰', multiplier: 6, luck: 10 },
            '7️⃣': { emoji: '7️⃣', multiplier: 4, luck: 20 },
            '🍒': { emoji: '🍒', multiplier: 3, luck: 25 },
            '🍋': { emoji: '🍋', multiplier: 2, luck: 30 },
            '🍎': { emoji: '🍎', multiplier: 1.5, luck: 30 }
        };

        const loadingEmbed = new EmbedBuilder()
            .setTitle('🎰 Slot Makinesi Dönüyor...')
            .setColor('#8b5cf6')
            .setDescription(['```css', '[ 🔄 ] [ 🔄 ] [ 🔄 ]', '```', `💰 Bahis: **${amount}$**`].join('\n'))
            .setFooter({ text: `Oyuncu: ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
        const loadingMsg = await message.channel.send({ embeds: [loadingEmbed] });
        await new Promise(r => setTimeout(r, 1500));

        const slot1 = selectSymbol(symbols);
        const slot2 = selectSymbol(symbols);
        const slot3 = selectSymbol(symbols);

        let resultTitle = '';
        let streakBonus = 0;
        let multiplier = 1;
        if (slot1.emoji === slot2.emoji && slot2.emoji === slot3.emoji) {
            multiplier = slot1.multiplier * 3;
            resultTitle = '🌟 JACKPOT!';
        } else if (slot1.emoji === slot2.emoji || slot2.emoji === slot3.emoji || slot1.emoji === slot3.emoji) {
            const matched = slot1.emoji === slot2.emoji ? slot1 : slot2.emoji === slot3.emoji ? slot2 : slot1;
            multiplier = matched.multiplier;
            resultTitle = '✨ Eşleşme!';
        } else {
            resultTitle = '💔 Kaybettin!';
        }
        const isWin = multiplier > 1;
        let gains = 0;
        if (isWin) {
            document.games = document.games || { currentStreak: 0, totalWins: 0, totalLosses: 0, maxStreak: 0 };
            document.games.currentStreak++;
            document.games.totalWins++;
            streakBonus = document.games.currentStreak * (multiplier > 3 ? 10 : 5);
            gains = Math.floor(amount * multiplier * (1 + streakBonus / 100));
        } else {
            document.games = document.games || { currentStreak: 0, totalWins: 0, totalLosses: 0, maxStreak: 0 };
            document.games.currentStreak = 0;
            document.games.totalLosses++;
        }

        document.inventory.cash += gains;
        document.games.maxStreak = Math.max(document.games.maxStreak || 0, document.games.currentStreak);
        document.markModified('inventory');
        document.markModified('games');

        const expGain = Math.floor(Math.random() * 5) + 1;
        document.level = document.level || { current: 1, exp: 0 };
        const oldLevel = document.level.current;
        document.level.exp += expGain;
        let leveledUp = false;
        if (document.level.exp >= oldLevel * 100) {
            document.level.exp -= oldLevel * 100;
            document.level.current++;
            leveledUp = true;
        }
        document.markModified('level');
        await document.save();

        const resultEmbed = new EmbedBuilder()
            .setColor('#8b5cf6')
            .setTitle('🎰 Slot Sonucu')
            .setDescription([
                '```',
                `  ${slot1.emoji}  |  ${slot2.emoji}  |  ${slot3.emoji}`,
                '```',
                '',
                `**${resultTitle}**`,
                '',
                `💰 Bahis: **${amount}$**`,
                `💵 Kazanç: **${gains}$**${streakBonus ? ` (+${streakBonus}% seri)` : ''}`,
                `📈 EXP: +${expGain}${leveledUp ? ` | Seviye: ${oldLevel} → ${document.level.current}` : ''}`
            ].join('\n'))
            .setFooter({ text: `Streak: ${document.games.currentStreak} | W: ${document.games.totalWins} | L: ${document.games.totalLosses}`, iconURL: message.author.displayAvatarURL() })
            .setThumbnail(message.guild.iconURL({ size: 256 }));

        await loadingMsg.edit({ embeds: [resultEmbed] });
    }
};
