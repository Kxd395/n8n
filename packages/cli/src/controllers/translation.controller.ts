import type { Request } from 'express';
import { access } from 'node:fs/promises';
import { join } from 'node:path';

import config from '@/config';
import { NODES_BASE_DIR } from '@/constants';
import { CredentialTypes } from '@/credential-types';
import { Get, RestController } from '@/decorators';
import { BadRequestError } from '@/errors/response-errors/bad-request.error';
import { InternalServerError } from '@/errors/response-errors/internal-server.error';

export const CREDENTIAL_TRANSLATIONS_DIR = 'n8n-nodes-base/dist/credentials/translations';
export const NODE_HEADERS_PATH = join(NODES_BASE_DIR, 'dist/nodes/headers');

export declare namespace TranslationRequest {
	export type Credential = Request<{}, {}, {}, { credentialType: string }>;
}

@RestController('/')
export class TranslationController {
	constructor(private readonly credentialTypes: CredentialTypes) {}

	@Get('/credential-translation')
	async getCredentialTranslation(req: TranslationRequest.Credential) {
		const { credentialType } = req.query;

		if (!this.credentialTypes.recognizes(credentialType))
			throw new BadRequestError(`Invalid Credential type: "${credentialType}"`);

		const defaultLocale = config.getEnv('defaultLocale');
		const translationPath = join(
			CREDENTIAL_TRANSLATIONS_DIR,
			defaultLocale,
			`${credentialType}.json`,
		);

		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return require(translationPath);
		} catch (error) {
			return null;
		}
	}

	@Get('/node-translation-headers')
	async getNodeTranslationHeaders() {
		try {
			await access(`${NODE_HEADERS_PATH}.js`);
		} catch {
			return; // no headers available
		}

		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return require(NODE_HEADERS_PATH);
		} catch (error) {
			throw new InternalServerError('Failed to load headers file');
		}
	}
}
