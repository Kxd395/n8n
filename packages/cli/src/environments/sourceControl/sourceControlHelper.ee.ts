import Container from 'typedi';
import { License } from '../../License';
import { generateKeyPairSync } from 'crypto';
import sshpk from 'sshpk';
import type { KeyPair } from './types/keyPair';
import { constants as fsConstants, mkdirSync, accessSync } from 'fs';
import { LoggerProxy } from 'n8n-workflow';
import { SOURCE_CONTROL_GIT_KEY_COMMENT } from './constants';
import type { SourceControlledFile } from './types/sourceControlledFile';
import { ImportResult } from './types/importResult';

export function sourceControlFoldersExistCheck(folders: string[]) {
	// running these file access function synchronously to avoid race conditions
	folders.forEach((folder) => {
		try {
			accessSync(folder, fsConstants.F_OK);
		} catch {
			try {
				mkdirSync(folder);
			} catch (error) {
				LoggerProxy.error((error as Error).message);
			}
		}
	});
}

export function isSourceControlLicensed() {
	const license = Container.get(License);
	return license.isSourceControlLicensed();
}

export function generateSshKeyPair(keyType: 'ed25519' | 'rsa' = 'ed25519') {
	const keyPair: KeyPair = {
		publicKey: '',
		privateKey: '',
	};
	let generatedKeyPair: KeyPair;
	switch (keyType) {
		case 'ed25519':
			generatedKeyPair = generateKeyPairSync('ed25519', {
				privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
				publicKeyEncoding: { format: 'pem', type: 'spki' },
			});
			break;
		case 'rsa':
			generatedKeyPair = generateKeyPairSync('rsa', {
				modulusLength: 4096,
				publicKeyEncoding: {
					type: 'spki',
					format: 'pem',
				},
				privateKeyEncoding: {
					type: 'pkcs8',
					format: 'pem',
				},
			});
			break;
	}
	const keyPublic = sshpk.parseKey(generatedKeyPair.publicKey, 'pem');
	keyPublic.comment = SOURCE_CONTROL_GIT_KEY_COMMENT;
	keyPair.publicKey = keyPublic.toString('ssh');
	const keyPrivate = sshpk.parsePrivateKey(generatedKeyPair.privateKey, 'pem');
	keyPrivate.comment = SOURCE_CONTROL_GIT_KEY_COMMENT;
	keyPair.privateKey = keyPrivate.toString('ssh-private');
	return {
		privateKey: keyPair.privateKey,
		publicKey: keyPair.publicKey,
	};
}

export function getRepoType(repoUrl: string): 'github' | 'gitlab' | 'other' {
	if (repoUrl.includes('github.com')) {
		return 'github';
	} else if (repoUrl.includes('gitlab.com')) {
		return 'gitlab';
	}
	return 'other';
}

export function getTrackingInformationFromSourceControlledFiles(result: SourceControlledFile[]) {
	return {
		cred_conflicts: result.filter((file) => file.type === 'credential' && file.conflict).length,
		variable_conflicts: result.filter((file) => file.type === 'variables' && file.conflict).length,
		workflow_conflicts: result.filter((file) => file.type === 'workflow' && file.conflict).length,
		workflow_updates: result.filter(
			(file) => file.type === 'workflow' && file.status === 'modified',
		).length,
	};
}

export function getTrackingInformationFromImportResult(result: ImportResult) {
	return {
		cred_conflicts: result.credentials.length,
		variable_conflicts: result.variables.imported.length,
		workflow_conflicts: result.workflows.length,
		workflow_updates: result.workflows.filter((wf) => wf.name !== 'skipped').length,
	};
}
