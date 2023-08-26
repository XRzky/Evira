import type BaseClient from '#lib/BaseClient.js';
import Command from '#lib/structures/Interaction.js';
import { EmbedBuilder } from '@discordjs/builders';
import type { ChatInputCommandInteraction } from 'discord.js';
import { Colors, UserAgent } from '#lib/utils/Constants.js';
import { request } from 'undici';

export default class extends Command {
	public constructor(client: BaseClient) {
		super(client, {
			name: 'interact pout',
			description: 'Pout someone.',
			category: 'Social',
			guildOnly: true
		});
	}

	public async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		const member = interaction.options.getMember('user');

		const raw = await request(`https://nekos.best/api/v2/pout`, {
			method: 'GET',
			headers: { 'User-Agent': UserAgent },
			maxRedirections: 20
		});

		const response = await raw.body.json().then(({ results }: any) => results[0]);

		const embed = new EmbedBuilder()
			.setColor(Colors.Default)
			.setDescription(`${interaction.user.toString()} pouts at ${member?.toString()}.`)
			.setImage(response.url)
			.setFooter({ text: `Powered by ${this.client.user.username}`, iconURL: interaction.user.avatarURL() as string });

		return interaction.reply({ embeds: [embed] });
	}
}