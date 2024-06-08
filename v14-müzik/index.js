const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js")
const Discord = require("discord.js")
const client = new Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.MessageContent
  ]
})
const config = require("./src/config.js");
const { readdirSync } = require("fs")
const moment = require("moment");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { DisTube } = require('distube')
const { SpotifyPlugin } = require('@distube/spotify')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { YtDlpPlugin } = require('@distube/yt-dlp')
const { Player } = require("discord-player")
const db = require("croxydb")
const languagefile = require("./src/language.json")
const player = new Player(client);
client.player = player;
client.distube = new DisTube(client, {
  leaveOnStop: false,
  leaveOnFinish: true,
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  plugins: [
    new SpotifyPlugin({
      emitEventsAfterFetching: true
    }),
    new SoundCloudPlugin(),
    new YtDlpPlugin()
  ]
})
let token = config.token

client.commands = new Collection()

const rest = new REST({ version: '10' }).setToken(token);

const commands = [];
readdirSync('./src/commands').forEach(async file => {
  const command = require(`./src/commands/${file}`);
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
})

client.distube.on("finish", queue => {
  client.guilds.cache.filter(guild => {
    const data = db.fetch(`music_${guild.id}`)
    if (!data) return;
    const mesaj = data.mesaj
    const channels = data.kanal
    const channel = guild.channels.cache.get(channels)
    const messagef = channel.messages.fetch(mesaj).then(async messagef => {
      messagef.edit({content: "🎵 | Müzik Bitti.", embeds: [], components: []}).catch(err => {})
    })
  })
})

client.on("ready", async () => {
  client.guilds.cache.filter(guild => {
    const data = db.fetch(`music_${guild.id}`)
    if (!data) return;
    db.delete(`music_${guild.id}`)
  })
})

client.on("ready", async () => {
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
  } catch (error) {
    console.error(error);
  }
  console.log(`${client.user.tag} Bot Aktif!`);
})

readdirSync('./src/events').forEach(async file => {
	const event = require(`./src/events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
})

client.on("interactionCreate", interaction => {
  if (interaction.customId === "fast") {
    const queue = client.distube.getQueue(interaction);
    if (!queue) return interaction.reply(`Listede henüz bir şarkı yok.`)
    let data = db.fetch(`music_${interaction.guild.id}`)
    if (!data) return interaction.reply({content: "Üzgünüm.Hata **404**", ephemeral: true})
    queue.filters.add("nightcore")
    interaction.reply({content: "Hızlı Mod Aktif!", ephemeral: true})
  }
  
  if (interaction.customId === "slowmode") {
    const queue = client.distube.getQueue(interaction);
    if (!queue) return interaction.reply(`Listede henüz bir şarkı yok.`)
    let data = db.fetch(`music_${interaction.guild.id}`)
    if (!data) return interaction.reply({content: "Üzgünüm.Hata **404**", ephemeral: true})
    queue.filters.add("vaporwave")
    interaction.reply({content: "Yavaş Mod Aktif!", ephemeral: true})
  }
  
  if (interaction.customId === "bassboost") {
    const queue = client.distube.getQueue(interaction);
    if (!queue) return interaction.reply(`Listede henüz bir şarkı yok.`)
    let data = db.fetch(`music_${interaction.guild.id}`)
    if (!data) return interaction.reply({content: "Üzgünüm.Hata **404**", ephemeral: true})
    queue.filters.add("bassboost")
    interaction.reply({content: "Bas kuvvetlendirme Aktif!", ephemeral: true})
  }

  if (interaction.customId === "soru") {
    const queue = client.distube.getQueue(interaction);
    if (!queue) return interaction.reply(`Listede henüz bir şarkı yok.`)
    let data = db.fetch(`music_${interaction.guild.id}`)
    if (!data) return interaction.reply({content: "Üzgünüm.Hata **404**", ephemeral: true})
    const part = Math.floor((queue.currentTime / queue.songs[0].duration) * 20);
    const embed = new Discord.EmbedBuilder()
    .setColor('Purple')
    .setDescription(`**[${queue.songs[0].name}](${queue.songs[0].url})**`)
    .setImage(`${queue.songs[0].thumbnail}`)
    .addFields({ name: 'Müzisyen:', value: `[${queue.songs[0].uploader.name}](${queue.songs[0].uploader.url})`, inline: true })
    .addFields({ name: 'Müziği Çalan Kişi:', value: `${queue.songs[0].user}`, inline: true })
    .addFields({ name: 'Ses:', value: `${queue.volume}%`, inline: true })
    .addFields({ name: 'Görüntülemeler:', value: `${queue.songs[0].views}`, inline: true })
    .addFields({ name: 'Beğenmeler:', value: `${queue.songs[0].likes}`, inline: true })
    .addFields({ name: 'Filtre:', value: `${queue.filters.names.join(', ') || "Normal"}`, inline: true })
    .addFields({ name: `Video Zamanı: **[${queue.formattedCurrentTime} / ${queue.songs[0].formattedDuration}]**`, value: ` ${'<a:muzikbaslangic:1054716630975918080>' + '<a:muzikdoluorta:1054716636143300618>'.repeat(part) + '<:muzikbosorta:1054716634780160020>'.repeat(20 - part) + '<:muzikbitis:1054716632926265424>'}`, inline: false })
    return interaction.reply({embeds: [embed], ephemeral: true}).catch(err => {})
  }

  if (interaction.customId === "dur") {
    const queue = client.distube.getQueue(interaction);
    if (!queue) return interaction.reply(`Listede henüz bir şarkı yok.`)
    let data = db.fetch(`music_${interaction.guild.id}`)
    if (!data) return interaction.reply({content: "Üzgünüm.Hata **404**", ephemeral: true})
    let usır = data.user
    let string = data.string
    if (interaction.user.id !== usır) return interaction.reply({content: "Bu düğmeyi yalnızca komutu yazan kişi kullanabilir.", ephemeral: true})
    const baslik = data.başlık
    const author = data.yükleyen
    const sure = data.süre
    const izlenme = data.görüntülenme
    const thumb = data.thumb
    const url = data.video
    const embed = new Discord.EmbedBuilder()
    .addFields({name: "Başlık", value: `${baslik}`, inline: true})
    .addFields({name: "Yükleyen", value: `${author}`, inline: true})
    .addFields({name: "Zaman", value: `${sure}`, inline: true})
    .addFields({name: "Görüntülemeler", value: `${izlenme}`, inline: true})
    .addFields({name: "Video Kapağı", value: "[Tıkla]("+thumb+")", inline: true})
    .addFields({name: "Video Linki", value: "[Tıkla]("+url+")", inline: true})
    .setColor("Aqua")
    .setImage(`${thumb}`)
    const row = new Discord.ActionRowBuilder()
    .addComponents(
      new Discord.ButtonBuilder()
      .setEmoji("🎵")
      .setLabel("Müziği Kaldığın Yerden Devam Ettir")
      .setStyle(Discord.ButtonStyle.Danger)
      .setCustomId("devam")
    )

    client.distube.pause(interaction)
    return interaction.update({embeds: [embed], components: [row]})
  }

  if (interaction.customId === "skip") {
    const queue = client.distube.getQueue(interaction);
    if (!queue) return interaction.reply(`Listede henüz bir şarkı yok.`)
    let data = db.fetch(`music_${interaction.guild.id}`)
    if (!data) return interaction.reply({content: "Üzgünüm.Hata **404**", ephemeral: true})
    if (queue.songs.length === 1) return interaction.reply("Kuyrukta şarkı bulunamadı!")
    let usır = data.user
    let string = data.string
    if (interaction.user.id !== usır) return interaction.reply({content: "Bu düğmeyi yalnızca komutu yazan kişi kullanabilir.", ephemeral: true})
    const baslik = data.başlık
    const author = data.yükleyen
    const sure = data.süre
    const izlenme = data.görüntülenme
    const thumb = data.thumb
    const url = data.video
    const embed = new Discord.EmbedBuilder()
    .addFields({name: "Başlık", value: `${baslik}`, inline: true})
    .addFields({name: "Yükleyen", value: `${author}`, inline: true})
    .addFields({name: "Zaman", value: `${sure}`, inline: true})
    .addFields({name: "Görüntüleyenler", value: `${izlenme}`, inline: true})
    .addFields({name: "Video Kapağı", value: "[Tıkla]("+thumb+")", inline: true})
    .addFields({name: "Video Linki", value: "[Tıkla]("+url+")", inline: true})
    .setColor("Aqua")
    .setImage(`${thumb}`)

    client.distube.skip(interaction)
    return interaction.update({embeds: [embed]})
  }

  if (interaction.customId === "loop") {
    const queue = client.distube.getQueue(interaction);
    if (!queue) return interaction.reply(`Listede henüz bir şarkı yok.`)
    let data = db.fetch(`music_${interaction.guild.id}`)
    if (!data) return interaction.reply({content: "Üzgünüm.Hata **404**", ephemeral: true})
    let usır = data.user
    let string = data.string
    if (interaction.user.id !== usır) return interaction.reply({content: "Bu düğmeyi yalnızca komutu yazan kişi kullanabilir.", ephemeral: true})
    const baslik = data.başlık
    const author = data.yükleyen
    const sure = data.süre
    const izlenme = data.görüntülenme
    const thumb = data.thumb
    const url = data.video
    const embed = new Discord.EmbedBuilder()
    .addFields({name: "Başlık", value: `${baslik}`, inline: true})
    .addFields({name: "Yükleyen", value: `${author}`, inline: true})
    .addFields({name: "Zaman", value: `${sure}`, inline: true})
    .addFields({name: "Görüntüleyenler", value: `${izlenme}`, inline: true})
    .addFields({name: "Video Kapağı", value: "[Tıkla]("+thumb+")", inline: true})
    .addFields({name: "Video Linki", value: "[Tıkla]("+url+")", inline: true})
    .setColor("Aqua")
    .setImage(`${thumb || "https://cdn.discordapp.com/attachments/1054464677083627661/1054465851782344816/1.gif"}`)
    client.distube.setRepeatMode(interaction, 1);
    return interaction.update({embeds: [embed]})
  }

  if (interaction.customId === "devam") {
    const queue = client.distube.getQueue(interaction);
    if (!queue) return interaction.reply(`Listede henüz bir şarkı yok.`)
    let data = db.fetch(`music_${interaction.guild.id}`)
    if (!data) return interaction.reply({content: "Üzgünüm.Hata **404**", ephemeral: true})
    let usır = data.user
    let string = data.string
    if (interaction.user.id !== usır) return interaction.reply({content: "Bu düğmeyi yalnızca komutu yazan kişi kullanabilir.", ephemeral: true})
    const baslik = data.başlık
    const author = data.yükleyen
    const sure = data.süre
    const izlenme = data.görüntülenme
    const thumb = data.thumb
    const url = data.video
    const embed = new Discord.EmbedBuilder()
    .addFields({name: "Başlık", value: `${baslik}`, inline: true})
    .addFields({name: "Yükleyen", value: `${author}`, inline: true})
    .addFields({name: "Zaman", value: `${sure}`, inline: true})
    .addFields({name: "Görüntüleyenler", value: `${izlenme}`, inline: true})
    .addFields({name: "Video Kapağı", value: "[Tıkla]("+thumb+")", inline: true})
    .addFields({name: "Video Linki", value: "[Tıkla]("+url+")", inline: true})
    .setColor("Aqua")
    .setImage(`${thumb}`)
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
      .setEmoji("❓")
      .setLabel("Şuanda Ne Oynatılıyor")
      .setStyle(Discord.ButtonStyle.Secondary)
      .setCustomId("soru")
    )

    const row2 = new Discord.ActionRowBuilder()
    .addComponents(
      new Discord.ButtonBuilder()
      .setEmoji("🥁")
      .setLabel("Sesi Kuvvetlendirme")
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
    client.distube.resume(interaction)
    interaction.update({embeds: [embed], components: [row, row2]})
  }
})

const modal = new Discord.ModalBuilder()
.setCustomId('form')
.setTitle('TRZ - Müzik Bot')
const a1 = new Discord.TextInputBuilder()
.setCustomId('setvolume')
.setLabel('Ses')
.setStyle(Discord.TextInputStyle.Paragraph)
.setMinLength(1)
.setPlaceholder('1 - 100')
.setRequired(true)

const row = new Discord.ActionRowBuilder().addComponents(a1);
modal.addComponents(row);

client.on('interactionCreate', async (interaction) => {
	if(interaction.customId === "volume"){
    await interaction.showModal(modal);
	}
})

client.on('interactionCreate', async interaction => {
  if (interaction.type !== Discord.InteractionType.ModalSubmit) return;
  if (interaction.customId === 'form') {
    const string = interaction.fields.getTextInputValue('setvolume')
    const volume = parseInt(string)
    const queue = client.distube.getQueue(interaction);
    if (!queue) return interaction.reply(`Listede henüz bir şarkı yok.`)
    if (isNaN(volume)) return interaction.reply("Bana sayı ver!")
    if (volume < 1) return interaction.reply("Sayı 1'den az olmamalıdır.")
    if (volume > 100) return interaction.reply("Sayı 100'den büyük olmamalıdır.")
    client.distube.setVolume(interaction, volume);
    interaction.reply("Müziğin sesini başarıyla şu şekilde ayarlandı: **"+volume+"**")
  }
})

client.login(token)