import { IExecuteFunctions } from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError
} from 'n8n-workflow';

import { apiRequest, apiRequestAllItems, IRecord } from './GenericFunction';
const isOnline = require('is-online');
export class Stackby implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Stackby',
		name: 'stackby',
		icon: 'file:stackby.png',
		group: ['transform'],
		version: 1,
		description: 'Read, write, and delete data in Stackby',
		defaults: {
			name: 'Stackby',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'stackbyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Append',
						value: 'append',
					},
					{
						name: 'Delete',
						value: 'delete',
					},
					{
						name: 'List',
						value: 'list',
					},
					{
						name: 'Read',
						value: 'read',
					},
				],
				default: 'append',
				placeholder: 'Action to perform',
			},
			// ----------------------------------
			//         All
			// ----------------------------------
			{
				displayName: 'Stack ID',
				name: 'stackId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the stack to access.',
			},
			{
				displayName: 'Table',
				name: 'table',
				type: 'string',
				default: '',
				placeholder: 'Stories',
				required: true,
				description: 'Enter Table Name',
			},

			// ----------------------------------
			//         read
			// ----------------------------------
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['read', 'delete'],
					},
				},
				default: '',
				required: true,
				description: 'ID of the record to return.',
			},

			// ----------------------------------
			//         list
			// ----------------------------------
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				default: true,
				description:
					'If all results should be returned or only up to a given limit.',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['list'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 1000,
				},
				default: 1000,
				description: 'Number of results to return.',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				default: {},
				placeholder: 'Add Field',
				options: [
					{
						displayName: 'View',
						name: 'view',
						type: 'string',
						default: '',
						placeholder: 'All Stories',
						description:
							'The name or ID of a view in the Stories table. If set, only the records in that view will be returned. The records will be sorted according to the order of the view.',
					},
				],
			},
			// ----------------------------------
			//         append
			// ----------------------------------
			{
				displayName: 'Columns',
				name: 'columns',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['append'],
					},
				},
				default: '',
				required: true,
				placeholder: 'id,name,description',
				description:
					'Comma separated list of the properties which should used as columns for the new rows.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const length = (items.length as unknown) as number;
		let responseData;
		const qs: IDataObject = {};
		const operation = this.getNodeParameter('operation', 0) as string;
		isOnline().then(async (online: boolean) => {
			if (online) {
				try {
					if (operation === 'read') {
						for (let i = 0; i < length; i++) {
							try {
								const stackId = this.getNodeParameter('stackId', i) as string;
								const table = encodeURI(
									this.getNodeParameter('table', i) as string,
								);
								const rowIds = this.getNodeParameter('id', i) as string;
								qs.rowIds = [rowIds];
								responseData = await apiRequest.call(
									this,
									'GET',
									`/rowlist/${stackId}/${table}`,
									{},
									qs,
								);
								// tslint:disable-next-line: no-any
								returnData.push.apply(
									returnData,
									// tslint:disable-next-line:no-any
									responseData.map((data: any) => data.field),
								);
							} catch (error) {
								if (this.continueOnFail()) {
									returnData.push({ error: error.message });
									continue;
								}
								throw error;
							}
						}
					}
					if (operation === 'delete') {
						for (let i = 0; i < length; i++) {
							try {
								const stackId = this.getNodeParameter('stackId', i) as string;
								const table = encodeURI(
									this.getNodeParameter('table', i) as string,
								);
								const rowIds = this.getNodeParameter('id', i) as string;
								qs.rowIds = [rowIds];

								responseData = await apiRequest.call(
									this,
									'DELETE',
									`/rowdelete/${stackId}/${table}`,
									{},
									qs,
								);
								responseData = responseData.records;
								returnData.push.apply(returnData, responseData);
							} catch (error) {
								if (this.continueOnFail()) {
									returnData.push({ error: error.message });
									continue;
								}
								throw error;
							}
						}
					}

					if (operation === 'append') {
						try {
							const records: { [key: string]: IRecord[] } = {};
							let key = '';
							for (let i = 0; i < length; i++) {
								const stackId = this.getNodeParameter('stackId', i) as string;
								const table = encodeURI(
									this.getNodeParameter('table', i) as string,
								);
								const columns = this.getNodeParameter('columns', i) as string;
								const columnList = columns
									.split(',')
									.map(column => column.trim());

								// tslint:disable-next-line: no-any
								const record: { [key: string]: any } = {};
								for (const column of columnList) {
									if (items[i].json[column] === undefined) {
										throw new NodeOperationError(
											this.getNode(),
											`Column ${column} does not exist on input`,
										);
									} else {
										record[column] = items[i].json[column];
									}
								}
								key = `${stackId}/${table}`;

								if (records[key] === undefined) {
									records[key] = [];
								}
								records[key].push({ field: record });
							}

							for (const key of Object.keys(records)) {
								responseData = await apiRequest.call(
									this,
									'POST',
									`/rowcreate/${key}`,
									{ records: records[key] },
								);
							}

							// tslint:disable-next-line: no-any
							returnData.push.apply(
								returnData,
								// tslint:disable-next-line:no-any
								responseData.map((data: any) => data.field),
							);
						} catch (error) {
							if (this.continueOnFail()) {
								returnData.push({ error: error.message });
							} else {
								throw error;
							}
						}
					}

					if (operation === 'list') {
						for (let i = 0; i < length; i++) {
							try {
								const stackId = this.getNodeParameter('stackId', i) as string;
								const table = encodeURI(
									this.getNodeParameter('table', i) as string,
								);
								const returnAll = this.getNodeParameter(
									'returnAll',
									0,
								) as boolean;

								const additionalFields = this.getNodeParameter(
									'additionalFields',
									i,
									{},
								) as IDataObject;

								if (additionalFields.view) {
									qs.view = additionalFields.view;
								}

								if (returnAll === true) {
									responseData = await apiRequestAllItems.call(
										this,
										'GET',
										`/rowlist/${stackId}/${table}`,
										{},
										qs,
									);
								} else {
									qs.maxrecord = this.getNodeParameter('limit', 0) as number;
									responseData = await apiRequest.call(
										this,
										'GET',
										`/rowlist/${stackId}/${table}`,
										{},
										qs,
									);
								}

								// tslint:disable-next-line: no-any
								returnData.push.apply(
									returnData,
									// tslint:disable-next-line:no-any
									responseData.map((data: any) => data.field),
								);
							} catch (error) {
								if (this.continueOnFail()) {
									returnData.push({ error: error.message });
									continue;
								}
								throw error;
							}
						}
					}
					return [this.helpers.returnJsonArray(returnData)];
				} catch (error) {
					if (error.response) {
						console.log(`Error : ${error.response}`);
					}
				}
			} else {
				console.log('we have a network problem');
			}
		});
	}
}
