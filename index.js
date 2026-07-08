require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const DAYS_REQUIRED = Number(process.env.DAYS_REQUIRED || 7);
const JUNKIE_API_BASE = 'https://api.jnkie.com/api/v2';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

async function createJunkieKey(discordId) {
  const res = await fetch(`${JUNKIE_API_BASE}/keys`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.JUNKIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider_id: Number(process.env.JUNKIE_PROVIDER_ID),
      service_id: Number(process.env.JUNKIE_SERVICE_ID),
      is_premium: true, // premium keys skip the ad/checkpoint flow entirely
      validity_minutes: Number(process.env.KEY_VALIDITY_MINUTES || 720),
      discord_id: discordId,
      key_name: `getkey-${discordId}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Junkie API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.key.key_value;
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'getkey') return;

  await interaction.deferReply({ ephemeral: true });

  const joinedAt = interaction.member.joinedAt;
  if (!joinedAt) {
    return interaction.editReply(
      "Couldn't read your join date — try again in a moment."
    );
  }

  const daysInServer = (Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24);
  const daysRemaining = DAYS_REQUIRED - daysInServer;

  if (daysRemaining > 0) {
    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle('⏳ Not yet eligible')
      .setDescription(
        `You need to be in the server for **${DAYS_REQUIRED} days** before you can get a key.\n` +
          `Time remaining: **${daysRemaining.toFixed(1)} days**`
      );
    return interaction.editReply({ embeds: [embed] });
  }

  try {
    const key = await createJunkieKey(interaction.user.id);
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('🔑 Your key')
      .setDescription(
        `\`${key}\`\n\nPaste this into the script's key box in the Hunt tab.`
      );
    return interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error(err);
    return interaction.editReply(
      'Something went wrong generating your key. Contact staff.'
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
