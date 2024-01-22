import { Container } from 'typedi';
import { Flags } from '@oclif/core';
import { Cipher } from 'n8n-core';
import fs from 'fs';
import glob from 'fast-glob';
import type { EntityManager } from 'typeorm';

import * as Db from '@/Db';
import type { User } from '@db/entities/User';
import { SharedCredentials } from '@db/entities/SharedCredentials';
import { CredentialsEntity } from '@db/entities/CredentialsEntity';
import { disableAutoGeneratedIds } from '@db/utils/commandHelpers';
import { BaseCommand } from '../BaseCommand';
import type { ICredentialsEncrypted } from 'n8n-workflow';
import { ApplicationError, jsonParse } from 'n8n-workflow';
import { UM_FIX_INSTRUCTION } from '@/constants';
import { UserRepository } from '@db/repositories/user.repository';

export class ImportCredentialsCommand extends BaseCommand {
	static description = 'Import credentials';

	static examples = [
		'$ n8n import:credentials --input=file.json',
		'$ n8n import:credentials --separate --input=backups/latest/',
		'$ n8n import:credentials --input=file.json --userId=1d64c3d2-85fe-4a83-a649-e446b07b3aae',
		'$ n8n import:credentials --separate --input=backups/latest/ --userId=1d64c3d2-85fe-4a83-a649-e446b07b3aae',
	];

	static flags = {
		help: Flags.help({ char: 'h' }),
		input: Flags.string({
			char: 'i',
			description: 'Input file name or directory if --separate is used',
		}),
		separate: Flags.boolean({
			description: 'Imports *.json files from directory provided by --input',
		}),
		userId: Flags.string({
			description: 'The ID of the user to assign the imported credentials to',
		}),
	};

	private transactionManager: EntityManager;

	async init() {
		disableAutoGeneratedIds(CredentialsEntity);
		await super.init();
	}

	async run(): Promise<void> {
		const { flags } = await this.parse(ImportCredentialsCommand);

		if (!flags.input) {
			this.logger.info('An input file or directory with --input must be provided');
			return;
		}

		if (flags.separate) {
			if (fs.existsSync(flags.input)) {
				if (!fs.lstatSync(flags.input).isDirectory()) {
					this.logger.info('The argument to --input must be a directory');
					return;
				}
			}
		}

		let totalImported = 0;

		const cipher = Container.get(Cipher);
		const user = flags.userId ? await this.getAssignee(flags.userId) : await this.getOwner();

		if (flags.separate) {
			let { input: inputPath } = flags;

			if (process.platform === 'win32') {
				inputPath = inputPath.replace(/\\/g, '/');
			}

			const files = await glob('*.json', {
				cwd: inputPath,
				absolute: true,
			});

			totalImported = files.length;

			await Db.getConnection().transaction(async (transactionManager) => {
				this.transactionManager = transactionManager;
				for (const file of files) {
					const credential = jsonParse<ICredentialsEncrypted>(
						fs.readFileSync(file, { encoding: 'utf8' }),
					);
					if (typeof credential.data === 'object') {
						// plain data / decrypted input. Should be encrypted first.
						credential.data = cipher.encrypt(credential.data);
					}
					await this.storeCredential(credential, user);
				}
			});

			this.reportSuccess(totalImported);
			return;
		}

		const credentials = jsonParse<ICredentialsEncrypted[]>(
			fs.readFileSync(flags.input, { encoding: 'utf8' }),
		);

		totalImported = credentials.length;

		if (!Array.isArray(credentials)) {
			throw new ApplicationError(
				'File does not seem to contain credentials. Make sure the credentials are contained in an array.',
			);
		}

		await Db.getConnection().transaction(async (transactionManager) => {
			this.transactionManager = transactionManager;
			for (const credential of credentials) {
				if (typeof credential.data === 'object') {
					// plain data / decrypted input. Should be encrypted first.
					credential.data = cipher.encrypt(credential.data);
				}
				await this.storeCredential(credential, user);
			}
		});

		this.reportSuccess(totalImported);
	}

	async catch(error: Error) {
		this.logger.error(
			'An error occurred while importing credentials. See log messages for details.',
		);
		this.logger.error(error.message);
	}

	private reportSuccess(total: number) {
		this.logger.info(
			`Successfully imported ${total} ${total === 1 ? 'credential.' : 'credentials.'}`,
		);
	}

	private async storeCredential(credential: Partial<CredentialsEntity>, user: User) {
		if (!credential.nodesAccess) {
			credential.nodesAccess = [];
		}
		const result = await this.transactionManager.upsert(CredentialsEntity, credential, ['id']);
		await this.transactionManager.upsert(
			SharedCredentials,
			{
				credentialsId: result.identifiers[0].id as string,
				userId: user.id,
				role: 'owner',
			},
			['credentialsId', 'userId'],
		);
	}

	private async getOwner() {
		const owner = await Container.get(UserRepository).findOneBy({ role: 'owner' });
		if (!owner) {
			throw new ApplicationError(`Failed to find owner. ${UM_FIX_INSTRUCTION}`);
		}

		return owner;
	}

	private async getAssignee(userId: string) {
		const user = await Container.get(UserRepository).findOneBy({ id: userId });

		if (!user) {
			throw new ApplicationError('Failed to find user', { extra: { userId } });
		}

		return user;
	}
}
