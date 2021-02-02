import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription
} from 'n8n-workflow';

import {
	affiliateFields,
	affiliateOperations
} from './AffiliateDescription';

import {
	affiliateMetadataFields,
	affiliateMetadataOperations,
} from './AffiliateMetadataDescription';

import {
	programAffiliateFields,
	programAffiliateOperations,
} from './ProgramAffiliateDescription';

import {
	tapfiliateApiRequest,
	tapfiliateApiRequestAllItems,
} from './GenericFunctions';

export class Tapfiliate implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tapfiliate',
		name: 'tapfiliate',
		icon: 'file:tapfiliate.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ":" + $parameter["resource"]}}',
		description: 'Consume Tapfiliate API',
		defaults: {
			name: 'Tapfiliate',
			color: '#4a8de8',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'tapfiliateApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Affiliate',
						value: 'affiliate',
					},
					{
						name: 'Affiliate Metadata',
						value: 'affiliateMetadata',
					},
					{
						name: 'Program Affiliate',
						value: 'programAffiliate',
					},
				],
				default: 'affiliate',
				required: true,
				description: 'Resource to consume',
			},
			...affiliateOperations,
			...affiliateFields,
			...programAffiliateOperations,
			...programAffiliateFields,
			...affiliateMetadataOperations,
			...affiliateMetadataFields,
		],
	};

	methods = {
		loadOptions: {
			// Get custom fields to display to user so that they can select them easily
			async getPrograms(this: ILoadOptionsFunctions,): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const programs = await tapfiliateApiRequestAllItems.call(this, 'GET', '/programs/');
				for (const program of programs) {
					returnData.push({
						name: program.title,
						value: program.id,
					});
				}
				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const length = (items.length as unknown) as number;
		const qs: IDataObject = {};
		let responseData;
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		if (resource === 'affiliate') {
			//https://tapfiliate.com/docs/rest/#affiliates-affiliates-collection-post
			if (operation === 'create') {
				for (let i = 0; i < length; i++) {
					const firstname = this.getNodeParameter('firstname', i) as string;
					const lastname = this.getNodeParameter('lastname', i) as string;
					const email = this.getNodeParameter('email', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
					const body: IDataObject = {
						firstname,
						lastname,
						email,
					};
					Object.assign(body, additionalFields);

					if (body.addressUi) {
						body.address = (body.addressUi as IDataObject).addressValues as IDataObject;
						delete body.addressUi;
						if ((body.address as IDataObject).country) {
							(body.address as IDataObject).country = {
								code: (body.address as IDataObject).country,
							};
						}
					}

					if (body.companyName) {
						body.company = {
							name: body.companyName,
						};
						delete body.companyName;
					}

					responseData = await tapfiliateApiRequest.call(this, 'POST', '/affiliates/', body);
					returnData.push(responseData);
				}
			}
			//https://tapfiliate.com/docs/rest/#affiliates-affiliate-delete
			if (operation === 'delete') {
				for (let i = 0; i < length; i++) {
					const affiliateId = this.getNodeParameter('affiliateId', i) as string;
					responseData = await tapfiliateApiRequest.call(this, 'DELETE', `/affiliates/${affiliateId}/`);
					returnData.push({ success: true });
				}
			}
			//https://tapfiliate.com/docs/rest/#affiliates-affiliate-get
			if (operation === 'get') {
				for (let i = 0; i < length; i++) {
					const affiliateId = this.getNodeParameter('affiliateId', i) as string;
					responseData = await tapfiliateApiRequest.call(this, 'GET', `/affiliates/${affiliateId}/`);
					returnData.push(responseData);
				}
			}
			//https://tapfiliate.com/docs/rest/#affiliates-affiliates-collection-get
			if (operation === 'getAll') {
				for (let i = 0; i < length; i++) {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					Object.assign(qs, filters);
					if (returnAll) {
						responseData = await tapfiliateApiRequestAllItems.call(this, 'GET', `/affiliates/`, {}, qs);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						responseData = await tapfiliateApiRequest.call(this, 'GET', `/affiliates/`, {}, qs);
						responseData = responseData.splice(0, limit);
					}
					returnData.push.apply(returnData, responseData);
				}
			}
		}
		if (resource === 'affiliateMetadata') {
			//https://tapfiliate.com/docs/rest/#affiliates-meta-data-key-put
			if (operation === 'add') {
				for (let i = 0; i < length; i++) {
					const affiliateId = this.getNodeParameter('affiliateId', i) as string;
					const metadata = (this.getNodeParameter('metadataUi', i) as IDataObject || {}).metadataValues as IDataObject[] || [];
					if (metadata.length === 0) {
						throw new Error('Metadata cannot be empty.');
					}
					console.log(metadata);
					for (const { key, value } of metadata) {
						await tapfiliateApiRequest.call(this, 'PUT', `/affiliates/${affiliateId}/meta-data/${key}/`, { value });
					}
					returnData.push({ success: true });
				}
			}
			//https://tapfiliate.com/docs/rest/#affiliates-meta-data-key-delete
			if (operation === 'remove') {
				for (let i = 0; i < length; i++) {
					const affiliateId = this.getNodeParameter('affiliateId', i) as string;
					const key = this.getNodeParameter('key', i) as string;
					responseData = await tapfiliateApiRequest.call(this, 'DELETE', `/affiliates/${affiliateId}/meta-data/${key}/`);
					returnData.push({ success: true });
				}
			}
			//https://tapfiliate.com/docs/rest/#affiliates-notes-collection-get
			if (operation === 'update') {
				for (let i = 0; i < length; i++) {
					const affiliateId = this.getNodeParameter('affiliateId', i) as string;
					const key = this.getNodeParameter('key', i) as string;
					const value = this.getNodeParameter('value', i) as string;
					responseData = await tapfiliateApiRequest.call(this, 'PUT', `/affiliates/${affiliateId}/meta-data/`, { [key]: value });
					returnData.push(responseData);
				}
			}
		}
		if (resource === 'programAffiliate') {
			//https://tapfiliate.com/docs/rest/#programs-program-affiliates-collection-post
			if (operation === 'add') {
				for (let i = 0; i < length; i++) {
					const programId = this.getNodeParameter('programId', i) as string;
					const affiliateId = this.getNodeParameter('affiliateId', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
					const body: IDataObject = {
						affiliate: {
							id: affiliateId,
						},
					};
					Object.assign(body, additionalFields);

					responseData = await tapfiliateApiRequest.call(this, 'POST', `/programs/${programId}/affiliates/`, body);
					returnData.push(responseData);
				}
			}
			//https://tapfiliate.com/docs/rest/#programs-approve-an-affiliate-for-a-program-put
			if (operation === 'approve') {
				for (let i = 0; i < length; i++) {
					const programId = this.getNodeParameter('programId', i) as string;
					const affiliateId = this.getNodeParameter('affiliateId', i) as string;
					responseData = await tapfiliateApiRequest.call(this, 'PUT', `/programs/${programId}/affiliates/${affiliateId}/approved/`);
					returnData.push(responseData);
				}
			}
			//https://tapfiliate.com/docs/rest/#programs-approve-an-affiliate-for-a-program-delete
			if (operation === 'disapprove') {
				for (let i = 0; i < length; i++) {
					const programId = this.getNodeParameter('programId', i) as string;
					const affiliateId = this.getNodeParameter('affiliateId', i) as string;
					responseData = await tapfiliateApiRequest.call(this, 'DELETE', `/programs/${programId}/affiliates/${affiliateId}/approved/`);
					returnData.push(responseData);
				}
			}
			//https://tapfiliate.com/docs/rest/#programs-affiliate-in-program-get
			if (operation === 'get') {
				for (let i = 0; i < length; i++) {
					const programId = this.getNodeParameter('programId', i) as string;
					const affiliateId = this.getNodeParameter('affiliateId', i) as string;
					responseData = await tapfiliateApiRequest.call(this, 'GET', `/programs/${programId}/affiliates/${affiliateId}/`);
					returnData.push(responseData);
				}
			}
			//https://tapfiliate.com/docs/rest/#programs-program-affiliates-collection-get
			if (operation === 'getAll') {
				for (let i = 0; i < length; i++) {
					const programId = this.getNodeParameter('programId', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					Object.assign(qs, filters);
					if (returnAll) {
						responseData = await tapfiliateApiRequestAllItems.call(this, 'GET', `/programs/${programId}/affiliates/`, {}, qs);
					} else {
						const limit = this.getNodeParameter('limit', i) as number;
						responseData = await tapfiliateApiRequest.call(this, 'GET', `/programs/${programId}/affiliates/`, {}, qs);
						responseData = responseData.splice(0, limit);
					}
					returnData.push.apply(returnData, responseData);
				}
			}
		}
		return [this.helpers.returnJsonArray(returnData)];
	}
}
