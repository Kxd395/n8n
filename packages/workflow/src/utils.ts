/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import path from 'path';
import type {
	ICredentialDataDecryptedObject,
	ICredentialTestFunction,
	ICredentialType,
	ICredentialTypes,
	IHttpRequestOptions,
	INodeListSearchResult,
	INodePropertyOptions,
	INodeType,
	INodeTypes,
} from '.';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
export const deepCopy = <T>(source: T): T => {
	let clone: any;
	let i: any;
	const hasOwnProp = Object.prototype.hasOwnProperty.bind(source);
	// Primitives & Null
	if (typeof source !== 'object' || source === null) {
		return source;
	}
	// Date
	if (source instanceof Date) {
		return new Date(source.getTime()) as T;
	}
	// Array
	if (Array.isArray(source)) {
		clone = [];
		const len = source.length;
		for (i = 0; i < len; i++) {
			clone[i] = deepCopy(source[i]);
		}
		return clone;
	}
	// Object
	clone = {};
	for (i in source) {
		if (hasOwnProp(i)) {
			clone[i] = deepCopy((source as any)[i]);
		}
	}
	return clone;
};

/**
 * Requiring dist nodes
 */

type DistNodeModule = {
	[nodeClassName: string]: new () => {
		methods: {
			loadOptions?: { [methodName: string]: LoadOptionsMethod };
			listSearch?: { [methodName: string]: ListSearchMethod };
			credentialTest?: { [testedBy: string]: ICredentialTestFunction };
		};
		authenticate(
			credentials: ICredentialDataDecryptedObject,
			requestOptions: IHttpRequestOptions,
		): Promise<IHttpRequestOptions>;
		webhookMethods: { [key: string]: { [key: string]: Function } };
	};
};

type LoadOptionsMethod = () => Promise<INodePropertyOptions[]>;

type ListSearchMethod = (
	filter?: string,
	paginationToken?: string,
) => Promise<INodeListSearchResult>;

function getVersionedNodeFilePath(sourcePath: string, version: number | number[]) {
	if (Array.isArray(version)) return sourcePath;

	const { dir, base } = path.parse(sourcePath);
	const versionedNodeFilename = base.replace('.node.js', `V${version}.node.js`);

	return path.resolve(dir, `v${version}`, versionedNodeFilename);
}

export function requireDistNode(nodeType: INodeType, nodeTypes: INodeTypes) {
	const sourcePath = nodeTypes.getSourcePath!(nodeType.description.name);

	const nodeFilePath =
		nodeType.description.defaultVersion !== undefined
			? getVersionedNodeFilePath(sourcePath, nodeType.description.version)
			: sourcePath;

	let _module;

	try {
		_module = require(nodeFilePath) as DistNodeModule;
	} catch (_) {
		throw new Error(`Failed to require node at ${sourcePath}`);
	}

	const nodeClassName = nodeFilePath.split('/').pop()?.split('.').shift();

	if (!nodeClassName) {
		throw new Error(`Failed to extract class name from ${nodeFilePath}`);
	}

	try {
		return new _module[nodeClassName]();
	} catch (error) {
		throw new Error(`Failed to instantiate node at ${sourcePath}`);
	}
}

export function requireDistCred(credType: ICredentialType, credTypes: ICredentialTypes) {
	const credSourcePath = credTypes.getSourcePath!(credType.name);

	let _module;

	try {
		_module = require(credSourcePath) as DistNodeModule;
	} catch (_) {
		throw new Error(`Failed to require node at ${credSourcePath}`);
	}

	const nodeClassName = credSourcePath.split('/').pop()?.split('.').shift();

	if (!nodeClassName) {
		throw new Error(`Failed to extract class name from ${credSourcePath}`);
	}

	try {
		return new _module[nodeClassName]();
	} catch (error) {
		throw new Error(`Failed to instantiate credential at ${credSourcePath}`);
	}
}

/**
 * Parsing JSON
 */

type MutuallyExclusive<T, U> =
	| (T & { [k in Exclude<keyof U, keyof T>]?: never })
	| (U & { [k in Exclude<keyof T, keyof U>]?: never });

type JSONParseOptions<T> = MutuallyExclusive<{ errorMessage: string }, { fallbackValue: T }>;

export const jsonParse = <T>(jsonString: string, options?: JSONParseOptions<T>): T => {
	try {
		return JSON.parse(jsonString) as T;
	} catch (error) {
		if (options?.fallbackValue !== undefined) {
			return options.fallbackValue;
		} else if (options?.errorMessage) {
			throw new Error(options.errorMessage);
		}

		throw error;
	}
};
