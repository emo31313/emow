const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js")
const db = require("croxydb")
const languagefile = require("../language.json")
module.exports = {
  data: new SlashCommandBuilder()
  .setName("nowplaying")
  .setDescription("🎵 | Çalan şarkı hakkında bilgi alırsınız."),
  run: async (client, interaction) => {
    await interaction.deferReply().catch(err => {})
    const queue = client.distube.getQueue(interaction);
    if (!queue) return interaction.followUp(`Listede henüz şarkı yok.`).catch(err => {})
    const part = Math.floor((queue.currentTime / queue.songs[0].duration) * 20);
    const embed = new EmbedBuilder()
    .setColor('Purple')
    .setDescription(`**[${queue.songs[0].name}](${queue.songs[0].url})**`)
    .addFields({ name: 'Müzisyen:', value: `[${queue.songs[0].uploader.name}](${queue.songs[0].uploader.url})`, inline: true })
    .addFields({ name: 'Müziği Çalan Kişi:', value: `${queue.songs[0].user}`, inline: true })
    .addFields({ name: 'Ses:', value: `${queue.volume}%`, inline: true })
    .addFields({ name: 'Görüntülemeler:', value: `${queue.songs[0].views}`, inline: true })
    .addFields({ name: 'Beğenmeler:', value: `${queue.songs[0].likes}`, inline: true })
    .addFields({ name: 'Filtre:', value: `${queue.filters.names.join(', ') || "Normal"}`, inline: true })
    .addFields({ name: `Video Zamanı: **[${queue.formattedCurrentTime} / ${queue.songs[0].formattedDuration}]**`, value: ` ${'<a:muzikbaslangic:1054716630975918080>' + '<a:muzikdoluorta:1054716636143300618>'.repeat(part) + '<:muzikbosorta:1054716634780160020>'.repeat(20 - part) + '<:muzikbitis:1054716632926265424>'}`, inline: false })
    return interaction.followUp({embeds: [embed]}).catch(err => {})

    try {
    } catch (e) {
      return;
    }
  }
}