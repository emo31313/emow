const { ActivityType } = require("discord.js")
module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
  client.user.setPresence({activities: [{name:"TRZ Code", type: ActivityType.Watching}], status:"idle"});
}};
