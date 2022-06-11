const { PermissionsBitField } = require('discord.js');

module.exports = class Interaction {

	constructor(client, name, options = {}) {
		this.client = client;
		this.name = options.name || [name];
		this.description = options.description || 'No description provided';
		this.memberPermissions = new PermissionsBitField(options.memberPermissions).freeze();
		this.clientPermissions = new PermissionsBitField(options.clientPermissions).freeze();
		this.cooldown = options.cooldown || 3000;
		this.guildOnly = options.guildOnly || false;
		this.ownerOnly = options.ownerOnly || false;
		this.disabled = options.disabled || false;
	}

	async run(interaction) { // eslint-disable-line no-unused-vars
		throw new Error(`Interaction ${this.name} doesn't provide a run method!`);
	}

};
