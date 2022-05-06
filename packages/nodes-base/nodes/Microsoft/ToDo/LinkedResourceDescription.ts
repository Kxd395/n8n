import {
	INodeProperties,
} from 'n8n-workflow';

export const linkedResourceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
			},
			{
				name: 'Delete',
				value: 'delete',
			},
			{
				name: 'Get',
				value: 'get',
			},
			{
				name: 'Get All',
				value: 'getAll',
			},
			{
				name: 'Update',
				value: 'update',
			},
		],
		default: 'get',
		description: 'The operation to perform.',
	},
];

export const linkedResourceFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                       linkedResource:ALL                                   */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Task List ID',
		name: 'taskListId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTaskLists',
		},
		displayOptions: {
			show: {
				operation: [
					'create',
					'delete',
					'get',
					'getAll',
					'update',
				],
				resource: [
					'linkedResource',
				],
			},
		},
		required: true,
		default: '',
	},
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		displayOptions: {
			show: {
				operation: [
					'create',
					'delete',
					'get',
					'getAll',
					'update',
				],
				resource: [
					'linkedResource',
				],
			},
		},
		required: true,
		default: '',
	},

	/* -------------------------------------------------------------------------- */
	/*                           linkedResource:create                            */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Name',
		name: 'displayName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: [
					'create',
				],
				resource: [
					'linkedResource',
				],
			},
		},
		description: 'Field indicating title of the linked entity.',
	},
	{
		displayName: 'Application Name',
		name: 'applicationName',
		type: 'string',
		displayOptions: {
			show: {
				operation: [
					'create',
				],
				resource: [
					'linkedResource',
				],
			},
		},
		required: true,
		default: '',
		description: 'App name of the source that is sending the linked entity.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
				operation: [
					'create',
				],
			},
		},
		options: [
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'ID of the object that is associated with this task on the third-party/partner system.',
			},
			{
				displayName: 'Web URL',
				name: 'webUrl',
				type: 'string',
				default: '',
				description: 'Deeplink to the linked entity.',
			},
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                           linkedResource:get/delete/update                 */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Linked Resource ID',
		name: 'linkedResourceId',
		type: 'string',
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
				operation: [
					'delete',
					'get',
					'update',
				],
			},
		},
		default: '',
		required: true,
	},

	/* -------------------------------------------------------------------------- */
	/*                           linkedResource:getAll                            */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
				operation: [
					'getAll',
				],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
				operation: [
					'getAll',
				],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		description: 'How many results to return.',
	},

	/* -------------------------------------------------------------------------- */
	/*                           linkedResource:update                            */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
				operation: [
					'update',
				],
			},
		},
		options: [
			{
				displayName: 'Application Name',
				name: 'applicationName',
				type: 'string',
				default: '',
				description: 'App name of the source that is sending the linked entity.',
			},
			{
				displayName: 'Name',
				name: 'displayName',
				type: 'string',
				default: '',
				description: 'Field indicating title of the linked entity.',
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'ID of the object that is associated with this task on the third-party/partner system.',
			},
			{
				displayName: 'Web URL',
				name: 'webUrl',
				type: 'string',
				default: '',
				description: 'Deeplink to the linked entity.',
			},
		],
	},
];
