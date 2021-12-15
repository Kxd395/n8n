import {
	INodeProperties,
} from 'n8n-workflow';

export const tagOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [
					'tag',
				],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a tag',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a tag',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a tag',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Retrieve all tags',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a tag',
			},
		],
		default: 'create',
	},
];

export const tagFields: INodeProperties[] = [
	// ----------------------------------------
	//               tag: create
	// ----------------------------------------
	{
		displayName: 'Name',
		name: 'name',
		description: 'Name of the tag - max 250 characters',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: [
					'tag',
				],
				operation: [
					'create',
				],
			},
		},
	},

	// ----------------------------------------
	//               tag: delete
	// ----------------------------------------
	{
		displayName: 'Tag ID',
		name: 'tagId',
		description: 'ID of the tag to delete',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: [
					'tag',
				],
				operation: [
					'delete',
				],
			},
		},
	},

	// ----------------------------------------
	//                 tag: get
	// ----------------------------------------
	{
		displayName: 'Tag ID',
		name: 'tagId',
		description: 'ID of the tag to retrieve',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: [
					'tag',
				],
				operation: [
					'get',
				],
			},
		},
	},

	// ----------------------------------------
	//               tag: getAll
	// ----------------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: [
					'tag',
				],
				operation: [
					'getAll',
				],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'How many results to return',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: [
					'tag',
				],
				operation: [
					'getAll',
				],
				returnAll: [
					false,
				],
			},
		},
	},

	// ----------------------------------------
	//               tag: update
	// ----------------------------------------
	{
		displayName: 'Tag ID',
		name: 'tagId',
		description: 'ID of the tag to update',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: [
					'tag',
				],
				operation: [
					'update',
				],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		description: 'Name of the tag - max 250 characters',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: [
					'tag',
				],
				operation: [
					'update',
				],
			},
		},
	},
];
