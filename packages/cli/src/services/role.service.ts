import type { ProjectRole } from '@/databases/entities/ProjectRelation';
import type { CredentialSharingRole } from '@/databases/entities/SharedCredentials';
import type { WorkflowSharingRole } from '@/databases/entities/SharedWorkflow';
import type { GlobalRole } from '@/databases/entities/User';
import {
	GLOBAL_ADMIN_SCOPES,
	GLOBAL_MEMBER_SCOPES,
	GLOBAL_OWNER_SCOPES,
} from '@/permissions/global-roles';
import {
	PERSONAL_PROJECT_OWNER_SCOPES,
	PROJECT_EDITOR_SCOPES,
	PROJECT_VIEWER_SCOPES,
	REGULAR_PROJECT_ADMIN_SCOPES,
} from '@/permissions/project-roles';
import {
	CREDENTIALS_SHARING_OWNER_SCOPES,
	CREDENTIALS_SHARING_USER_SCOPES,
	WORKFLOW_SHARING_EDITOR_SCOPES,
	WORKFLOW_SHARING_OWNER_SCOPES,
} from '@/permissions/resource-roles';
import type { Scope } from '@n8n/permissions';
import { Service } from 'typedi';

export type RoleNamespace = 'global' | 'project' | 'credential' | 'workflow';

const GLOBAL_SCOPE_MAP: Record<GlobalRole, Scope[]> = {
	'global:owner': GLOBAL_OWNER_SCOPES,
	'global:admin': GLOBAL_ADMIN_SCOPES,
	'global:member': GLOBAL_MEMBER_SCOPES,
};

const PROJECT_SCOPE_MAP: Record<ProjectRole, Scope[]> = {
	'project:admin': REGULAR_PROJECT_ADMIN_SCOPES,
	'project:personalOwner': PERSONAL_PROJECT_OWNER_SCOPES,
	'project:editor': PROJECT_EDITOR_SCOPES,
	'project:viewer': PROJECT_VIEWER_SCOPES,
};

const CREDENTIALS_SHARING_SCOPE_MAP: Record<CredentialSharingRole, Scope[]> = {
	'credential:owner': CREDENTIALS_SHARING_OWNER_SCOPES,
	'credential:user': CREDENTIALS_SHARING_USER_SCOPES,
};

const WORKFLOW_SHARING_SCOPE_MAP: Record<WorkflowSharingRole, Scope[]> = {
	'workflow:owner': WORKFLOW_SHARING_OWNER_SCOPES,
	'workflow:editor': WORKFLOW_SHARING_EDITOR_SCOPES,

	// Not sure why this exists?
	'workflow:user': [],
};

interface AllMaps {
	global: Record<GlobalRole, Scope[]>;
	project: Record<ProjectRole, Scope[]>;
	credential: Record<CredentialSharingRole, Scope[]>;
	workflow: Record<WorkflowSharingRole, Scope[]>;
}

const ALL_MAPS: AllMaps = {
	global: GLOBAL_SCOPE_MAP,
	project: PROJECT_SCOPE_MAP,
	credential: CREDENTIALS_SHARING_SCOPE_MAP,
	workflow: WORKFLOW_SHARING_SCOPE_MAP,
} as const;

export interface RoleMap {
	global: GlobalRole[];
	project: ProjectRole[];
	credential: CredentialSharingRole[];
	workflow: WorkflowSharingRole[];
}
export type AllRoleTypes = GlobalRole | ProjectRole | WorkflowSharingRole | CredentialSharingRole;

const ROLE_NAMES: Record<
	GlobalRole | ProjectRole | WorkflowSharingRole | CredentialSharingRole,
	string
> = {
	'global:owner': 'Owner',
	'global:admin': 'Admin',
	'global:member': 'Member',
	'project:personalOwner': 'Project Owner',
	'project:admin': 'Project Admin',
	'project:editor': 'Project Editor',
	'project:viewer': 'Project Viewer',
	'credential:user': 'Credential User',
	'credential:owner': 'Credential Owner',
	'workflow:owner': 'Workflow Owner',
	'workflow:editor': 'Workflow Editor',
	'workflow:user': 'Workflow User',
};

@Service()
export class RoleService {
	rolesWithScope(namespace: 'global', scopes: Scope | Scope[]): GlobalRole[];
	rolesWithScope(namespace: 'project', scopes: Scope | Scope[]): ProjectRole[];
	rolesWithScope(namespace: 'credential', scopes: Scope | Scope[]): CredentialSharingRole[];
	rolesWithScope(namespace: 'workflow', scopes: Scope | Scope[]): WorkflowSharingRole[];
	rolesWithScope(namespace: RoleNamespace, scopes: Scope | Scope[]) {
		if (!Array.isArray(scopes)) {
			scopes = [scopes];
		}

		return Object.keys(ALL_MAPS[namespace]).filter((k) => {
			return (scopes as Scope[]).every((s) =>
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
				((ALL_MAPS[namespace] as any)[k] as Scope[]).includes(s),
			);
		});
	}

	getRoles(): RoleMap {
		return Object.fromEntries(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			Object.entries(ALL_MAPS).map((e) => [e[0], Object.keys(e[1])]),
		) as unknown as RoleMap;
	}

	getRoleName(role: AllRoleTypes): string {
		return ROLE_NAMES[role];
	}

	/**
	 * Find all distinct scopes in a set of project roles.
	 */
	getScopesBy(projectRoles: Set<ProjectRole>) {
		return [...projectRoles].reduce<Set<Scope>>((acc, projectRole) => {
			for (const scope of PROJECT_SCOPE_MAP[projectRole] ?? []) {
				acc.add(scope);
			}

			return acc;
		}, new Set());
	}
}
