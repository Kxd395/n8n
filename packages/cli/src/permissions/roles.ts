import type { Scope } from '@n8n/permissions';

export const ownerPermissions: Scope[] = [
	'auditLogs:manage',
	'communityNodes:manage',
	'credential:create',
	'credential:read',
	'credential:update',
	'credential:delete',
	'credential:list',
	'credential:share',
	'externalSecretsStore:create',
	'externalSecretsStore:read',
	'externalSecretsStore:update',
	'externalSecretsStore:delete',
	'externalSecretsStore:list',
	'externalSecretsStore:refresh',
	'externalSecretsStore:manage',
	'ldap:manage',
	'logStreaming:manage',
	'sourceControl:pull',
	'sourceControl:push',
	'sourceControl:manage',
	'sso:manage',
	'tag:create',
	'tag:read',
	'tag:update',
	'tag:delete',
	'tag:list',
	'user:create',
	'user:read',
	'user:update',
	'user:delete',
	'user:list',
	'variable:create',
	'variable:read',
	'variable:update',
	'variable:delete',
	'variable:list',
	'workflow:create',
	'workflow:read',
	'workflow:update',
	'workflow:delete',
	'workflow:list',
	'workflow:share',
];
export const adminPermissions: Scope[] = ownerPermissions.concat();
export const memberPermissions: Scope[] = [
	'tag:create',
	'tag:read',
	'tag:update',
	'tag:list',
	'user:list',
	'variable:list',
	'variable:read',
];
