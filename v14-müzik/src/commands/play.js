const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js")
const db = require("croxydb")
const languagefile = require("../language.json")
module.exports = {
  data: new SlashCommandBuilder()
  .setName("play")
  .setDescription("🎵| Müzik Oynatılıyor")
  .addStringOption(option => option.setName("name").setDescription("Müzik İsmi").setRequired(true)),
  run: async (client, interaction, track) => {
    await interaction.deferReply().catch(err => {})
    const string = interaction.options.getString("name")
    let voiceChannel = interaction.member.voice.channel
    const language = db.fetch(`language_${interaction.user.id}`)

    if (!language) {
      if (!voiceChannel) return interaction.followUp({content: "Ses Kanalında Değilsin"})
      const queue = client.distube.getQueue(interaction);

      client.distube.voices.join(voiceChannel)

      await client.distube.play(interaction.member.voice.channel, string);
      const tracks = await client.player.search(string, {
        requestedBy: interaction.user
      }).then(x => x.tracks[0]);

      if (!tracks) return interaction.followUp("🎵 | Müzik Başladı")
      const embed = new Discord.EmbedBuilder()
      .addFields({name: "Başlık", value: `${tracks.title}`, inline: true})
      .addFields({name: "Yükleyen", value: `${tracks.author}`, inline: true})
      .addFields({name: "Zaman", value: `${tracks.duration}`, inline: true})
      .addFields({name: "Görüntüleyenler", value: `${tracks.views}`, inline: true})
      .addFields({name: "Video Kapağı", value: "[Tıkla]("+tracks.thumbnail+")", inline: true})
      .addFields({name: "Video Linki", value: "[Tıkla]("+tracks.url+")", inline: true})
      .setColor("Aqua")
      .setImage(`${tracks.thumbnail || "https://cdn.discordapp.com/attachments/1054464677083627661/1054465851782344816/1.gif"}`)
      
      const row = new Discord.ActionRowBuilder()
      .addComponents(
        new Discord.ButtonBuilder()
        .setEmoji("🎵")
        .setLabel("Müziği Durdur")
        .setStyle(Discord.ButtonStyle.Secondary)
        .setCustomId("dur"),
        new Discord.ButtonBuilder()
        .setEmoji("🔊")
        .setLabel("Müziğin Sesini Aç")
        .setStyle(Discord.ButtonStyle.Secondary)
        .setCustomId("volume"),
        new Discord.ButtonBuilder()
        .setEmoji("⏩")
        .setLabel("Müziği Geç")
        .setStyle(Discord.ButtonStyle.Secondary)
        .setCustomId("skip"),
        new Discord.ButtonBuilder()
        .setEmoji("🌀")
        .setLabel("Müziği Döngüle")
        .setStyle(Discord.ButtonStyle.Secondary)
        .setCustomId("loop"),
        new Discord.ButtonBuilder()
        .setEmoji("🎶")
        .setLabel("Şimdi Oynuyor")
        .setStyle(Discord.ButtonStyle.Secondary)
        .setCustomId("soru")
      )

      const row2 = new Discord.ActionRowBuilder()
      .addComponents(
        new Discord.ButtonBuilder()
        .setEmoji("🥁")
        .setLabel("Sesi Kuvvetlendir")
        .setStyle(Discord.ButtonStyle.Secondary)
        .setCustomId("bassboost"),
        new Discord.ButtonBuilder()
        .setEmoji("<:slowmode:740952943460614185>")
        .setLabel("Yavaş Mod")
        .setStyle(Discord.ButtonStyle.Secondary)
        .setCustomId("slowmode"),
        new Discord.ButtonBuilder()
        .setEmoji("💨")
        .setLabel("Hızlı")
        .setStyle(Discord.ButtonStyle.Secondary)
        .setCustomId("fast"),
        new Discord.ButtonBuilder()
        .setLabel("Destek Sunucusu")
        .setStyle(Discord.ButtonStyle.Link)
        .setURL("https://discord.gg/GbJGMJEDPR")
      )

      await interaction.followUp({embeds: [embed], components: [row, row2]}).then(messages => {
        db.set(`music_${interaction.guild.id}`, { kanal: interaction.channel.id, mesaj: messages.id, muzik: string, user: interaction.user.id, başlık: tracks.title, yükleyen: tracks.author, süre: tracks.duration, görüntülenme: tracks.views, thumb: tracks.thumbnail, video: tracks.url})
      })
    }
  }
}