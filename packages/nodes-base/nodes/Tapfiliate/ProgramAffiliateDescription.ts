import {
	INodeProperties,
} from 'n8n-workflow';

export const programAffiliateOperations = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [
					'programAffiliate',
				],
			},
		},
		options: [
			{
				name: 'Add',
				value: 'add',
				description: 'Add affiliate to program',
			},
			{
				name: 'Approve',
				value: 'approve',
				description: 'Approve an affiliate for a program',
			},
			{
				name: 'Disapprove',
				value: 'disapprove',
				description: 'Disapprove an affiliate',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an affiliate in a program',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all affiliates in program',
			},
		],
		default: 'add',
		description: 'The operation to perform.',
	},
] as INodeProperties[];

export const programAffiliateFields = [
	/* -------------------------------------------------------------------------- */
	/*                                 programAffiliate:add                       */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Program ID',
		name: 'programId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPrograms',
		},
		default: '',
		displayOptions: {
			show: {
				operation: [
					'add',
				],
				resource: [
					'programAffiliate',
				],
			},
		},
		description: `The id of the Program to add the affiliate too. This id can be found as part of the url when viewing the program on the platform.`,
	},
	{
		displayName: 'Affiliate ID',
		name: 'affiliateId',
		type: 'string',
		displayOptions: {
			show: {
				resource: [
					'programAffiliate',
				],
				operation: [
					'add',
				],
			},
		},
		description: 'The id of the affiliate.',
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
					'programAffiliate',
				],
				operation: [
					'add',
				],
			},
		},
		options: [
			{
				displayName: 'Approved',
				name: 'approved',
				type: 'boolean',
				default: false,
				description: `An optional approval status`,
			},
			{
				displayName: 'Coupon',
				name: 'coupon',
				type: 'string',
				default: '',
				description: 'An optional coupon for this affiliate',
			},
		],
	},
	/* -------------------------------------------------------------------------- */
	/*                                 programAffiliate:approve                   */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Program ID',
		name: 'programId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPrograms',
		},
		default: '',
		displayOptions: {
			show: {
				operation: [
					'approve',
				],
				resource: [
					'programAffiliate',
				],
			},
		},
		description: `The id of the Program to add the affiliate too. This id can be found as part of the url when viewing the program on the platform.`,
	},
	{
		displayName: 'Affiliate ID',
		name: 'affiliateId',
		type: 'string',
		displayOptions: {
			show: {
				resource: [
					'programAffiliate',
				],
				operation: [
					'approve',
				],
			},
		},
		description: 'The id of the affiliate.',
	},
	/* -------------------------------------------------------------------------- */
	/*                                 programAffiliate:disapprove                */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Program ID',
		name: 'programId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPrograms',
		},
		default: '',
		displayOptions: {
			show: {
				operation: [
					'disapprove',
				],
				resource: [
					'programAffiliate',
				],
			},
		},
		description: `The id of the Program to add the affiliate too. This id can be found as part of the url when viewing the program on the platform.`,
	},
	{
		displayName: 'Affiliate ID',
		name: 'affiliateId',
		type: 'string',
		displayOptions: {
			show: {
				resource: [
					'programAffiliate',
				],
				operation: [
					'disapprove',
				],
			},
		},
		description: 'The id of the affiliate.',
	},
	/* -------------------------------------------------------------------------- */
	/*                                 affiliate:get                              */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Program ID',
		name: 'programId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPrograms',
		},
		default: '',
		displayOptions: {
			show: {
				operation: [
					'get',
				],
				resource: [
					'programAffiliate',
				],
			},
		},
		description: `The id of the Program to add the affiliate too. This id can be found as part of the url when viewing the program on the platform.`,
	},
	{
		displayName: 'Affiliate ID',
		name: 'affiliateId',
		type: 'string',
		displayOptions: {
			show: {
				resource: [
					'programAffiliate',
				],
				operation: [
					'get',
				],
			},
		},
		description: 'The id of the affiliate.',
	},
	/* -------------------------------------------------------------------------- */
	/*                          programAffiliate:getAll                           */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Program ID',
		name: 'programId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPrograms',
		},
		default: '',
		displayOptions: {
			show: {
				operation: [
					'getAll',
				],
				resource: [
					'programAffiliate',
				],
			},
		},
		description: `The id of the Program to add the affiliate too. This id can be found as part of the url when viewing the program on the platform.`,
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: [
					'programAffiliate',
				],
				operation: [
					'getAll',
				],
			},
		},
		default: false,
		description: 'If set to true, all the results will be returned.',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: [
					'programAffiliate',
				],
				operation: [
					'getAll',
				],
				returnAll: [
					false,
				],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 1000,
		},
		default: 100,
		description: 'How many results to return.',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: [
					'programAffiliate',
				],
				operation: [
					'getAll',
				],
			},
		},
		options: [
			{
				displayName: 'Affiliate Group ID',
				name: 'affiliate_group_id',
				type: 'string',
				default: '',
				description: 'Retrieves affiliates for a certain affiliate group',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				description: 'An email address',
			},
			{
				displayName: 'Parent ID',
				name: 'parentId',
				type: 'string',
				default: '',
				description: 'Retrieves children for a certain parent affiliate',
			},
			{
				displayName: 'Source ID',
				name: 'source_id',
				type: 'string',
				default: '',
				description: 'A source id',
			},
		],
	},
] as INodeProperties[];
