const Event = require('../../Structures/Event.js');
const { Access } = require('../../Settings/Configuration.js');

module.exports = class extends Event {

	async run(interaction) {
		if (!interaction.inGuild()) return interaction.reply({ content: 'This command cannot be used out of a server.', ephemeral: true });
		if (!interaction.isCommand() && !interaction.isContextMenu()) return;

		let command;
		if (interaction.isMessageComponent()) {
			command = this.client.interactions.get(interaction.commandName);
		} else {
			command = this.client.interactions.get(this.client.utils.getCommandName(interaction));
		}

		if (command) {
			if (interaction.inGuild()) {
				const memberPermCheck = command.memberPerms ? this.client.defaultPerms.add(command.memberPerms) : this.client.defaultPerms;
				if (memberPermCheck) {
					const missing = interaction.channel.permissionsFor(interaction.member).missing(memberPermCheck);
					if (missing.length) {
						return interaction.reply({ content: `You don't have *${this.client.utils.formatArray(missing.map(this.client.utils.formatPerms))}* permission, you need it to continue this command!`, ephemeral: true });
					}
				}

				const clientPermCheck = command.clientPerms ? this.client.defaultPerms.add(command.clientPerms) : this.client.defaultPerms;
				if (clientPermCheck) {
					const missing = interaction.channel.permissionsFor(interaction.guild.me).missing(clientPermCheck);
					if (missing.length) {
						return interaction.reply({ content: `I don't have *${this.client.utils.formatArray(missing.map(this.client.utils.formatPerms))}* permission, I need it to continue this command!`, ephemeral: true });
					}
				}
			}

			try {
				await command.run(interaction);
			} catch (error) {
				if (interaction.replied) return;
				this.client.logger.log({ content: error.stack, type: 'error' });

				if (interaction.deferred) {
					return interaction.editReply({ content: `Something went wrong, please report it to our **[guild support](<https://discord.gg/${Access.InviteCode}>)**!` });
				} else {
					return interaction.reply({ content: `Something went wrong, please report it to our **[guild support](<https://discord.gg/${Access.InviteCode}>)**!`, ephemeral: true });
				}
			}
		}
	}

};
