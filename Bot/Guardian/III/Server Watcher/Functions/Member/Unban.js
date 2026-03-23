const { checkWhitelist } = require('../../../../Utils/Functions.js');

module.exports = async function memberUnban(client, guild, audit, member, changes) {
  const safeMode = await checkWhitelist(client, member, 'memberUpdate');
  if (safeMode?.isWarn) return;

  guild.bans.create(audit.targetId, { reason: 'luhux ~ Güvenlik Sistemi' }).catch(err => { });
}