import Command from '../../../../Structures/Interaction.js';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, SelectMenuBuilder } from '@discordjs/builders';
import { ButtonStyle, ComponentType } from 'discord-api-types/v10';
import { time } from 'discord.js';
import { Colors } from '../../../../Utils/Constants.js';
import { DurationFormatter } from '@sapphire/time-utilities';
import { cutText, formatArray, isRestrictedChannel, parseHTMLEntity } from '../../../../Structures/Util.js';
import { nanoid } from 'nanoid';
import Anilist from '../../../../Modules/Anilist.js';
import moment from 'moment';

export default class extends Command {

	constructor(...args) {
		super(...args, {
			name: ['search', 'anime'],
			description: 'Search for an Anime on AniList.'
		});
	}

	async run(interaction) {
		const search = interaction.options.getString('search', true);

		const anilist = new Anilist();
		const raw = await anilist.search('anime', { search }).then(({ media }) => media);
		if (!raw.length) return interaction.reply({ content: 'Nothing found for this search.', ephemeral: true });

		const response = isRestrictedChannel(interaction.channel) ? raw : raw.filter(({ isAdult }) => !isAdult);
		if (!response.length) return interaction.reply({ content: 'This search contain explicit content, use **Age-Restricted Channel** instead.', ephemeral: true });

		const selectId = `select-${nanoid()}`;
		const select = new ActionRowBuilder()
			.addComponents(new SelectMenuBuilder()
				.setCustomId(selectId)
				.setPlaceholder('Select an anime!')
				.addOptions(...response.map(data => ({
					value: data.id.toString(),
					label: cutText(Object.values(data.title).filter(title => title?.length)[0], 100) || 'Unknown Name',
					...data.description?.length && { description: cutText(parseHTMLEntity(data.description), 100) }
				}))));

		const reply = await interaction.reply({ content: `I found **${response.length}** possible matches, please select one of the following:`, components: [select] });

		const filter = (i) => i.user.id === interaction.user.id;
		const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.SelectMenu, time: 60_000 });

		collector.on('ignore', (i) => i.deferUpdate());
		collector.on('collect', async (i) => {
			const [selected] = i.values;
			const data = response.find(item => item.id.toString() === selected);

			const startDate = !Object.values(data.startDate).some(value => value === null) ? Object.values(data.startDate).join('/') : null;
			const endDate = !Object.values(data.endDate).some(value => value === null) ? Object.values(data.endDate).join('/') : null;

			const button = new ActionRowBuilder()
				.addComponents(new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel('Open in Browser')
					.setURL(data.siteUrl));

			const embed = new EmbedBuilder()
				.setColor(Colors.Default)
				.setAuthor({ name: 'Anilist', iconURL: 'https://i.imgur.com/B48olfM.png', url: 'https://anilist.co/' })
				.setTitle(Object.values(data.title).filter(title => title?.length)[0])
				.addFields({ name: '__Detail__', value: [
					...data.title.romaji ? [`***Romaji:*** ${data.title.romaji}`] : [],
					...data.title.english ? [`***English:*** ${data.title.english}`] : [],
					...data.title.native ? [`***Native:*** ${data.title.native}`] : [],
					`***Type:*** ${this.getType(data.format)}`,
					`***Status:*** ${data.status.replace(/_/g, ' ').toTitleCase()}`,
					`***Source:*** ${data.source.replace(/_/g, ' ').toTitleCase()}`,
					...startDate ? [`***Aired:*** ${this.getDate(startDate, endDate)}`] : [],
					...data.duration ? [`***Length:*** ${this.getDurationLength(data.duration, data.episodes, data.format)}`] : [],
					...data.nextAiringEpisode ? [`***Next episodes:*** ${time(data.nextAiringEpisode.airingAt, 'R')} (episode ${data.nextAiringEpisode.episode})`] : [],
					...data.isAdult ? [`***Explicit content:*** ${data.isAdult ? 'Yes' : 'No'}`] : [],
					`***Popularity:*** ${data.popularity.formatNumber()}`
				].join('\n'), inline: false })
				.setImage(`https://img.anili.st/media/${data.id}`)
				.setFooter({ text: 'Powered by Anilist', iconURL: interaction.user.avatarURL() });

			if (data.description?.length) {
				embed.setDescription(cutText(parseHTMLEntity(data.description), 512));
			}

			if (data.characters.nodes?.length) {
				embed.addFields({ name: '__Characters__', value: formatArray(data.characters.nodes.map(({ name }) => name.full)), inline: false });
			}

			if (data.externalLinks.filter(({ type }) => type === 'STREAMING')?.length) {
				embed.addFields({ name: '__External Link__', value: data.externalLinks.filter(({ type }) => type === 'STREAMING').map(({ url, site }) => `[${site}](${url})`).join(' | '), inline: false });
			}

			return i.update({ content: null, embeds: [embed], components: [button] });
		});

		collector.on('end', (collected, reason) => {
			if (!collected.size && reason === 'time') {
				return interaction.deleteReply();
			}
		});
	}

	getType(format) {
		if (['TV', 'OVA', 'ONA'].includes(format)) return format;
		else if (format === 'TV_SHORT') return 'TV Short';
		else return format.replace(/_/g, ' ').toTitleCase();
	}

	getDurationLength(duration, episodes, format) {
		const formatter = (milliseconds) => new DurationFormatter().format(milliseconds, undefined, { right: ', ' });
		if (format === 'MOVIE') return `${formatter(duration * 6e4)} total (${duration} minutes)`;
		else if (episodes > 1) return `${formatter((duration * episodes) * 6e4)} total (${duration} minutes each)`;
		else if (episodes <= 1 && format !== 'MOVIE') return `${duration} minutes`;
	}

	getDate(startDate, endDate) {
		if (startDate === endDate) return moment(new Date(startDate)).format('MMM D, YYYY');
		else if (startDate && !endDate) return `${moment(new Date(startDate)).format('MMM D, YYYY')} to ?`;
		else return `${moment(new Date(startDate)).format('MMM D, YYYY')} to ${moment(new Date(endDate)).format('MMM D, YYYY')}`;
	}

}