require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('getkey')
    .setDescription(
      'Get your Boss Hunter Script key (requires being in the server for a set number of days)'
    ),
].map((c) => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    // Guild-scoped registration: updates instantly, good for a single-server bot.
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Slash command /getkey registered.');
  } catch (err) {
    console.error(err);
  }
})();
