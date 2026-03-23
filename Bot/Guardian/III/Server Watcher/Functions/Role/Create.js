const { checkWhitelist } = require('../../../../Utils/Functions.js');

module.exports = async function roleCreate(client, guild, audit, member, changes, luhux) {
	const safeMode = await checkWhitelist(client, member, 'role');
	if (safeMode?.isWarn) return;

	guild.roles.cache.get(audit.targetId).delete({ reason: 'luhux ~ Güvenlik Sistemi' });
};
