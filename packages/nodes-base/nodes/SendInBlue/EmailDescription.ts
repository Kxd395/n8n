import { IExecuteSingleFunctions, IHttpRequestOptions, INodeProperties } from 'n8n-workflow';
import { SendInBlueNode } from './GenericFunctions';

export const emailOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['email'],
			},
		},
		options: [
			{
				name: 'Send',
				value: 'send',
				action: 'Send a transactional email',
			},
			{
				name: 'Send Template',
				value: 'sendTemplate',
				action: 'Send an email with an existing Template',
			},
		],
		routing: {
			request: {
				method: 'POST',
				url: '/v3/smtp/email',
			},
		},
		default: 'send',
	},
];

const sendHtmlEmailFields: INodeProperties[] = [
	{
		displayName: 'Send HTML',
		name: 'sendHTML',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['send'],
			},
		},
		default: false,
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['send'],
			},
		},
		routing: {
			send: {
				property: 'subject',
				type: 'body',
			},
		},
		default: '',
		description: 'Subject of the email',
	},
	{
		displayName: 'Text Content',
		name: 'textContent',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['send'],
				sendHTML: [false],
			},
		},
		routing: {
			send: {
				property: 'textContent',
				type: 'body',
			},
		},
		default: '',
		description: 'Text content of the message',
	},
	{
		displayName: 'HTML Content',
		name: 'htmlContent',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['send'],
				sendHTML: [true],
			},
		},
		routing: {
			send: {
				property: 'htmlContent',
				type: 'body',
			},
		},
		default: '',
		description: 'HTML content of the message',
	},
	{
		displayName: 'Sender',
		name: 'sender',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['send'],
			},
		},
		default: '',
		required: true,
		routing: {
			send: {
				preSend: [SendInBlueNode.Validators.validateAndCompileSenderEmail],
			},
		},
	},
	{
		displayName: 'Receipients',
		name: 'receipients',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['send'],
			},
		},
		default: '',
		required: true,
		routing: {
			send: {
				preSend: [SendInBlueNode.Validators.validateAndCompileReceipientEmails],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		placeholder: 'Add Field',
		description: 'Additional fields to add',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['send'],
			},
		},
		options: [
			{
				displayName: 'Attachments',
				name: 'emailAttachments',
				placeholder: 'Add Attachment',
				type: 'fixedCollection',
				default: {},
				options: [
					{
						name: 'attachment',
						displayName: 'Attachment Data',
						values: [
							{
								default: '',
								displayName: 'Input Data Field Name',
								name: 'binaryPropertyName',
								type: 'string',
								description:
									'The name of the incoming field containing the binary file data to be processed',
							},
						],
					},
				],
				routing: {
					send: {
						preSend: [SendInBlueNode.Validators.validateAndCompileAttachmentsData],
					},
				},
			},
			{
				displayName: 'Receipients BCC',
				name: 'receipientsBCC',
				placeholder: 'Add BCC',
				type: 'fixedCollection',
				default: {},
				options: [
					{
						name: 'receipientBcc',
						displayName: 'Receipient',
						values: [
							{
								name: 'bcc',
								displayName: 'Receipient',
								type: 'string',
								default: '',
							},
						],
					},
				],
				routing: {
					send: {
						preSend: [SendInBlueNode.Validators.validateAndCompileBCCEmails],
					},
				},
			},
			{
				displayName: 'Receipients CC',
				name: 'receipientsCC',
				placeholder: 'Add CC',
				type: 'fixedCollection',
				default: {},
				options: [
					{
						name: 'receipientCc',
						displayName: 'Receipient',
						values: [
							{
								name: 'cc',
								displayName: 'Receipient',
								type: 'string',
								default: '',
							},
						],
					},
				],
				routing: {
					send: {
						preSend: [SendInBlueNode.Validators.validateAndCompileCCEmails],
					},
				},
			},
			{
				displayName: 'Email Tags',
				name: 'emailTags',
				default: {},
				description: 'Add tags to your emails to find them more easily',
				placeholder: 'Add Email Tags',
				type: 'fixedCollection',
				options: [
					{
						displayName: 'Tags',
						name: 'tags',
						values: [
							{
								default: '',
								displayName: 'Tag',
								name: 'tag',
								type: 'string',
							},
						],
					},
				],
				routing: {
					send: {
						preSend: [SendInBlueNode.Validators.validateAndCompileTags],
					},
				},
			},
		],
	},
];

const sendHtmlTemplateEmailFields: INodeProperties[] = [
	{
		displayName: 'Template ID',
		name: 'templateId',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptions: {
				routing: {
					request: {
						method: 'GET',
						url: '/v3/smtp/templates',
						qs: {
							templateStatus: true,
							limit: 1000,
							offset: 0,
							sort: 'desc',
						},
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'templates',
								},
							},
							{
								type: 'setKeyValue',
								properties: {
									name: '={{$responseItem.name}}',
									value: '={{$responseItem.id}}',
								},
							},
							{
								type: 'sort',
								properties: {
									key: 'name',
								},
							},
						],
					},
				},
			},
		},
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['sendTemplate'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'templateId',
			},
		},
	},
	{
		displayName: 'Receipients',
		name: 'receipients',
		placeholder: 'Add Receipient',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['sendTemplate'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Receipient',
				name: 'receipient',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						routing: {
							send: {
								property: '=to[{{$index}}].name',
								type: 'body',
							},
						},
						description: 'Name of the receipient',
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
						routing: {
							send: {
								property: '=to[{{$index}}].email',
								type: 'body',
							},
						},
						description: 'Email of the receipient',
					},
				],
			},
		],
		required: true,
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		description: 'Additional fields to add',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['sendTemplate'],
			},
		},
		options: [
			{
				displayName: 'Attachments',
				name: 'emailAttachments',
				placeholder: 'Add Attachment',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						displayName: 'Attachment Data',
						name: 'attachment',
						values: [
							{
								displayName: 'Input Data Field Name',
								name: 'binaryPropertyName',
								default: '',
								type: 'string',
								description:
									'The name of the incoming field containing the binary file data to be processed',
							},
						],
					},
				],
				routing: {
					send: {
						preSend: [SendInBlueNode.Validators.validateAndCompileAttachmentsData],
					},
				},
			},
			{
				displayName: 'Email Tags',
				name: 'emailTags',
				default: {},
				description: 'Add tags to your emails to find them more easily',
				options: [
					{
						displayName: 'Tags',
						name: 'tags',
						values: [
							{
								default: '',
								displayName: 'Tag',
								name: 'tag',
								type: 'string',
								routing: {
									send: {
										property: '=tags[{{$index}}]',
										type: 'body',
									},
								},
								description: 'Tag for email you are sending',
							},
						],
					},
				],
				placeholder: 'Add Email Tags',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
			},
			{
				displayName: 'Template Parameters',
				name: 'templateParameters',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'parameterValues',
						displayName: 'Parameter',
						values: [
							{
								displayName: 'Parameter Key',
								name: 'parameterKey',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Parameter Value',
								name: 'parameterValue',
								type: 'string',
								default: '',
								routing: {
									send: {
										value: '={{$value}}',
										property: '=params.{{$parent.parameterKey}}',
										type: 'body',
									},
								},
							},
						],
					},
				],
				default: {},
				description: 'Pass the set of attributes to customize the template',
			},
		],
	},
];

export const emailFields: INodeProperties[] = [
	...sendHtmlEmailFields,
	...sendHtmlTemplateEmailFields,
];
