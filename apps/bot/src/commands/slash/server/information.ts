import { Client } from '@/lib/structures/client.js';
import { Command } from '@/lib/structures/command.js';
import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/v10';
import { EmbedBuilder } from '@discordjs/builders';
import type { ChatInputCommandInteraction } from 'discord.js';
import { bold, inlineCode, italic, time, underline, userMention } from '@discordjs/formatters';
import { Colors } from '@/lib/utils/constants.js';
import { formatArray, formatNumber, trimArray } from '@/lib/utils/functions.js';

export default class extends Command {
	public constructor(client: Client<true>) {
		super(client, {
			type: ApplicationCommandType.ChatInput,
			name: 'information',
			description: 'Get server information.',
			integrationTypes: [ApplicationIntegrationType.GuildInstall],
			contexts: [InteractionContextType.Guild],
			category: 'Utility',
			guild: true
		});
	}

	public execute(interaction: ChatInputCommandInteraction<'cached'>) {
		const ContentFilterLevel = ['None', 'Scan messages from those without a role', 'Scan all messages'];
		const VerificationLevel = ['None', 'Low', 'Medium', '(╯°□°）╯︵ ┻━┻', '┻━┻ ﾐヽ(ಠ益ಠ)ノ彡┻━┻'];

		const channels = interaction.guild.channels.cache;
		const roles = interaction.guild.roles.cache
			.sort((a, b) => b.position - a.position)
			.map((role) => role.toString())
			.slice(0, -1);

		const embed = new EmbedBuilder()
			.setColor(Colors.Default)
			.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() as string })
			.setThumbnail(interaction.guild.iconURL({ size: 512 }))
			.setDescription(
				[
					`${bold(italic('ID:'))} ${inlineCode(interaction.guildId)}`,
					`${bold(italic('Owner:'))} ${userMention(interaction.guild.ownerId)}`,
					`${bold(italic('Boost Status:'))} ${interaction.guild.premiumSubscriptionCount!} Boosts (${inlineCode(
						`Level ${interaction.guild.premiumTier}`
					)})`,
					`${bold(italic('Explicit Filter:'))} ${ContentFilterLevel[interaction.guild.explicitContentFilter]}`,
					`${bold(italic('Verification:'))} ${VerificationLevel[interaction.guild.verificationLevel]}`,
					`${bold(italic('Created:'))} ${time(new Date(interaction.guild.createdTimestamp), 'D')} (${time(
						new Date(interaction.guild.createdTimestamp),
						'R'
					)})`,
					`${bold(italic('Channel:'))} ${formatNumber(
						channels.filter((channel) => channel.isTextBased()).size
					)} Text / ${formatNumber(channels.filter((channel) => channel.isVoiceBased()).size)} Voice`,
					`${bold(italic('Member:'))} ${formatNumber(interaction.guild.memberCount)} members`
				].join('\n')
			)
			.addFields({
				name: underline(italic(`Roles [${roles.length}]`)),
				value: `${roles?.length ? formatArray(trimArray(roles, { length: 10 })) : 'None'}`,
				inline: false
			})
			.setFooter({ text: `Powered by ${this.client.user.username}`, iconURL: interaction.user.avatarURL() as string });

		return interaction.reply({ embeds: [embed] });
	}
}
