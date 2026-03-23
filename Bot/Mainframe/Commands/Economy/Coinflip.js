const { bold } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'coinflip',
    Aliases: ['cf'],
    Description: 'Coinflip oyununu oynamanızı sağlar.',
    Usage: 'coinflip <10-10000-all>',
    Category: 'Economy',
    Cooldown: 10,
    
    Permissions: { User: [], Role: [] },
    Command: { Prefix: true },
    
    messageRun: async (client, message, args) => {
        const document = await UserModel.findOne({ id: message.author.id })
            || new UserModel({ id: message.author.id });
        
        let amount = Number(args[0]);
        if (args[0] === 'all') {
            amount = Math.min(Math.max(document.inventory.cash, 10), 10000);
        }
        
        if (isNaN(amount) || amount < 10 || amount > 10000 || amount > document.inventory.cash) {
            return client.embed(message, 'Lütfen 10 ile 10.000 arasında ve sahip olduğunuz miktarda geçerli bir rakam giriniz!');
        }
        
        document.inventory.cash -= amount;
        document.markModified('inventory');
        

        const winAmount = amount * 2;
        const formattedWin = winAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const msg = await message.channel.send({ content: `${bold(formattedWin + '$')} için bahis atılıyor...` });
        
        setTimeout(async () => {
            const rnd = Math.floor(Math.random() * 2);
            let resultText;

            if (rnd === 1) {
                resultText = 'kazandın';
                document.inventory.cash += winAmount;
                document.games.currentStreak += 1;
                document.games.totalWins += 1;
                if (document.games.currentStreak > document.games.maxStreak) {
                    document.games.maxStreak = document.games.currentStreak;
                }
            } else {
                resultText = 'kaybettin';
                document.games.currentStreak = 0;
                document.games.totalLosses += 1;
            }
            document.markModified('games');

            const expGain = Math.floor(Math.random() * 5) + 1;
            document.level.exp += expGain;
            let leveledUp = false;
            const threshold = document.level.current * 100;
            if (document.level.exp >= threshold) {
                document.level.exp -= threshold;
                document.level.current += 1;
                leveledUp = true;
            }
            document.markModified('level');

            let content = `> **${formattedWin}$** için bahis sonuçlandı ve **${resultText}**! (+${expGain} exp)`;
            if (leveledUp) content += `
**Tebrikler! Seviye atladın: ${document.level.current - 1} ➔ ${document.level.current}!**`;

            await msg.edit({ content });
            await document.save();
        }, 4000);
    },
};
