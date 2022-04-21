const InteractionCommand = require('../../../../../Structures/Interaction');
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, SelectMenuBuilder } = require('@discordjs/builders');
const { ButtonStyle, ComponentType } = require('discord-api-types/v10');
const { Colors } = require('../../../../../Utils/Constants');
const { nanoid } = require('nanoid');
const axios = require('axios');

module.exports = class extends InteractionCommand {

	constructor(...args) {
		super(...args, {
			name: ['search', 'steam'],
			description: 'Search for a Games on Steam.'
		});
	}

	async run(interaction) {
		const search = await interaction.options.getString('search', true);

		const response = await axios.get(`https://store.steampowered.com/api/storesearch/?term=${search}&l=en&cc=us`).then(({ data }) => data.items.filter(({ type }) => type === 'app'));
		if (!response.length) return interaction.reply({ content: 'Nothing found for this search.', ephemeral: true });

		const menuId = `menu-${nanoid()}`;
		const menu = new ActionRowBuilder()
			.addComponents(new SelectMenuBuilder()
				.setCustomId(menuId)
				.setPlaceholder('Select a game!')
				.addOptions(...response.map(data => ({
					label: data.name,
					value: data.id.toString()
				}))));

		const reply = await interaction.reply({ content: `I found **${response.length}** possible matches, please select one of the following:`, components: [menu] });

		const filter = (i) => i.customId === menuId;
		const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.SelectMenu, time: 60000 });

		collector.on('collect', async (i) => {
			if (i.user.id !== interaction.user.id) return i.deferUpdate();
			await i.deferUpdate();

			const [ids] = i.values;
			const data = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${ids}&l=en&cc=us`).then(res => res.data[ids].data);

			const button = new ActionRowBuilder()
				.addComponents(new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel('Open in Browser')
					.setURL(`https://store.steampowered.com/app/${data.steam_appid}/`));

			const embed = new EmbedBuilder()
				.setColor(Colors.Default)
				.setAuthor({ name: 'Steam', iconURL: 'https://i.imgur.com/xxr2UBZ.png', url: 'http://store.steampowered.com/' })
				.setTitle(data.name)
				.setDescription(data.short_description)
				.addFields({ name: '__Detail__', value: [
					`***Release Date:*** ${data.release_date.coming_soon ? 'Coming soon' : data.release_date.date}`,
					`***Price:*** \`${data.price_overview ? data.price_overview.final_formatted : 'Free'}\``,
					`***Genres:*** ${data.genres.map(({ description }) => description).join(', ')}`,
					`***Platform:*** ${data.platforms ? this.client.utils.formatArray(Object.keys(data.platforms).filter(item => data.platforms[item])).toTitleCase().replace(/And/g, 'and') : '`N/A`'}`,
					`***Metascores:*** ${data.metacritic ? `${data.metacritic.score} from [metacritic](${data.metacritic.url})` : '`N/A`'}`,
					`***Developers:*** ${data.developers.join(', ')}`,
					`***Publishers:*** ${data.publishers.join(', ')}`,
					`${data.content_descriptors?.notes ? `\n*${data.content_descriptors.notes.replace(/\r|\n/g, '')}*` : ''}`
				].join('\n'), inline: false })
				.setImage(data.header_image)
				.setFooter({ text: 'Powered by Steam', iconURL: interaction.user.avatarURL() });

			return i.editReply({ content: null, embeds: [embed], components: [button] });
		});

		collector.on('end', (collected, reason) => {
			if ((!collected.size || !collected.filter(({ user }) => user.id === interaction.user.id).size) && reason === 'time') {
				return interaction.deleteReply();
			}
		});
	}

};
