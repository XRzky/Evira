import { Client } from '@/lib/structures/client.js';
import { Listener } from '@/lib/structures/listener.js';
import { logger } from '@elvia/logger';
import type { RateLimitData } from '@discordjs/rest';

export default class extends Listener {
	public constructor(client: Client<true>) {
		super(client, {
			name: 'rateLimited',
			once: false,
			emitter: 'rest'
		});
	}

	public run(rateLimitInfo: RateLimitData) {
		const info = [
			`    Route  : ${rateLimitInfo.route}`,
			`    Hash   : ${rateLimitInfo.hash}`,
			`    Method : ${rateLimitInfo.method}`,
			`    Limit  : ${rateLimitInfo.limit}`,
			`    Timeout: ${rateLimitInfo.timeToReset}ms`,
			`    Global : ${rateLimitInfo.global.toString()}`
		].join('\n');

		logger.warn(`Discord API client is rate-limited.\n${info}`);
	}
}
