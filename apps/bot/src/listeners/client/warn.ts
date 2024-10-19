import { Client, Listener } from '@elvia/tesseract';
import { logger } from '@elvia/logger';
import { Events } from 'discord.js';

export default class extends Listener {
	public constructor(client: Client<true>) {
		super(client, {
			name: Events.Warn,
			once: false
		});
	}

	public run(info: string) {
		logger.warn(info);
	}
}