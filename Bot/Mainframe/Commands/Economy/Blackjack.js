const { bold } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');
const BlackJack = require('../../../../Global/Base/Utils');

module.exports = {
  Name: 'blackjack',
  Aliases: ['bj'],
  Description: 'Blackjack oynamanıza yarar.',
  Usage: 'blackjack <10-10000-all>',
  Category: 'Economy',
  Cooldown: 10,

  Permissions: { User: [], Role: [] },
  Command: { Prefix: true },

  messageRun: async (client, message, args) => {
    let document = await UserModel.findOne({ id: message.author.id });
    if (!document) document = new UserModel({ id: message.author.id });

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
    const game = await BlackJack(message, {
      buttons: true,
      transition: 'edit',
      bahis: amount,
      odul: winAmount,
      doubleodul: winAmount * 2
    });

    let isWin = false;
    let isDouble = false;
    if (game.result === 'BLACKJACK' || game.result.includes('DOUBLE WIN')) {
      document.inventory.cash += winAmount * 2;
      isWin = true;
      isDouble = true;
    } else if (
      game.result.includes('WIN') ||
      game.result.includes('INSURANCE')
    ) {
      document.inventory.cash += winAmount;
      isWin = true;
    } else if (game.result.includes('TIE')) {
      document.inventory.cash += winAmount;
    } else {
      isWin = false;
    }

    if (game.result !== 'CANCEL' && game.result !== 'TIMEOUT' && !game.result.includes('TIE')) {
      if (isWin) {
        document.games.currentStreak += 1;
        document.games.totalWins += 1;
        if (document.games.currentStreak > document.games.maxStreak) {
          document.games.maxStreak = document.games.currentStreak;
        }
      } else {
        document.games.currentStreak = 0;
        document.games.totalLosses += 1;
      }
      document.markModified('games');
    }
    document.markModified('inventory');

    const expGain = Math.floor(Math.random() * 5) + 1; 
    const oldLevel = document.level.current;
    document.level.exp += expGain;
    let leveledUp = false;
    const threshold = oldLevel * 100;
    if (document.level.exp >= threshold) {
      document.level.exp -= threshold;
      document.level.current += 1;
      leveledUp = true;
    }
    document.markModified('level');

    await document.save();
    let content = `> **${amount}$** için bahis sonuçlandı ve **${game.result}**! (+${expGain} exp)`;  
    message.channel.send({content: content});
    if (leveledUp) {
      content += `
**Tebrikler! Seviye atladın: ${oldLevel} ➔ ${document.level.current}!**`;
      message.channel.send({content: content});
    }
   
  },
};
